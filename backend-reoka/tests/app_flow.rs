//! End-to-end tests of the Mini App API, using a real database and a fake Zalo.
//! `#[sqlx::test]` gives each test its own database with migrations applied.

use std::sync::Arc;

use async_trait::async_trait;
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode, header},
};
use backend_reoka::{
    http::router,
    identity::TokenService,
    state::AppState,
    zalo::{ZaloClient, ZaloError, ZaloProfile},
};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sqlx::PgPool;
use tower::ServiceExt;

const TEST_SECRET: &str = "test-secret-that-is-long-enough-for-hs256";

/// Accepts tokens of the form `valid-<zalo id>` and rejects everything else.
struct FakeZalo;

#[async_trait]
impl ZaloClient for FakeZalo {
    async fn get_profile(&self, access_token: &str) -> Result<ZaloProfile, ZaloError> {
        let id = access_token
            .strip_prefix("valid-")
            .ok_or(ZaloError::InvalidToken)?;
        Ok(ZaloProfile {
            id: id.to_string(),
            name: Some(format!("User {id}")),
        })
    }
}

fn app(db: PgPool) -> Router {
    router(
        AppState {
            db,
            zalo: Arc::new(FakeZalo),
            tokens: TokenService::new(TEST_SECRET),
        },
        vec![],
    )
}

async fn send(
    app: &Router,
    method: &str,
    uri: &str,
    token: Option<&str>,
    body: Option<Value>,
) -> (StatusCode, Value) {
    let mut request = Request::builder().method(method).uri(uri);
    if let Some(token) = token {
        request = request.header(header::AUTHORIZATION, format!("Bearer {token}"));
    }
    let request = match body {
        Some(body) => request
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(body.to_string())),
        None => request.body(Body::empty()),
    }
    .unwrap();

    let response = app.clone().oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(Value::Null),
    )
}

async fn login(app: &Router, zalo_id: &str) -> Value {
    let (status, body) = send(
        app,
        "POST",
        "/app/auth/zalo",
        None,
        Some(json!({ "access_token": format!("valid-{zalo_id}") })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    body
}

fn pet_body() -> Value {
    json!({ "name": "Milu", "species": "dog", "gender": "female", "birth_date": "2024-03-01" })
}

#[sqlx::test]
async fn login_create_pet_and_read_it_back(db: PgPool) {
    let app = app(db);
    let session = login(&app, "alice").await;
    let token = session["token"].as_str().unwrap();

    let (status, created) = send(&app, "POST", "/app/pets", Some(token), Some(pet_body())).await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(created["name"], "Milu");
    assert_eq!(created["gender"], "female");
    assert_eq!(created["owner_id"], session["user"]["id"]);
    assert_eq!(created["public_code"].as_str().unwrap().len(), 16);

    let uri = format!("/app/pets/{}", created["id"].as_str().unwrap());
    let (status, fetched) = send(&app, "GET", &uri, Some(token), None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(fetched, created);

    let (status, list) = send(&app, "GET", "/app/pets", Some(token), None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list, json!([created]));
}

#[sqlx::test]
async fn same_zalo_id_logs_in_as_same_user(db: PgPool) {
    let app = app(db);
    let first = login(&app, "alice").await;
    let second = login(&app, "alice").await;
    assert_eq!(first["user"]["id"], second["user"]["id"]);
}

#[sqlx::test]
async fn concurrent_first_logins_create_one_user(db: PgPool) {
    let app = app(db.clone());
    let (first, second) = tokio::join!(login(&app, "alice"), login(&app, "alice"));
    assert_eq!(first["user"]["id"], second["user"]["id"]);

    let users = sqlx::query_scalar!(r#"SELECT count(*) AS "count!" FROM users"#)
        .fetch_one(&db)
        .await
        .unwrap();
    assert_eq!(users, 1);
}

#[sqlx::test]
async fn invalid_zalo_token_is_rejected(db: PgPool) {
    let app = app(db);
    let (status, body) = send(
        &app,
        "POST",
        "/app/auth/zalo",
        None,
        Some(json!({ "access_token": "forged" })),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["error"]["code"], "unauthorized");
}

#[sqlx::test]
async fn pet_routes_require_a_valid_token(db: PgPool) {
    let app = app(db);
    let (status, _) = send(&app, "GET", "/app/pets", None, None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let (status, _) = send(&app, "GET", "/app/pets", Some("not-a-jwt"), None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    // Correctly formed, but signed with a different secret.
    let forged = TokenService::new("another-secret-that-is-long-enough-too")
        .issue(uuid::Uuid::new_v4())
        .unwrap();
    let (status, _) = send(&app, "GET", "/app/pets", Some(&forged), None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[sqlx::test]
async fn owners_cannot_see_each_others_pets(db: PgPool) {
    let app = app(db);
    let alice = login(&app, "alice").await;
    let bob = login(&app, "bob").await;
    let alice_token = alice["token"].as_str().unwrap();
    let bob_token = bob["token"].as_str().unwrap();

    let (_, pet) = send(
        &app,
        "POST",
        "/app/pets",
        Some(alice_token),
        Some(pet_body()),
    )
    .await;

    let uri = format!("/app/pets/{}", pet["id"].as_str().unwrap());
    let (status, _) = send(&app, "GET", &uri, Some(bob_token), None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (_, list) = send(&app, "GET", "/app/pets", Some(bob_token), None).await;
    assert_eq!(list, json!([]));
}

#[sqlx::test]
async fn client_cannot_choose_the_owner(db: PgPool) {
    let app = app(db);
    let session = login(&app, "alice").await;
    let token = session["token"].as_str().unwrap();

    let mut body = pet_body();
    body["owner_id"] = json!(uuid::Uuid::new_v4());
    let (status, _) = send(&app, "POST", "/app/pets", Some(token), Some(body)).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test]
async fn invalid_pet_data_is_rejected(db: PgPool) {
    let app = app(db);
    let session = login(&app, "alice").await;
    let token = session["token"].as_str().unwrap();

    for patch in [
        json!({ "name": "   " }),
        json!({ "species": "" }),
        json!({ "gender": "robot" }),
        json!({ "birth_date": "2999-01-01" }),
        json!({ "name": "x".repeat(101) }),
    ] {
        let mut body = pet_body();
        body.as_object_mut()
            .unwrap()
            .extend(patch.as_object().unwrap().clone());
        let (status, response) = send(&app, "POST", "/app/pets", Some(token), Some(body)).await;
        assert_eq!(status, StatusCode::BAD_REQUEST, "accepted {patch}");
        assert_eq!(response["error"]["code"], "validation_error");
    }
}
