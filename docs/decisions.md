# Decisions

Who decided:

- **User:** stated or chosen by the user.
- **Proposed:** suggested by an agent and included in committed docs. The user has not objected but has not explicitly confirmed. Mention it if your task depends on it heavily.

| # | Decision | Who | Why | Rejected |
|---|---|---|---|---|
| D1 | Backend in Rust | User | User wants performance and is learning Rust through this project | TypeScript with Hono: recommended first because it ships faster and shares types. The user chose Rust knowing this. Do not reopen. |
| D2 | One backend for the Mini App and the B2B web app | User | Both work on the same pets and records | Separate backends from day one |
| D3 | Modular monolith, split later if needed | User | Keeps the option to separate backends cheaply | Microservices, separate databases, event bus: premature |
| D4 | Modules by domain, routers by client | Proposed | Client-based modules would duplicate logic, since clinics write what owners read | `app` and `clinic` modules |
| D5 | Single crate with `mod`s for now | Proposed | Simpler while learning Rust. Cost: the compiler does not enforce boundaries, so reviews must. | Workspace with 7 crates now |
| D6 | Axum, SQLx, PostgreSQL | Proposed; user committed the code built on it | Relational data with audit needs; queries checked at compile time | MongoDB, an ORM |
| D7 | Local Postgres in Docker on port 5435 | Proposed | Avoids other local projects: port 5434 is taken by an unrelated container | Sharing that container |
| D8 | Our own JWT after verifying the Zalo token; one-hour lifetime, no refresh token | Proposed | Mini App can silently log in again through Zalo | Calling Zalo on each request, refresh tokens |
| D9 | Separate `auth_identities` from `users` | Proposed | Web staff log in without Zalo | `users.zalo_id` |
| D10 | `is_admin` flag; clinic roles in `clinic_staff` | Proposed | One person can be an owner and staff | `users.role` |
| D11 | The card QR never grants clinic access | User, 2026-11-16 | The QR is public: anyone with a photo of the card would get medical records. Replaces an earlier agent suggestion of granting on scan. | Grant on scan |
| D12 | At the counter, the clinic scans the card QR, which creates an access request; the owner approves it in the Mini App | User, 2026-11-16 | Owner stays in control, and the QR stays harmless when public | Grant on scan; open access for all clinics. A short-lived code was an earlier proposal, not chosen. |
| D13 | Public QR page rendered by the backend on the web | Proposed | Opens from any camera app without Zalo | Mini App-only page |
| D14 | Clinics use the Mini App first, web app later | Proposed | User said the web app comes later | Web app in the MVP |
| D15 | `reminders` table as the job queue, using `FOR UPDATE SKIP LOCKED` | Proposed | No extra infrastructure | Redis, a broker |
| D16 | Hand-written Zalo client behind a trait | Proposed | No official Rust SDK known; few endpoints; tests must not send paid messages | Third-party crates |
| D17 | `audit_log` written in the same transaction | Proposed | `updated_by` alone loses history | Only `updated_by` columns |
| D18 | Template D is the final UI | User | `design/README.md` | Templates A, B, C |
| D19 | zmp-ui plus Tailwind in the Mini App | Proposed | Native feel in Zalo, and already in the scaffold | Custom component library |
| D20 | Repo docs in English, app copy in Vietnamese, chat with the user in Vietnamese | User | | |
| D21 | A clinic with active access reads the pet's whole medical and vaccination history, including records written by other clinics | User, 2026-11-16 | One health book per pet, as in the mockups | Clinics see only their own records |
| D22 | Mini App keeps the session token in memory only; on 401 it logs in again through Zalo once and retries | Proposed | Follows D8. Nothing to clear or leak from storage | `nativeStorage` or `localStorage` |
| D23 | `CORS_ALLOWED_ORIGINS=*` allows any origin | Proposed | The Mini App's origin inside Zalo is unknown. Auth is a bearer header, not a cookie, so any-origin does not let other sites act as a user. List real origins before going live. | |
| D24 | The card code (`#RK-0215` on the card) is a short code separate from `public_code` | User, 2026-11-17 | Easy to read out at a counter, while the QR keeps a long unguessable `public_code`. Generation is open question 4. | Showing part of `public_code` |
| D25 | Pet photos and attachments go to MinIO, accessed through the S3 API | User, 2026-11-17 | S3-compatible, so moving to AWS S3 or another provider later is a config change. Keep the backend on a generic S3 client and store object keys, not URLs, in the database. | Files in Postgres; local disk |

Deferred until needed: OpenAPI generation, hosting, password login for web staff.
