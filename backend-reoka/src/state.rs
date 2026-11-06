use std::sync::Arc;

use sqlx::PgPool;

use crate::{identity::TokenService, zalo::ZaloClient};

/// Shared dependencies, cloned cheaply into every request.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub zalo: Arc<dyn ZaloClient>,
    pub tokens: TokenService,
}
