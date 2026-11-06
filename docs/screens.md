# Template D screens

Source: `design/ui/template-d-ket-hop.html`. Each screen is a `<figure class="g-shot">` with a Vietnamese `<figcaption>` explaining it. Read the caption before building a screen. The mockups were not reviewed against the backend, so check the conflicts below.

## Visual tokens

Copy these from the template's `:root` into `mini-app-reoka/tailwind.config.js`. Nothing is wired up yet.

- Font: Lexend, weights 300 to 700. Base size 14.5px.
- Colors: teal `#087F8C`, teal-dark `#056570`, navy `#17324D`, mint `#DDF4EF`, mint-2 `#C5EAE2`, page `#F2F9F7`, muted `#587184`, faint `#8DA1AF`, line `#DCEBE7`.
- Status: due `#9E4A0C` on `#FFEFD9`, ok `#1B6F46` on `#DDF3E6`, danger `#B83232` on `#FCEDED`.
- Card: bank-card ratio (85.6 × 54 mm). Teal header on the front, navy on the back. It is the one loud element.
- Tabs: Trang chủ, Lịch hẹn, Mở thẻ (center, opens QR), Thông báo, Cá nhân.

## Screen map

| # | Screen | Needs from backend | Available now |
|---|---|---|---|
| 1 | Home, card front | Pets, owner address, upcoming appointments | Pets only |
| 2 | Home, card back | Pet, owner name and phone, address | Pet only |
| 3 | Wallet | Pets including archived, color per pet | Pets, no archive |
| 4 | Pet detail, card | Pet, edit | Read only |
| 5 | Pet detail, QR | `public_code`, public page URL | Code only, no page |
| 6 | Add pet, step 1 | None until submit | |
| 7 | Add pet, step 2 | Create pet, photo upload, profile address | Create without photos |
| 8 | Card preview | None. Code and QR are blurred until created. | |
| 9 | Archive or delete | Archive, restore, delete | No |
| 10 | Appointments | Appointments across all pets, by month | No |
| 11 | Health book | Vaccinations, medical records | No |
| 12 | Visit history | Medical records including attachments | No |
| 13 | Vaccination finder | Clinics with location, hours, vaccines | No |
| 14 | Contact clinic | Clinic contact details, OA link | No |
| 15 | Notifications | In-app notification list, read state | No |
| 16 | Personal | Profile, settings | No |
| 17 | Edit personal | Update profile | No |

## Data the design needs beyond the schema

| Entity | Missing | Seen on |
|---|---|---|
| `pets` | Card code, `avatar`, up to 2 identification photos, `distinguishing_marks`, own address, `archived_at`, card color | 1, 2, 3, 7, 9 |
| `users` | `email`, emergency contact name and phone, reminders on/off, show phone on QR on/off | 16 |
| `medical_records` | `title`, doctor name, `weight`, revisit **time** (README draft has a date only), attachments | 12 |
| `vaccinations` | Lot number, dose type (annual or basic) | 11 |
| `clinics` | Latitude and longitude, opening hours, vaccines offered, district, OA ID | 13, 14 |
| New | Appointments, in-app notifications, attachments | 10, 12, 15 |

`pets.color` currently holds free text and overlaps with "Đặc điểm nhận dạng" (distinguishing marks). Merge or rename rather than keeping both.

Species in the design is Chó, Mèo or Khác; `pets.species` is free text. Gender in the design is Đực or Cái; the API also accepts `unknown`. Both are compatible, so the Mini App just sends fixed values.

## Conflicts: raise with the user

| # | Design says | Conflict | Suggested handling |
|---|---|---|---|
| C1 | Screen 5: QR is "dễ quét ở quầy phòng khám" (easy to scan at the clinic counter) | D11: the QR never grants access | Scanning identifies the pet and starts a request the owner approves. Needs confirmation (open question 2). |
| C2 | Screen 15: "Thẻ của Mochi được quét ở Quận 3" (card scanned in District 3) | No scan log, and location of a public scanner is a privacy matter. The QR page opens on the web without login. | Ask whether it is needed. Could log the time only. |
| C3 | Screen 13 has "Đặt lịch" (book), and screen 10 implies booked appointments | Booking is a later phase in the roadmap | Build read-only first, or hide the button |
| C4 | Screen 13, finder; screen 14, contact | Neither is in the README roadmap | Ask about priority before building |
| C5 | Screen 9: permanent delete | Clinic records are clinic-owned and audited | Open question 5 |
| C6 | Screen 1: QR card front prints the address, screen 2 prints owner phone | Card images can be saved and shared via Zalo (screen 4), which spreads personal data even if the phone is hidden on the QR page | Mention it when building card sharing |
| C7 | Screen 15: "Kết quả khám đã có" (visit result ready) | README only plans revisit and vaccination reminders | Needs a notification type beyond reminders |
