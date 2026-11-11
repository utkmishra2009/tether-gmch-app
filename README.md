# Tether (Mobile)

**Tether**, by Sofscript, is a standalone, installable Patient Portal mobile app — built for Geetanjali Medical College & Hospital (GMCH) with React + TypeScript + Vite, styled with Tailwind CSS, and packaged as a full PWA (Progressive Web App). This is not a demo bolted onto a bigger site: it is its own app, with its own splash screen, its own app icon (the Sofscript mark), offline handling, and an install prompt on both Android and iOS.

## What this is

- A dedicated mobile app experience — no desktop "web portal" wrapper, no phone-frame preview chrome. Below tablet width it renders full-bleed edge-to-edge like a real installed app; on a larger screen it centers itself in a rounded phone-shaped frame so it still looks intentional in a browser.
- Fully interactive: every workflow uses live in-memory mock state (see `src/data/store.tsx`) so booking, paying, requesting, and complaining all have real cascading effects — a payment creates a token and a notification, a bad-rated feedback opens a service request, an overdue complaint escalates, etc.
- Installable: has a real `manifest.webmanifest`, a generated service worker (via `vite-plugin-pwa`/Workbox), and app icons at every required size, so "Add to Home Screen" produces a proper standalone app icon and splash on Android/iOS.

## Workflows covered

Built directly against a consolidated, multi-hospital Patient Portal Business Requirements Document (24 sections — identity/registration, family & consent authorization, booking, payer/tariff, payments/refunds, check-in/queue, clinical records, self-billing, IPD services, feedback, complaints/SLA escalation, staff RBAC, notifications, health camps & advertisements, admin masters). Every business rule below mirrors that document, not a generic template. Tenant policy switches from the BRD (e.g. self-registration mode, Pay Later, live queue) are modeled as real store-backed flags — some drive live app behavior end-to-end, others are exposed as configuration in the admin Policy & Config tab but are display-only in this prototype (clearly labeled there).

