use axum::{extract::FromRequest, response::IntoResponse};

use crate::error::AppError;

/// Like `axum::Json`, but bad request bodies use our standard error format.
#[derive(FromRequest)]
#[from_request(via(axum::Json), rejection(AppError))]
pub struct ApiJson<T>(pub T);

impl<T: serde::Serialize> IntoResponse for ApiJson<T> {
    fn into_response(self) -> axum::response::Response {
        axum::Json(self.0).into_response()
    }
}
