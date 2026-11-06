//! Routes for the Zalo Mini App.

use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
};
use serde::Deserialize;
use uuid::Uuid;

use super::{auth::AuthUser, json::ApiJson};
use crate::{
    error::AppError,
    identity::{self, Session},
    pet::{self, NewPet, Pet},
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/zalo", post(login_with_zalo))
        .route("/pets", get(list_pets).post(create_pet))
        .route("/pets/{id}", get(get_pet))
}

#[derive(Deserialize)]
struct ZaloLoginRequest {
    access_token: String,
}

async fn login_with_zalo(
    State(state): State<AppState>,
    ApiJson(request): ApiJson<ZaloLoginRequest>,
) -> Result<ApiJson<Session>, AppError> {
    let session = identity::login_with_zalo(
        &state.db,
        state.zalo.as_ref(),
        &state.tokens,
        &request.access_token,
    )
    .await?;
    Ok(ApiJson(session))
}

async fn create_pet(
    State(state): State<AppState>,
    user: AuthUser,
    ApiJson(new_pet): ApiJson<NewPet>,
) -> Result<(StatusCode, ApiJson<Pet>), AppError> {
    let pet = pet::create(&state.db, user.id, new_pet).await?;
    Ok((StatusCode::CREATED, ApiJson(pet)))
}

async fn list_pets(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<ApiJson<Vec<Pet>>, AppError> {
    Ok(ApiJson(pet::list_for_owner(&state.db, user.id).await?))
}

async fn get_pet(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<ApiJson<Pet>, AppError> {
    Ok(ApiJson(pet::get_for_owner(&state.db, user.id, id).await?))
}
