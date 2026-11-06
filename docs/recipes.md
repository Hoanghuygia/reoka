# Recipes

Paths are relative to `backend-reoka/`. Commands are in `/AGENTS.md`.

## Definition of done (backend)

1. `cargo fmt`, `cargo clippy --all-targets -- -D warnings` and `cargo test` pass.
2. New behavior has a test in `tests/`. Anything touching a security invariant in `AGENTS.md` has a test trying to break it.
3. If queries changed, `cargo sqlx prepare -- --all-targets` was run. `.sqlx/` is part of the change.
4. `docs/` is updated. See `docs/README.md`.
5. New environment variables are in `.env.example`.

## Add an endpoint to an existing module

1. Add a `pub async fn` to the module, taking `&PgPool` and IDs. Return `Result<_, AppError>`. Put validation and SQL here.
2. Scope the query by the caller: `WHERE id = $1 AND owner_id = $2`. Return `NotFound`, not a 403, for rows the caller may not see.
3. Add a thin handler and route in `src/http/app.rs`. Use `AuthUser` and `ApiJson`.
4. Add tests to `tests/app_flow.rs`: the success path, no token, and another user's data.
5. Add it to the API table in `backend-reoka/README.md`.

## Add a migration

```bash
sqlx migrate add --sequential <module>_<change>   # Run from backend-reoka/
sqlx migrate run
cargo sqlx prepare -- --all-targets
```

- Start the file with a comment naming the owning module.
- Never edit an applied migration. Add a new one.
- Prefer `text` with `CHECK` over Postgres enums.
- Add indexes for foreign keys you filter on.
- `cargo run` also applies pending migrations, but compile-time checks need them applied first, so run `sqlx migrate run` before building.

## Build out a placeholder module (`clinic`, `medical`, ...)

1. Read its table list in `architecture.md` and its entity in `domain.md`.
2. Write the migration, adding only fields the task needs.
3. Follow `src/pet/mod.rs`: public types, public functions, private validation helpers, and a module doc comment naming the tables it owns.
4. Export only what others need. Other modules get functions, never table access.
5. For writes that must commit with audit rows or reminders, see Cross-module transactions in `architecture.md`.

## Add the `/clinic` or `/public` router

1. Create `src/http/clinic.rs` with `pub fn router() -> Router<AppState>`, like `app.rs`.
2. Add `mod clinic;` and `.nest("/clinic", clinic::router())` in `src/http/mod.rs`.
3. For `/clinic`, add an extractor beside `AuthUser` that resolves `clinic_id` from `clinic_staff` on the server. Staff in several clinics are undefined so far: ask. Never accept `clinic_id` from the client.
4. For `/public`, look up by `public_code` only, and return a dedicated struct with allowlisted fields. Never reuse `pet::Pet`, which includes `owner_id`.

## Add a Zalo call

1. Read `docs/zalo.md`, then check current docs. Record what you verify.
2. Add a method to the `ZaloClient` trait, and implement it on `HttpZaloClient`.
3. Add it to `FakeZalo` in `tests/app_flow.rs`.
4. Never log tokens or secrets.
5. Set a timeout (the shared client has 10 seconds), and do not call Zalo inside a database transaction.

## Build a Mini App screen

1. Read the screen and its caption in `design/ui/template-d-ket-hop.html`, and its row in `docs/screens.md`.
2. Check the conflicts in `docs/screens.md`.
3. Use zmp-ui components and Tailwind tokens. The tokens must be added first, as `tailwind.config.js` has none. Copy is Vietnamese.
4. Register routes in `src/components/layout.tsx`. Use Jotai for shared state.

## Gotchas

- **Cargo not found:** run `export PATH="$HOME/.cargo/bin:$PATH"`. The agent shell may not load the profile.
- **Compile errors about a table or `DATABASE_URL`:** SQLx needs the database at compile time. Run `docker compose up -d` and `sqlx migrate run`, or set `SQLX_OFFLINE=true`.
- **`cargo sqlx prepare` diff in `.sqlx/`:** expected. Commit it.
- **`RequestBuilder::query` is missing:** reqwest 0.13 puts it behind a `query` feature, which is off. The query string is in the URL constant.
- **jsonwebtoken panics or fails to build without a provider:** it needs the `rust_crypto` feature, which is on.
- **hmac 0.13:** `new_from_slice` needs `use hmac::KeyInit`.
- **Text enums in `query_as!`:** read with `gender AS "gender: Gender"`, and bind with `value as Gender`.
- **`#[sqlx::test]`:** creates a database per test, so the `DATABASE_URL` user needs `CREATEDB`. The compose user has it.
- **Port 5434 and the `stickified-*` containers:** unrelated project. Do not touch them. Reoka uses 5435.
- **`.codegraph/`:** a local code index tool. Not a source of truth.
- **`mini-app-reoka` scripts:** `npm start` needs the Zalo Mini App CLI globally. `zmp-cli.json` is template leftovers with a foreign path.
