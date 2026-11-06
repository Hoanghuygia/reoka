# backend-reoka

API server and reminder worker for Reoka. It serves the Zalo Mini App, the planned B2B clinic web app and the public QR page. See the [root README](../README.md) for the product, roles and data model.

> **Status:** the first flow works: Zalo login → create a pet → read it back. `identity`, `pet` and `zalo` are built, and `clinic`, `medical`, `reminder` and `audit` are placeholders. Sections below also describe the agreed design for parts not built yet.

## Stack

| Concern | Choice |
|---|---|
| Language | Rust |
| Web framework | Axum |
| Database | PostgreSQL |
| Database access and migrations | SQLx (compile-time checked queries) |
| API contract (planned) | OpenAPI generated with `utoipa`; TypeScript clients are generated from it |
| Background jobs (planned) | The `reminder` table used as a queue, claimed with `FOR UPDATE SKIP LOCKED` |
| Zalo | Hand-written client on `reqwest` + `serde`, since there is no official Rust SDK that we know of |

Not decided yet: hosting and object storage for pet photos.

## Architecture

A **modular monolith**: one deployable, one database, with strict boundaries between modules.

Modules are split by **domain, not by client**. The Mini App and the web app work on the same pets, records and vaccinations, so each client gets its own router on top of shared modules.

### Layout

```
backend-reoka/
├── Cargo.toml
├── compose.yaml       # Local PostgreSQL
├── migrations/        # One file per change, named after the owning module
├── .sqlx/             # Query metadata for offline builds (committed)
├── tests/             # End-to-end API tests
└── src/
    ├── main.rs        # Starts the HTTP server (and later the reminder worker)
    ├── lib.rs         # Module list
    ├── config.rs      # Environment variables
    ├── error.rs       # AppError, mapped to HTTP responses in one place
    ├── state.rs       # Shared dependencies
    ├── http/          # Routers: /app (Mini App); later /clinic (B2B), /public (QR page)
    ├── identity/      # Users, login identities, session tokens
    ├── pet/           # Pets, public codes
    ├── zalo/          # Zalo API client; later ZNS and OA token refresh
    ├── clinic/        # Placeholder: clinics, staff, access to pets
    ├── medical/       # Placeholder: medical records, vaccinations
    ├── reminder/      # Placeholder: reminder scheduling, delivery, retries
    └── audit/         # Placeholder: audit log
```

### API so far

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | None | Checks the database connection |
| `POST` | `/app/auth/zalo` | None | Exchanges a Zalo access token for a session |
| `POST` | `/app/pets` | Bearer | Creates a pet for the logged-in user |
| `GET` | `/app/pets` | Bearer | Lists the user's pets |
| `GET` | `/app/pets/{id}` | Bearer | Gets one of the user's pets |

Errors have the form `{"error": {"code": "...", "message": "..."}}`.

The project starts as a single crate with one `mod` per module, because it is also being used to learn Rust.

### Module rules

- Every table belongs to exactly one module. Other modules go through that module's public functions and never query its tables.
- Foreign keys across modules are allowed. All modules share one database.
- HTTP handlers stay thin: parse the request, call a module, map the result. Business rules live in modules.
- No separate databases, event bus or message broker until a real need appears.

### Splitting later

1. Move each module into its own crate in a Cargo workspace. Boundaries are then enforced by the compiler.
2. Add a binary per backend, for example `api-app`, `api-clinic` and `worker`, reusing those crates and the same database.

## Authentication

**Mini App**

1. The Mini App sends its Zalo access token to the backend.
2. The backend verifies it with Zalo, gets the Zalo user ID and creates the user on first login. The name is optional, because Zalo only provides it after the user grants the `scope.userInfo` permission.
3. The backend issues its own one-hour JWT, sent as a Bearer token. When it expires, the Mini App logs in again the same way.
4. For the phone number (not built yet), the Mini App sends the token from `getPhoneNumber()`, and the backend exchanges it using the app secret.

**B2B web app**

Staff log in without Zalo and hold the session in an `httpOnly` cookie. Both clients share the same authorization code.

The Zalo app secret and OA tokens stay on the backend and are never sent to a client.

## Authorization

These rules are the most important in the codebase. The compiler will not catch a mistake here, so each needs integration tests.

- **Clinic isolation:** every `/clinic` query is scoped by the `clinic_id` from the session, never one supplied by the client.
- **Pet access:** a clinic reads or writes a pet's records only with an active `ClinicPetAccess` row.
- **Granting access:** only the owner grants access, by approving a request or showing a short-lived code. The `public_code` is public and never grants access. Searching by phone number or pet code never reveals records on its own.
- **Owners:** an owner reads only their own pets, and cannot edit medical or vaccination data.
- **Public page:** returns an explicit allowlist of fields, and looks pets up only by `public_code`.
- **Audit:** each change to medical or vaccination data writes an audit row in the same transaction.

## Reminders

1. Saving a vaccination or revisit creates its reminders in the same transaction. Changing the date cancels the pending ones and creates new ones.
2. The unique key on `type`, `ref_id`, `remind_at` prevents duplicate rows.
3. The worker claims due `pending` reminders with `FOR UPDATE SKIP LOCKED`, sends them and records the result.
4. Failures retry up to a limit, tracked in `attempts`, and then become `failed`.

## Zalo integration

The client needs to cover four things. Check endpoints, token lifetimes and error codes against the current Zalo docs while implementing them.

- Verify an access token and get the Zalo user ID (built).
- Exchange a phone number token.
- Send ZNS template messages.
- Refresh the OA access token.

Things to watch:

- **Token verification:** the client calls `GET https://graph.zalo.me/v2.0/me` with `access_token` and `appsecret_proof` headers, where the proof is the hex HMAC-SHA256 of the token keyed with the app secret. Official Zalo docs for this call were not found; this follows the Zalo PHP SDK and community code. A bogus token is rejected with error `452`, but a real token has not been tested yet.
- **App secret proof:** turn on the matching setting in the Zalo App, so tokens issued to other apps are refused. Without it, the backend may accept them. Confirm this behaviour when testing with real tokens.
- **OA token refresh:** store tokens in the database and lock the row while refreshing, so concurrent refreshes cannot invalidate each other.
- **ZNS prerequisites:** ZNS is charged per message and needs an OA and approved templates. Start this paperwork early.
- **Testing:** put the client behind a `ZaloClient` trait, so tests use a fake and never send paid messages.

## Development

Prerequisites: [Rust via rustup](https://rustup.rs), Docker, and the SQLx CLI:

```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
```

First-time setup, from `backend-reoka/`:

```bash
cp .env.example .env     # Then fill in JWT_SECRET and ZALO_APP_SECRET
docker compose up -d     # PostgreSQL on localhost:5435
sqlx migrate run
```

Day to day:

```bash
cargo run                # Applies pending migrations, serves on localhost:8080
cargo test               # Needs the database: each test gets its own
cargo fmt
cargo clippy --all-targets -- -D warnings
```

After adding or changing a migration or a `query!` macro:

```bash
sqlx migrate run
cargo sqlx prepare -- --all-targets   # Commit the changes in .sqlx/
```

SQLx checks queries against the database in `DATABASE_URL` at compile time. To build without a database, set `SQLX_OFFLINE=true`, which uses `.sqlx/`.

Configuration comes from environment variables in a git-ignored `.env`. `.env.example` lists them.
