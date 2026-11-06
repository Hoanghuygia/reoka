# Status

Last reviewed: 2026-11-06. If this looks stale, check `git log` and the code.

## Built

| Area | State | Where |
|---|---|---|
| Backend skeleton | Config, errors, tracing, CORS, graceful shutdown, migrations at startup | `backend-reoka/src/` |
| `identity` | Zalo login, first-login user creation, one-hour JWT | `src/identity/` |
| `pet` | Create, list and get, scoped by owner | `src/pet/mod.rs` |
| `zalo` | Token verification only | `src/zalo/mod.rs` |
| Tests | 8 end-to-end tests with real Postgres and fake Zalo | `tests/app_flow.rs` |
| Design | Template D chosen, 17 screens | `design/ui/template-d-ket-hop.html` |
| Mini App | **Blank template only**: "Hello world" page, no API calls, default theme | `mini-app-reoka/src/` |

## Not built

- Backend: `clinic`, `medical`, `reminder`, `audit` (doc comment only), `/clinic` and `/public` routers.
- Backend on `pet`: edit, archive, delete, photos.
- Backend on `identity`: profile read and edit, phone number exchange, password login.
- Zalo: phone exchange, ZNS, OA token refresh.
- OpenAPI (`utoipa`) and the generated TypeScript client.
- Mini App: every real screen, brand tokens, Lexend font, API client, session handling.
- B2B web app: no directory yet.
- Deployment: no Dockerfile or CI, no hosting chosen.

## Not verified

- **Login has never run with a real Zalo token.** Only a bogus token was tried against real Zalo. See `zalo.md`.
- `ZALO_APP_SECRET` in the local `backend-reoka/.env` may still be a placeholder.

## Suggested order

1. Connect the Mini App to `POST /app/auth/zalo` and test a real token. This is the largest remaining risk.
2. Resolve open questions 1 and 2 below.
3. Extend `pet` and `identity` to match Template D (`screens.md`).
4. Build `clinic`, including `ClinicPetAccess`, then `medical` and `audit`.
5. Build `reminder` with ZNS. ZNS needs an OA and approved templates, so start the paperwork early.
6. Build the public QR page, then the remaining Mini App screens.

## Open questions

Ask the user. Do not decide silently.

| # | Question | Blocks |
|---|---|---|
| 1 | Can a clinic with access to a pet see records written by other clinics? Mockups show records from two clinics in one health book, which suggests yes for owners, but says nothing about clinics. | `medical` read rules |
| 2 | How does a clinic get access at the counter, given that the card QR must not grant it? See conflict C1 in `screens.md`. | `clinic` access flow |
| 3 | How are staff accounts created and invited, on the Mini App and on the web? | `clinic`, web login |
| 4 | Is the card code (`#RK-0215`) separate from `public_code`? How is it generated? | `pet` schema |
| 5 | Does permanently deleting a pet remove clinic-written records? | `pet` delete, `medical` |
| 6 | Where do photos go, and where is the backend hosted? | Pet photos, deployment |
| 7 | Which logo concept wins? `design/README.md` still lists all five as pending. | Branding only |
