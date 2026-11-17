# Status

Last reviewed: 2026-11-16. If this looks stale, check `git log` and the code.

## Built

| Area | State | Where |
|---|---|---|
| Backend skeleton | Config, errors, tracing (request span logs `origin`), CORS with `*` option, graceful shutdown, migrations at startup | `backend-reoka/src/` |
| `identity` | Zalo login, first-login user creation, one-hour JWT. **Verified end to end with a real Zalo token on 2026-11-17** (Development deploy, iOS, via a tunnel). | `src/identity/` |
| `pet` | Create, list and get, scoped by owner | `src/pet/mod.rs` |
| `zalo` | Token verification only | `src/zalo/mod.rs` |
| Tests | 8 end-to-end tests with real Postgres and fake Zalo; config unit tests | `tests/app_flow.rs`, `src/config.rs` |
| Design | Template D chosen, 17 screens | `design/ui/template-d-ket-hop.html` |
| Mini App | Brand tokens and Lexend; API client with in-memory session and silent re-login; `SessionGate` login screen; home with greeting and pet list. No card, tabs or other screens. | `mini-app-reoka/src/` |

## Not built

- Backend: `clinic`, `medical`, `reminder`, `audit` (doc comment only), `/clinic` and `/public` routers.
- Backend on `pet`: edit, archive, delete, photos.
- Backend on `identity`: profile read and edit, phone number exchange, password login.
- Zalo: phone exchange, ZNS, OA token refresh.
- OpenAPI (`utoipa`) and the generated TypeScript client.
- Mini App: every real screen beyond the first cut of the home page, including add pet and the pet card.
- B2B web app: no directory yet.
- Deployment: no Dockerfile or CI, no hosting chosen.
- Object storage: MinIO chosen (D25), not set up. No container in `compose.yaml`, no client in the backend.

## Testing on a phone

Run the backend with `CORS_ALLOWED_ORIGINS='*'`, start `cloudflared tunnel --url http://localhost:8080`, put the tunnel URL in `mini-app-reoka/.env` as `VITE_API_BASE_URL`, then `zmp deploy` (Development) and scan the QR with the Zalo app. The tunnel URL changes whenever cloudflared restarts, which also means a redeploy. Details and gotchas in `zalo.md` and `mini-app-reoka/README.md`.

## Not verified


## Suggested order

1. Mini App shell: bottom tab bar with the five tabs from `screens.md`; unbuilt tabs show a placeholder.
2. Add pet, screens 6 and 7, without photos, on the existing `POST /app/pets`. Then a user can create real data on a device.
3. Pet card component (two faces, bank-card ratio), reused by screens 1, 2, 3, 4 and 8. Then home with the card (1, 2), wallet (3), pet detail and QR (4, 5).
4. Extend `pet` (card code per D24, photos in MinIO per D25, other fields in `screens.md`) and `identity` (profile, address) to match Template D.
5. Build `clinic`, including `ClinicPetAccess`, then `medical` and `audit`.
6. Build `reminder` with ZNS. ZNS needs an OA and approved templates, so start the paperwork early.
7. Build the public QR page, then the remaining Mini App screens.

## Open questions

Ask the user. Do not decide silently.

| # | Question | Blocks |
|---|---|---|
| 1 | Can a clinic edit or delete a record another clinic wrote? Reading is allowed (D21). | `medical` write rules |
| 2 | What does a clinic see after scanning the QR, before the owner approves? Pet name and card code only? Does the request expire? | `clinic` access flow (D12) |
| 3 | How are staff accounts created and invited, on the Mini App and on the web? | `clinic`, web login |
| 4 | How is the card code generated: format (`RK-` plus how many characters?), random or sequential? It is separate from `public_code` (D24). Suggestion: random, from an alphabet without look-alike characters, unique, retried on collision. | `pet` schema |
| 5 | Does permanently deleting a pet remove clinic-written records? | `pet` delete, `medical` |
| 6 | Where is the backend hosted? Photos go to MinIO (D25). | Deployment |
| 7 | Which logo concept wins? `design/README.md` still lists all five as pending, but concept 02 (Health Shield) is already uploaded as the Mini App and Zalo App icon. | Branding only |
