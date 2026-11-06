//! Users, login identities and session tokens. Owns `users` and `auth_identities`.

mod token;

use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::AppError,
    zalo::{ZaloClient, ZaloError, ZaloProfile},
};

pub use token::TokenService;

const PROVIDER_ZALO: &str = "zalo";

#[derive(Debug, Serialize)]
pub struct User {
    pub id: Uuid,
    pub name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Session {
    pub token: String,
    pub user: User,
}

/// Verifies a Zalo access token, creates the user on first login and starts a session.
pub async fn login_with_zalo(
    db: &PgPool,
    zalo: &dyn ZaloClient,
    tokens: &TokenService,
    access_token: &str,
) -> Result<Session, AppError> {
    let profile = zalo.get_profile(access_token).await.map_err(|e| match e {
        ZaloError::InvalidToken => AppError::Unauthorized,
        ZaloError::Upstream(reason) => {
            tracing::error!(%reason, "Zalo profile request failed");
            AppError::Upstream
        }
    })?;

    let user = find_or_create_user(db, &profile).await?;
    let token = tokens.issue(user.id)?;
    Ok(Session { token, user })
}

async fn find_or_create_user(db: &PgPool, profile: &ZaloProfile) -> Result<User, AppError> {
    if let Some(user) = find_by_zalo_id(db, &profile.id).await? {
        return Ok(user);
    }

    let mut tx = db.begin().await?;
    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (name) VALUES ($1) RETURNING id, name",
        profile.name,
    )
    .fetch_one(&mut *tx)
    .await?;

    let inserted = sqlx::query!(
        "INSERT INTO auth_identities (user_id, provider, provider_uid)
         VALUES ($1, $2, $3)
         ON CONFLICT (provider, provider_uid) DO NOTHING",
        user.id,
        PROVIDER_ZALO,
        profile.id,
    )
    .execute(&mut *tx)
    .await?
    .rows_affected();

    if inserted == 1 {
        tx.commit().await?;
        return Ok(user);
    }

    // A concurrent first login won the race: drop our user and use theirs.
    tx.rollback().await?;
    find_by_zalo_id(db, &profile.id)
        .await?
        .ok_or_else(|| AppError::Internal("Zalo identity vanished after conflict".to_string()))
}

async fn find_by_zalo_id(db: &PgPool, zalo_id: &str) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT u.id, u.name
         FROM users u
         JOIN auth_identities i ON i.user_id = u.id
         WHERE i.provider = $1 AND i.provider_uid = $2",
        PROVIDER_ZALO,
        zalo_id,
    )
    .fetch_optional(db)
    .await?;
    Ok(user)
}
