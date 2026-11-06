# AGENTS.md

Reoka is a Zalo Mini App for pet health records, reminders and QR pet cards, with a B2B clinic web app planned on the same backend. See `README.md` for the product and `backend-reoka/README.md` for the backend design.

## Layout

- `mini-app-reoka/`: Zalo Mini App (React, TypeScript, zmp-ui, Tailwind, Jotai). Currently a scaffold.
- `backend-reoka/`: Rust backend (Axum, SQLx, PostgreSQL). Login and pets are built; clinics, medical records, reminders and audit are not.
- `design/`: brand assets and UI templates. See `design/README.md`.

## Commands

Run from `mini-app-reoka/` (`npm start` needs the Zalo Mini App CLI installed globally):

```bash
npm install
npm start         # Dev server (zmp start)
npm run build     # Production build into www/
```

Regenerate brand assets from the repo root:

```bash
node design/src/generate.mjs
```

Run from `backend-reoka/`. The database must be up for building and testing:

```bash
docker compose up -d                        # Local PostgreSQL on port 5435
cargo run                                   # Serves on localhost:8080
cargo test
cargo fmt
cargo clippy --all-targets -- -D warnings
sqlx migrate run                            # After adding a migration
cargo sqlx prepare -- --all-targets         # After changing queries; commit .sqlx/
```

## Conventions

- Write repo docs, code and comments in English. User-facing app copy is Vietnamese.
- Keep `README.md` and `backend-reoka/README.md` in step when a design decision changes.
- Edit `design/src/generate.mjs`, not the SVG/PNG files it generates.
- Never commit or print secrets. `.env` files hold real tokens and are git-ignored; only `.env.example` is committed.

## Backend rules

The owner is learning Rust through this project. Prefer simple, readable Rust over clever abstractions, avoid complex lifetimes and generics where a `.clone()` will do, and explain non-obvious Rust when reporting back.

- The backend is a modular monolith split by domain. Do not create modules per client (Mini App, web).
- Each table belongs to one module. Other modules call its public functions and never query its tables.
- Keep handlers thin. Business rules live in modules.
- Do not add a separate database, event bus, message broker or microservice without being asked.
- Do not use `.unwrap()` in request-handling code.

## Security invariants

Changes that touch these need integration tests:

- `/clinic` queries are scoped by the `clinic_id` from the session, never from client input.
- Clinics access a pet's records only with an active `ClinicPetAccess` row. Only the owner grants it.
- `public_code` is public: it never grants clinic access, and the public page returns an explicit allowlist of fields.
- Owners cannot edit medical or vaccination data.
- Changes to medical or vaccination data write an audit row in the same transaction.
- The Zalo app secret and OA tokens never reach a client.
- Tests use a fake `ZaloClient` and never send real ZNS messages, which are charged per message.
