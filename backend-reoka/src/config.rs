use std::env;

use axum::http::HeaderValue;

const MIN_JWT_SECRET_LEN: usize = 32;

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("missing environment variable {0}")]
    Missing(&'static str),
    #[error("invalid environment variable {0}: {1}")]
    Invalid(&'static str, String),
}

/// Runtime configuration. Deliberately has no `Debug`, so secrets can't end up in logs.
pub struct Config {
    pub database_url: String,
    pub bind_addr: String,
    pub jwt_secret: String,
    pub zalo_app_secret: String,
    pub cors_allowed_origins: Vec<HeaderValue>,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let jwt_secret = required("JWT_SECRET")?;
        if jwt_secret.len() < MIN_JWT_SECRET_LEN {
            return Err(ConfigError::Invalid(
                "JWT_SECRET",
                format!("must be at least {MIN_JWT_SECRET_LEN} characters"),
            ));
        }

        Ok(Self {
            database_url: required("DATABASE_URL")?,
            bind_addr: env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:8080".to_string()),
            jwt_secret,
            zalo_app_secret: required("ZALO_APP_SECRET")?,
            cors_allowed_origins: parse_origins(
                &env::var("CORS_ALLOWED_ORIGINS").unwrap_or_default(),
            )?,
        })
    }
}

fn required(name: &'static str) -> Result<String, ConfigError> {
    match env::var(name) {
        Ok(value) if !value.is_empty() => Ok(value),
        _ => Err(ConfigError::Missing(name)),
    }
}

fn parse_origins(raw: &str) -> Result<Vec<HeaderValue>, ConfigError> {
    raw.split(',')
        .map(str::trim)
        .filter(|origin| !origin.is_empty())
        .map(|origin| {
            HeaderValue::from_str(origin)
                .map_err(|_| ConfigError::Invalid("CORS_ALLOWED_ORIGINS", origin.to_string()))
        })
        .collect()
}