- **Login & registration**: patients must check a consent statement (use of their mobile number for OTP, appointment reminders, billing/payment updates, and other hospital communication) before the mobile number field or Send OTP button become usable at all. Self-registration policy is a tenant switch (`SELF_REGISTRATION_MODE`, live-configurable in Admin Masters → Policy & Config): in `SELF_WITH_DUP_CHECK` mode, brand-new patients get a self-registration form that runs a duplicate check against the mock hospital record system — a conclusive match reuses the existing profile, an uncertain match is safely routed to "hospital verification" rather than guessed at, and a mobile number shared by multiple records prompts the patient to confirm which profile is theirs; in `HOSPITAL_ONLY` mode, an unrecognised number is instead told to complete identity verification in person, with no in-app registration path at all. Hospital-controlled fields (name, DOB, gender, primary mobile, UHID) are read-only in the app — changing them goes through a **Profile Correction Request** (Profile → Request Profile Correction) reviewed by hospital staff in a new MRD Queue, with the approved change applied directly to the patient record and the patient notified either way.
- **Family, consent & record access**: family grouping (add/link a member) still requires a multi-parameter identity match (name + DOB + mobile + ID together — an ID number alone is never enough), with an uncertain match deferred to hospital staff. Layered on top, a dedicated **authorization model** ("Who Can Access My Records" in Profile) tracks exactly who can see a given patient's records and why — relationship, basis (natural guardianship / patient consent / legal guardianship), scope, and an optional expiry — with the patient able to grant or revoke consent-based access at any time, an "Access History" audit trail, and a banner warning when a guardian's access to a family member's record is about to expire (modeling the BRD's mandatory age-18 access-expiry rule).
- **Appointment booking**: patient/family picker → department → doctor → slot → Pay Now / Pay Later (Pay Later can be disabled tenant-wide via Policy & Config), validated against each doctor's roster, OPD days, leave dates and remaining slot capacity — no booking is ever allowed on a leave day or non-OPD day. A **Smart Appointment Engine** warns (with an explicit "confirm anyway," audit-logged) on a duplicate appointment with the same doctor or an age/specialty mismatch, prompts about any outstanding IP/OP dues before proceeding, and hard-blocks booking entirely while the patient has an active IP admission. Reschedule/cancel on an upcoming visit shows the applicable fee-window policy live and enforces a maximum of two reschedules per appointment. A checked-in visit shows a **live queue widget** (current token / your token / estimated wait), toggleable tenant-wide via Policy & Config.
- **Chief Complaint**: on any upcoming appointment, patients can note their chief complaint(s) — pick from common options and/or free text — before their visit; it locks once they've checked in.
- **Payments & refunds**: Pay Now issues a token only on confirmed payment; Pay Later reserves the slot and issues a token only once the counter collects payment. Counter reconciliation compares the online payment to the recalculated tariff and settles any difference. Refunds always require the patient's own OTP/app approval plus hospital staff sign-off — a linked family member can never authorize a refund on the patient's behalf.
- **Payer category**: Cash/RGHS/TPA is always system-determined and locked — patients review it, never choose it.
- **Health**: bills & refunds — OP Vouchers (per-transaction OPD payments, family-scoped like every other billing view) alongside IP Bills (per-admission line-item bills — room/nursing/consultant/pharmacy/investigation charges with Total, Paid, and Balance Due, highlighted whenever a balance remains) — self-pay investigations and medicines with report/dispense tracking, doctor/dietitian-prescribed diet (view-only) plus a separate bounded self-request facility — patients pick a meal (Breakfast/Lunch/Dinner/Evening Snack), choose from that meal's actual menu for the day, and can add an ad-hoc note for anything else; a request that conflicts with the patient's active prescribed diet (e.g. a Diabetic Diet patient asking for something sugary) is automatically blocked with a clear reason, never silently allowed.
- **Care**: service feedback (low ratings auto-escalate into a service request), IPD service requests, and complaints with automatic Level 1 → Level 2 → Level 3 SLA-breach escalation.
- **Medical Records** (Profile → Medical Records): a dedicated, read-only history view — Visit History, split into **OP Visits** (diagnosis, doctor's advice, prescriptions, follow-up date per past consultation) and **IP Visits** (admission/discharge dates, ward/bed, treating doctor, and only the Discharge Summary — no raw clinical notes), each visit type carrying its own independent visit numbering; Vitals (every BP/heart rate/temperature/SpO2/RBS/weight reading ever recorded against the patient, shown as a trend sparkline with the latest value and full tap-to-expand history, across both OPD and IPD contexts); Reports (every investigation ever ordered, with a tappable in-app report viewer once results are available); and Prescriptions (full medicine history, not just what's currently pending payment).
- **Discover** (bottom-tab): the BRD's Health Camps/Offers/Advertisements module — a slim, auto-rotating advertisement board on Home (one item at a time, category-colored, tap for detail) plus a full browsable/filterable tab (health camps, health check-up packages, new-doctor announcements, achievements, new facilities, offers, general advisories), each with a detail view (venue, dates, fee, eligibility, terms, bookmarking) and a category-appropriate call-to-action (register for a camp with capacity/waitlist tracking, jump into Book Visit pre-filtered to a department, call the hospital, or a styled "Get Directions"). Pinned emergency advisories bypass normal ordering. Content only ever appears within its configured date window and only for tenants/admins who've approved it (see Staff Portal below) — publishing never requires an app release.
- **Profile**: family members, correction requests, record-access grants, notifications, hospital announcements (clearly tagged "Marketing," separate from clinical/transactional alerts), and a full audit trail.
- **Staff Portal** (`/staff/login`): a lightweight, role-based mobile portal for hospital staff — login as Staff, Supervisor, Department Head, Admin, or Management (quick-fill demo accounts provided); each role sees only what its scope allows (own department vs. hospital-wide), with Respond/Escalate/Close actions on assigned complaints and service requests, plus an **MRD Queue** for reviewing patient profile-correction requests. Admin/Management additionally get:
  - **Admin Masters** — Service Master (IPD/OPD applicability, feedback/complaint/request toggles per service), Department & Person Mapping (per-category escalation chain), SLA Master (response and escalation timers per category), Notification Master (which channels — Portal/WhatsApp/SMS/Email — fire for each event and recipient), Payer Master, Tariff Master (service × payer pricing), Feedback Master (service-wise rating scale + auto-escalation threshold), Complaint Category Master, and a **Policy & Config** tab surfacing every tenant policy flag from the BRD — some (self-registration mode, Pay Later, live queue) are wired live into the app, the rest (EMR visibility window/download limits, mandatory feedback gates, in-app correction requests, auto-authorize linked UHIDs) are configurable and clearly marked display-only in this prototype.
  - **Content Console** (`/staff/content`) — the BRD's Central Master Screen for the Camps & Offers module: create/edit content, a maker-checker approval flow (Draft → Pending Approval → Approved/Rejected, gated to Admin/Management), activate/deactivate, manual reorder, and per-item impressions/taps/registration analytics.

