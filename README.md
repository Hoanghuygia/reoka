# reoka

**Reoka** is a **Zalo Mini App** for pet management: it stores pet health records, sends revisit/re-vaccination reminders via Zalo, and provides an **online pet card** with a QR code. A **B2B web app** for veterinary clinics is planned and will share the same backend.

> **Status:** early stage. The Mini App is a scaffold and `backend-reoka/` so far covers Zalo login and pets, without the Mini App calling it yet. Sections below describe the planned product unless stated otherwise.

## Goals

- Give pet owners a single place to view their pets' profiles, medical history and vaccination history.
- Let veterinary clinics / pet shops record medical and vaccination information as the source of truth. **Only clinics/pet shops can edit** this information.
- Remind pet owners of upcoming re-vaccinations and revisits through Zalo notifications.
- Give every pet an online card with a QR code for quick lookup of its vaccination information.
- Later, give clinics a web app to manage their day-to-day work, on the same backend and data.

## Roles

| Role | Description | Main permissions |
|---|---|---|
| **Pet owner (Owner)** | Zalo user who signs up through the Mini App | Create an account, add/edit basic pet info, view medical & vaccination history, view the pet card, receive notifications |
| **Clinic / Pet shop (Clinic)** | Staff of a veterinary clinic or pet shop, using the Mini App first and the B2B web app later | For pets their clinic has access to: add and edit medical history and vaccinations, schedule re-vaccinations/revisits |
| **QR scanner (Public)** | Anyone who scans the QR code on a pet card | View the pet's public vaccination page only |
| **Administrator (Admin)** | Reoka operations team | Manage clinics/pet shops and account permissions |

## Main flow

1. **First visit:** The pet owner opens the Reoka Zalo Mini App and creates an account (Zalo login).
2. **Add a pet:** The owner adds a pet to their account (name, species, breed, birth date, gender, photo, ...).
3. **Link with a clinic:** The owner grants the clinic access to the pet's profile, by approving a request in the app or showing a short-lived code. The public QR on the pet card does not grant this access.
4. **After the visit:** The clinic records information in the pet's profile:
   - Diagnosis, symptoms, treatment, prescription, notes.
   - Vaccination: vaccine type, clinic/pet shop that administered it, vaccination date, re-vaccination due date.
   - Revisit appointment (if any).
5. **Reminders:** Before/on the re-vaccination or revisit date, the system notifies the owner via Zalo (ZNS / OA message).
6. **Lookup:** The owner views medical history, vaccination schedule and the pet card in the app.
7. **QR scan:** Scanning the QR on the card opens a page showing the pet's vaccination information.

## Features

### For pet owners
- Log in with a Zalo account.
- Manage the pet list (add, edit basic info).
- View medical history (read-only).
- View vaccination history & upcoming re-vaccinations (read-only).
- **Online pet card** containing:
  - Photo, name, species, breed, gender, birth date
  - Owner name, contact phone, address
  - QR code linking to the vaccination information page
- Receive re-vaccination / revisit reminders via Zalo.

### For clinics / pet shops
- Log in with an authorized clinic account.
- Find a pet by QR code, pet code or owner's phone number. Finding a pet does not reveal its records; the owner must grant access first.
- Add / edit medical records.
- Add / edit vaccinations and re-vaccination dates.
- Schedule revisits.
- Every change is audited (who edited, when) for transparency.

### Public QR page
- Shows basic pet info and vaccination history.
- Does not expose sensitive data (owner phone/address can be hidden).
- The QR encodes a random, unguessable identifier, never an internal ID.

## Data permissions

The Clinic column applies only to pets the clinic has been granted access to.

| Data | Owner | Clinic | Public (QR) |
|---|---|---|---|
| Basic pet info | View / Edit | View | View (limited) |
| Owner info | View / Edit | View | Hidden or limited |
| Medical history | View | View / Add / Edit | No |
| Vaccinations | View | View / Add / Edit | View |
| Re-vaccination / revisit schedule | View | View / Add / Edit | View (re-vaccination) |

