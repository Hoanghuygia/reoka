# Architecture

## System

```
Zalo Mini App ─┐                     ┌─► PostgreSQL
B2B web (later)┼─► backend-reoka ────┼─► Zalo APIs (verify token, phone, ZNS, OA)
QR page (later)┘   one binary        └─► Object storage (later, undecided)
```

- One binary, one database. The reminder worker will run in the same binary at first.
- Clients map to routers: `/app` (Mini App, exists), `/clinic` (B2B, planned), `/public` (QR page, planned).
- Repo dirs do not share code. `mini-app-reoka` is npm, `backend-reoka` is Cargo, and there is no root workspace. The API contract will connect them through OpenAPI (planned).

## Backend layers

Dependencies point downward only.

```
main.rs        wires config, pool, state, router
http/*         parse request → call module → map result; no business rules, no SQL
domain modules business rules and SQL
error, config  shared; depend on no domain module
```

`/health` in `http/mod.rs` runs a `SELECT 1` directly. That is the one exception to "no SQL in http".

## Module dependencies

Now:

```
http ──► identity ──► zalo
http ──► pet
state ──► identity::TokenService, zalo::ZaloClient
```

`pet` does not depend on `identity`: it takes `owner_id: Uuid` as an argument. Keep modules decoupled this way, and pass IDs rather than foreign module types.

Target (planned, none of it built):

```
http ──► identity, pet, clinic, medical, reminder
medical ──► clinic   (does this clinic have access to this pet?)
medical ──► reminder (create reminders in the same transaction)
medical ──► audit    (write audit rows in the same transaction)
clinic ──► pet       (does this pet exist, who owns it?)
reminder ──► zalo    (send ZNS)
```

No cycles. If a change needs one, move the shared logic down or pass data in as arguments.

## Table ownership

| Module | Tables | Exists |
|---|---|---|
| `identity` | `users`, `auth_identities` | Yes |
| `pet` | `pets` | Yes |
| `clinic` | `clinics`, `clinic_staff`, `clinic_pet_access` | No |
| `medical` | `medical_records`, `vaccinations` | No |
| `reminder` | `reminders` | No |
| `audit` | `audit_log` | No |
| `zalo` | OA token storage | No |

Only the owner queries its tables. Foreign keys across modules are allowed. Joins across modules are not: call the owner's function.

## Request flow

Authenticated route, for example `GET /app/pets/{id}`:

1. `TraceLayer` and `CorsLayer` run (`http/mod.rs`).
2. The `AuthUser` extractor reads the Bearer token and calls `TokenService::verify` (`http/auth.rs`). Failure returns `AppError::Unauthorized`.
3. The handler in `http/app.rs` calls `pet::get_for_owner(&state.db, user.id, id)`.
4. The module runs a query scoped by owner. No row returns `AppError::NotFound`, which also hides other owners' pets.
5. `ApiJson` or `AppError::into_response` writes the response.

Login, `POST /app/auth/zalo`:

1. The handler calls `identity::login_with_zalo`.
2. `ZaloClient::get_profile` verifies the token with Zalo.
3. `find_or_create_user` looks up `auth_identities`, or inserts `users` and `auth_identities` in one transaction. A race on `UNIQUE (provider, provider_uid)` is handled by rolling back and reading the winner.
4. `TokenService::issue` creates the JWT, returned as `Session { token, user }`.

## Code patterns to copy

| Need | Use | Where |
|---|---|---|
| Require login | Add `user: AuthUser` to the handler | `http/auth.rs` |
| JSON body or response | `ApiJson<T>`, not `axum::Json` | `http/json.rs` |
| Any failure | Return `AppError`; add a variant only for a new HTTP meaning | `error.rs` |
| Input validation | Private helpers in the module, not in handlers | `pet/mod.rs` |
| Reject unexpected input | `#[serde(deny_unknown_fields)]` on request structs that write data | `pet::NewPet` |
| Text enum column | `CHECK` in SQL, `sqlx::Type` with `type_name = "text"`, and `AS "col: Type"` in reads | `pet::Gender` |
| External API | Trait plus HTTP implementation; a fake in tests | `zalo/mod.rs`, `FakeZalo` |
| Shared dependency | Add a field to `AppState` | `state.rs` |

## Cross-module transactions (planned, no example yet)

Audit rows and reminders must commit with the data change. So `audit` and `reminder` functions used this way should take a connection rather than a pool:

```rust
pub async fn record(conn: &mut PgConnection, entry: AuditEntry) -> Result<(), AppError>
```

The calling module (`medical`) owns the transaction, passes `&mut *tx` to each call and commits. This keeps the "no querying other modules' tables" rule intact.

Never call Zalo inside a database transaction. The worker should claim a reminder, commit, send, then record the result.

## Splitting later

Move each module to its own crate in a Cargo workspace, then add one binary per backend reusing those crates and the same database. Module rules exist to keep this cheap. Do not do it until there is a real need (`decisions.md` D3).