## Interface depth

On top of the workflows above, the app adds interaction polish that reuses the existing design system rather than introducing a new one:

- **Dark mode** — Profile → Display & Accessibility → Light/Dark/System. "System" tracks the OS live; the choice persists and applies before first paint (no flash of the wrong theme). Every screen is re-themed with contrast as the explicit priority, including a lightened brand-teal for legibility on dark surfaces.
- **Accessibility mode** — a second toggle in the same section: larger effective text/touch-targets and higher-contrast text/borders, with a 44px minimum touch-target floor.
- **Skeleton loading & pull-to-refresh** — Home, Discover, Visits, Health and the Staff dashboard show a brief shimmer placeholder on pull-to-refresh (skipped under reduced-motion).
- **Coach marks** — small, dismiss-once tooltips introduced on first visit to Discover, the Vitals view, and "Who Can Access My Records."

## Functional depth

- **Family dashboard** (Home) — the family head sees a scrollable strip of cards for every linked member (next visit, payment/diet flags) and can tap one to switch the active patient context.
- **Medicine dose checklist** (Health → Medicines) — a "Today's Doses" section with tappable AM/Afternoon/Night reminders per prescribed medicine.
- **Investigation trend graphs** (Records → Reports) — repeated tests (e.g. HbA1c) group into a trend card with a sparkline and reading history instead of a flat list.
- **Recovery checklist** (Records → Visit History → IP Visits) — each discharge summary carries a checkable list of discharge instructions.
- **Slot waitlist** (Visits + Book a Visit) — join a waitlist when a doctor's day is fully booked; tracked under "My Waitlist" with one-tap rebook once notified.

## Competitive differentiators

- **Digital Medical ID card** (Profile → Digital Medical ID) — a flip card: front shows patient identity, tap to flip to a back face with a QR code encoding the patient's UHID (plus a short verification token) for a future hospital-scanner/kiosk integration. No QR is shown by default.
- **Doctor ratings** — an aggregate star rating (average + count, no raw comments) shown when choosing a doctor in Book a Visit.
- **Symptom-to-department wizard** — "Not sure which department?" on the booking flow suggests a department from a symptom description; explicitly framed as routing help, not a diagnosis, with a visible disclaimer.
- **Follow-up rebook nudge** (Home) — surfaces a one-tap rebook prompt when a doctor-advised follow-up date is due and no later visit with that doctor is booked yet.

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

Open the printed local URL on your phone (same Wi-Fi) or in a desktop browser to try it. In Chrome/Edge/Android you'll see an install icon in the address bar; on iOS Safari, use Share → "Add to Home Screen."

## Tech notes

- **Routing**: `react-router-dom` with `HashRouter`, so the built app can be hosted from any static path (or opened without a dedicated server) without server-side rewrite rules.
- **State**: one `StoreProvider` (`src/data/store.tsx`) holds all mock entities and business-rule logic as methods — no backend, no network calls, fully deterministic and offline-capable.
- **Styling**: Tailwind CSS v4 utility classes plus a small set of hand-written `.m-*` mobile-native classes (bottom sheets, tab bar, safe-area padding, tap feedback, animations) in `src/index.css`.
- **PWA**: configured via `vite-plugin-pwa` in `vite.config.ts` (`generateSW` mode) — manifest, icons, and an auto-updating service worker are generated at build time into `dist/`.

## Project structure

```
src/
  data/       mock domain types, seed data, and the store (business logic)
  components/ shared UI bits (Shell/TabBar, Sheet, bits)
  screens/    one file per screen (Login, Home, Appointments, Book, Health, Care, Profile, Records, CampsOffers)
  screens/staff/  Staff Portal (StaffLogin, StaffDashboard, StaffAdminMasters, StaffContentConsole)
  App.tsx     routes, splash screen, offline banner, auth guard
  main.tsx    HashRouter + app mount
public/       PWA icons
```

## This is mock data

All patients, doctors, appointments, and transactions are fictional sample data for demonstration purposes — nothing here talks to a real GMCH system.
