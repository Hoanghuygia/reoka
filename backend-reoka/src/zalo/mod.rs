//! Client for the Zalo server APIs.
//!
//! It sits behind the [`ZaloClient`] trait, so tests can use a fake and never
//! call Zalo.

use std::time::Duration;

use async_trait::async_trait;
use axum::http::HeaderValue;
use hmac::{Hmac, KeyInit, Mac};
use serde::Deserialize;
use sha2::Sha256;

const PROFILE_URL: &str = "https://graph.zalo.me/v2.0/me?fields=id,name";

#[derive(Debug, Clone)]
pub struct ZaloProfile {
    /// The user's ID, unique within our Zalo App.
    pub id: String,
    /// Only present once the user grants the userInfo permission.
    pub name: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum ZaloError {
    #[error("Zalo rejected the access token")]
    InvalidToken,
    #[error("Zalo request failed: {0}")]
    Upstream(String),
}

#[async_trait]
pub trait ZaloClient: Send + Sync {
    /// Verifies a user access token with Zalo and returns the profile it belongs to.
    async fn get_profile(&self, access_token: &str) -> Result<ZaloProfile, ZaloError>;
}

pub struct HttpZaloClient {
    http: reqwest::Client,
    app_secret: String,
}

impl HttpZaloClient {
    pub fn new(app_secret: String) -> Result<Self, reqwest::Error> {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .build()?;
        Ok(Self { http, app_secret })
    }

    /// Proves the call comes from the holder of the app secret. With the
    /// matching setting on in the Zalo App, tokens from other apps are refused.
    fn app_secret_proof(&self, access_token: &str) -> Result<String, ZaloError> {
        let mut mac = Hmac::<Sha256>::new_from_slice(self.app_secret.as_bytes())
            .map_err(|e| ZaloError::Upstream(e.to_string()))?;
        mac.update(access_token.as_bytes());
        Ok(hex::encode(mac.finalize().into_bytes()))
    }
}

#[derive(Deserialize)]
struct ProfileResponse {
    id: Option<String>,
    name: Option<String>,
    #[serde(default)]
    error: i64,
    message: Option<String>,
}

#[async_trait]
impl ZaloClient for HttpZaloClient {
    async fn get_profile(&self, access_token: &str) -> Result<ZaloProfile, ZaloError> {
        // The token comes from the client: it may not be a legal header value.
        let mut token_header =
            HeaderValue::from_str(access_token).map_err(|_| ZaloError::InvalidToken)?;
        token_header.set_sensitive(true);

        let response = self
            .http
            .get(PROFILE_URL)
            .header("access_token", token_header)
            .header("appsecret_proof", self.app_secret_proof(access_token)?)
            .send()
            .await
            .map_err(|e| ZaloError::Upstream(e.to_string()))?
            .error_for_status()
            .map_err(|e| ZaloError::Upstream(e.to_string()))?;

        let body: ProfileResponse = response
            .json()
            .await
            .map_err(|e| ZaloError::Upstream(e.to_string()))?;

        if body.error != 0 {
            tracing::warn!(code = body.error, message = ?body.message, "Zalo rejected a token");
            return Err(ZaloError::InvalidToken);
        }

        match body.id {
            Some(id) if !id.is_empty() => Ok(ZaloProfile {
                id,
                name: body.name,
            }),
            _ => Err(ZaloError::Upstream("response has no user id".to_string())),
        }
    }
}