## Data model (draft)

- **User**: `id`, `name`, `phone`, `address`, `is_admin`. One person can be both a pet owner and clinic staff.
- **AuthIdentity**: `id`, `user_id`, `provider` (zalo / password), `provider_uid`, `password_hash`. Separates a person from how they log in, so web staff accounts need no Zalo ID.
- **Clinic**: `id`, `name`, `address`, `phone`
- **ClinicStaff**: `user_id`, `clinic_id`, `role`
- **Pet**: `id`, `owner_id`, `name`, `species`, `breed`, `gender`, `birth_date`, `color`, `avatar`, `public_code` (used for the QR)
- **ClinicPetAccess**: `clinic_id`, `pet_id`, `granted_at`, `granted_by`, `revoked_at`
- **MedicalRecord**: `id`, `pet_id`, `clinic_id`, `visit_date`, `symptoms`, `diagnosis`, `treatment`, `prescription`, `notes`, `next_visit_date`, `created_by`, `updated_by`
- **Vaccination**: `id`, `pet_id`, `clinic_id`, `vaccine_name`, `dose`, `vaccinated_at`, `next_due_date`, `notes`, `created_by`, `updated_by`
- **Reminder**: `id`, `pet_id`, `type` (vaccination / revisit), `ref_id`, `remind_at`, `status` (pending / sent / failed / cancelled), `attempts`. Unique on `type`, `ref_id`, `remind_at`.
- **AuditLog**: `id`, `actor_id`, `clinic_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `created_at`

## Reminder notifications

- Reminders are created when a vaccination or revisit is saved, and rescheduled if its date changes.
- A scheduled job picks up reminders that are due.
- Notifications are sent to owners via **Zalo Notification Service (ZNS)** or **Zalo OA** messages.
- Multiple reminder points are supported, e.g. 3 days before, 1 day before and on the day.
- Delivery status is stored to avoid duplicates and allow retries on failure.

## Planned architecture

```
reoka/
├── mini-app-reoka/   # Zalo Mini App (Vite 5, React, TypeScript, zmp-ui, Tailwind, Jotai)
├── backend-reoka/    # Rust API server and reminder worker (see backend-reoka/README.md)
└── design/           # Brand assets: logos, banners, UI design (see design/README.md)
```

The B2B web app will get its own top-level directory when work on it starts.

- **Frontend:** Zalo Mini App (ZMP SDK + React + zmp-ui).
- **Backend:** Modular monolith in Rust (Axum, SQLx) with PostgreSQL, serving the Mini App, the B2B web app and the public QR page. Modules are split by domain, not by client, so they can later be deployed as separate backends.
- **Auth:** Zalo access token exchanged for our own session token in the Mini App; a separate login for staff on the web app. Access is checked per clinic and per pet.
- **Zalo integration:** Zalo Mini App SDK (login, user info, phone number), Zalo OA / ZNS (notifications).
- **QR:** Generated from the pet's `public_code`, pointing to a public web page rendered by the backend, so it opens from any camera app without Zalo.

## Open questions

- Can a clinic with access to a pet see records written by other clinics?
- How are staff accounts created and invited, on both the Mini App and the web app?

## Roadmap (proposed)

- [ ] **MVP**
  - [ ] Zalo login, pet owner account creation
  - [ ] Add / manage pets
  - [ ] Clinic accounts, owner-granted access to pets, add medical & vaccination records
  - [ ] Online pet card + QR code
  - [ ] Public vaccination info page via QR scan
  - [ ] Re-vaccination reminders via Zalo
- [ ] **Later phases**
  - [ ] B2B web app for clinics
  - [ ] Revisit reminders, multiple reminder points
  - [ ] Appointment booking with clinics
  - [ ] Attach photos/test results to records
  - [ ] Clinic analytics
  - [ ] Support a pet being cared for by multiple clinics
