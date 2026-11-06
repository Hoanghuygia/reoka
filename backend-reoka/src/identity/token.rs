use std::sync::Arc;

use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

/// The Mini App logs in again through Zalo when its token expires.
const TOKEN_TTL_HOURS: i64 = 1;

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: Uuid,
    iat: i64,
    exp: i64,
}

/// Issues and verifies our own session tokens.
#[derive(Clone)]
pub struct TokenService {
    keys: Arc<Keys>,
}

struct Keys {
    encoding: EncodingKey,
    decoding: DecodingKey,
}

impl TokenService {
    pub fn new(secret: &str) -> Self {
        Self {
            keys: Arc::new(Keys {
                encoding: EncodingKey::from_secret(secret.as_bytes()),
                decoding: DecodingKey::from_secret(secret.as_bytes()),
            }),
        }
    }

    pub fn issue(&self, user_id: Uuid) -> Result<String, AppError> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id,
            iat: now.timestamp(),
            exp: (now + Duration::hours(TOKEN_TTL_HOURS)).timestamp(),
        };
        jsonwebtoken::encode(&Header::new(Algorithm::HS256), &claims, &self.keys.encoding)
            .map_err(|e| AppError::Internal(e.to_string()))
    }

    /// Returns the user ID of a valid token. Any invalid token is `Unauthorized`.
    pub fn verify(&self, token: &str) -> Result<Uuid, AppError> {
        jsonwebtoken::decode::<Claims>(
            token,
            &self.keys.decoding,
            &Validation::new(Algorithm::HS256),
        )
        .map(|data| data.claims.sub)
        .map_err(|_| AppError::Unauthorized)
    }
}
