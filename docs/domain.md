# Domain

## Glossary

| Term | Meaning | Vietnamese in UI |
|---|---|---|
| Owner | Zalo user who owns pets. Not a stored role: anyone with a pet. | Chủ nuôi |
| Clinic | Vet clinic or pet shop. The source of truth for medical data. | Phòng khám |
| Staff | A user linked to a clinic through `clinic_staff` | |
| Pet card | Two-sided digital card for a pet | Thẻ thú cưng |
| Wallet | List of a user's pet cards | Ví thẻ |
| `public_code` | Random 16-character ID in the QR. Public. Identifies a pet and grants nothing. | |
| Card code | Short human-readable code such as `#RK-0215`. Not in the schema yet (open question 4). | Mã thẻ |
| Health book | A pet's vaccinations, visits and attachments | Sổ sức khoẻ |
| Re-vaccination | Next dose due date | Tái chủng, tiêm lại |
| Revisit | Follow-up appointment | Tái khám |
| Reminder | Scheduled Zalo message. Different from an in-app notification. | Nhắc lịch |
| Access grant | Owner's permission for a clinic to work with a pet | |
| ZNS | Zalo Notification Service: paid template messages | |
| OA | Zalo Official Account | |

## Relations (target)

```
users 1─* auth_identities
users 1─* pets (owner_id)
users *─* clinics through clinic_staff
clinics *─* pets through clinic_pet_access
pets 1─* medical_records *─1 clinics
pets 1─* vaccinations    *─1 clinics
pets 1─* reminders ──► ref_id points to a vaccination or medical record
audit_log ──► actor, clinic, and any entity by type and id
```

## Current schema

Source of truth: `backend-reoka/migrations/`.

- `users`: `id`, `name` (nullable), `phone`, `address`, `is_admin`, timestamps.
- `auth_identities`: `user_id`, `provider` (`zalo` or `password`), `provider_uid`, `password_hash`. Unique on `provider`, `provider_uid`. `password_hash` is required exactly when the provider is `password`.
- `pets`: `owner_id`, `name`, `species`, `breed`, `gender` (`male`, `female`, `unknown`), `birth_date`, `color`, `public_code` (unique), timestamps.

## Target entities, not built

The draft is in the root `README.md` Data model section. Add fields only when the task needs them. `screens.md` lists what Template D additionally requires.

- `clinics`, `clinic_staff`
- `clinic_pet_access`: `clinic_id`, `pet_id`, `granted_at`, `granted_by`, `revoked_at`. Active means `revoked_at IS NULL`.
- `medical_records`, `vaccinations`
- `reminders`: unique on `type`, `ref_id`, `remind_at`. Status is `pending`, `sent`, `failed` or `cancelled`.
- `audit_log`

## Lifecycles

**Pet:** created by the owner → `public_code` assigned at creation → edited by the owner → (planned) archived, then restorable, or permanently deleted.

**Access grant:** none → owner grants → active → owner revokes. Revoking stops new access. What happens to records the clinic already wrote is undefined.

**Reminder:** created with its vaccination or revisit at D-3, D-1 and D-0 → `pending` → the worker claims it → `sent`, or retried up to a limit and then `failed`. Changing the date moves pending reminders to `cancelled` and creates new ones.

## Permissions

| Data | Owner | Clinic with active access | Clinic without access | Public QR |
|---|---|---|---|---|
| Basic pet info | Read, write | Read | Nothing | Allowlisted fields |
| Owner info | Read, write | Read | Nothing | Hidden unless the owner opts in |
| Medical records | Read | Read, write (see open question 1) | Nothing | Nothing |
| Vaccinations | Read | Read, write | Nothing | Read |
| Schedule | Read | Read, write | Nothing | Re-vaccination dates only |

- Admin (`users.is_admin`) manages clinics and accounts. Admin endpoints do not exist yet.
- Searching by phone, card code or QR may identify a pet, but never reveals records without active access.
- The invariants tests must protect are in `AGENTS.md`.
