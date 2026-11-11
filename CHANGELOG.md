# Changelog

All notable changes to the GMCH Patient App, in the order they were made. Written so they can be used directly as commit documentation.

---

## [Unreleased] — 2026-11-11 (pass 6)

### Buttons, icons and graphics (Apple design)

- **Buttons → Apple tiers**: Filled (primary / destructive), Tinted (secondary / destructive-secondary), Plain (ghost). Flat solid colour, no gloss or bevel, squircle corners where supported, instant press-down scale with a spring release, disabled = same colour dimmed. Dark mode: brighter fill with dark label for contrast.
- **Icon system**: `IconTile` (iOS-Settings-style solid colour tile + white glyph, six tones) now used by every `MRow`; Home quick actions use the large tile; tab bar icons switch from outline to a filled duotone when active.
- **Empty states**: `MEmpty` (26 uses) gets layered art — soft rings, a raised tile carrying the screen's own icon, and quiet accent dots.
- **Medical ID card**: concentric signal-ring pattern and a soft sheen behind the identity face.

---

## [Unreleased] — 2026-11-11 (pass 5)

- **Buttons reverted** to the previous flat style (tactile lip/bevel removed, incl. slots and day chips).
- **Login background redone with restraint** (Apple fluid-interface principles): the care-network scene is gone. Now one quiet idea — a signal radiating from the Tether mark: a soft light behind the mark that leans toward the finger on independent X/Y critically-damped springs, a thin ring leaving the mark every ~5.5s (slowing as it grows, fading before the edges), and a ring from the touch point on pointer-down. Paused when hidden; still frame under reduced motion.

---

## [Unreleased] — 2026-11-11 (pass 4)

- **Login background replaced**: generic aurora/ECG/particles → a "care network" canvas: doctor, lab, pharmacy, family, security and you as nodes tethered by thin links, secure pulses travelling along them, hubs placed in clear zones so they never sit behind text, nodes ease away from touch. Pauses when the tab is hidden; still frame under reduced motion.
- **Tactile buttons**: primary / secondary / danger buttons, booking slots and day chips now have a lit top edge, a visible lip and press down like a key (light + dark variants, reduced-motion and high-contrast fallbacks). Cards and lists stay flat.
- Dark-mode warning box contrast fixed on the erase sheet.

---

## [Unreleased] — 2026-11-11 (pass 3)

### DPDP Act 2023 readiness: notice, granular consent, Consent Centre, data rights

Draft wording with placeholders (DPO name/email/phone in `seed.ts`) — to be confirmed by the hospital's legal team before go-live.

- **Login**: single bundled consent replaced by a plain-language notice link (English / हिन्दी), one required, unticked-by-default agreement for care, and separate optional choices (reminders, WhatsApp & calls, health camps & offers) all off by default. Mobile field no longer locked until consent. Captured in a versioned ledger.
- **Consent ledger** (`store`): `consents`, `getConsentState`, `setConsent`, `recordLoginConsent`; every grant/withdrawal also audit-logged with notice version and channel.
- **Privacy & Consent Centre** (`/privacy`, Profile → Privacy & Consent): view/toggle each consent (withdraw is as easy as grant, effective immediately), required consent explained, consent history, children-in-family note (guardian-managed, no tracking/targeted ads).
- **Data rights**: instant download of own data (JSON), correction request, erasure request (with legal-retention explanation and acknowledgement), nominee, grievance to the privacy officer; requests tracked with reference and 30-day response date.
- **Sharing consents**: Grant Access shows a plain summary and requires explicit consent (recorded); Medical ID QR asks before first reveal; Add Family Member requires the person's authorisation, or parent/guardian declaration if under 18 (recorded); minors badged in family list.
- Verified with Playwright; login still fits one screen; no console errors.

---

## [Earlier] — 2026-11-11 (pass 2)

### Bolder Apple-spec polish: type, surfaces, faster booking, delight

- **Type**: size-specific tracking/leading (display 32px/-0.032em/1.04, hero 38px, labels +0.06em, body near 0); large-title screen headers.
- **Surfaces**: 22px/26px card radii with hairline + inner highlight, 52px buttons with gradient and edge light, springy press, focus ring on inputs.
- **Faster booking**: "Book again" hero (last doctor, earliest open slot, jumps to review in one tap), single-member families skip the patient step, Pay Now preselected, "Earliest available" shortcut, 24-day day strip + 4-column slot grid replacing the date input.
- **Delight**: animated check-draw confirmation with burst rings, confetti and summary card; payment-success moment on Visits; `lib/haptics.ts` (tick/commit/success/warn) on selections, doses, booking and payment; all gated by reduced-motion.
- Smart-engine blocks (active admission, duplicate, age mismatch, dues) unchanged. Verified light + dark with Playwright, no console errors.

---

## [Earlier] — 2026-11-11

### Fluid motion & engagement loops (Apple fluid-interface pass, "Evolve" level)

- **Sheet.tsx rewritten**: spring-driven, draggable by the grabber/title, 1:1 finger tracking with grab offset, velocity handoff, momentum projection to choose dismiss vs. snap-back, rubber-band at top, interruptible mid-flight, Escape to close; now portaled to `document.body` so the tab bar never draws over it.
- **Press feedback**: `.m-tap` scales on press-down with a springy release; reduced-motion respected.
- **Glass tab bar** (`backdrop-filter`) with content scrolling underneath; reduced-transparency / high-contrast fallbacks; active tab icon pops.
- **Peer-tab transition**: fade + 6px rise instead of slide.
- **Adherence loop**: `lib/adherence.ts`, `ProgressRing.tsx`; Health → Medicines progress card with streak and all-done state; Home "Today's medicines" tile.
- **Records → Timeline** tab: unified, month-grouped care timeline (consultations, appointments, investigations, admissions).
- Verified with Playwright: slow drag springs back, flick dismisses, no console errors.

---

## [Earlier] — 2026-09-08

### Polish: app-wide font system replaced, login footer moved, layout tightened to fit one screen

Client asked for a better font choice for "Tether" specifically and for the UI fonts generally, plus for the "Powered by Sofscript" credit to sit at the bottom of the login screen instead of under the wordmark — better hierarchy, since the hospital name/portal identity should read first.

- **New font system, app-wide** — replaced the Fraunces/Manrope serif pairing with **Plus Jakarta Sans** (display/headings/numerals — `--font-display`) and **Inter** (body/UI — `--font-body`), both modern, highly legible, purpose-built for product UI. Because every screen already draws its typography from these two CSS variables (`.m-display`, `.m-heading`, `.m-hero`, `.m-num`, `.m-body`, buttons, etc.), this is a single-point change that re-fonts the entire app consistently.
- **A distinct wordmark font** — added `--font-wordmark` (**Space Grotesk**, weight 700) reserved specifically for the "Tether" logotype wherever it appears standalone (Login, Splash, Staff Login) — its geometric, slightly technical character shapes read more like a real product logotype than reusing the general UI font would.
- **"Powered by Sofscript" moved to the login footer** — removed from directly under the wordmark; now sits as a small, quiet line ("Powered by [mark] Sofscript") at the very bottom of the login screen, below the sign-in card, so the app's own identity (mark + "Tether" + "Patient Portal" + hospital badge) reads first and the attribution reads last, as a footer normally does.
- **Layout tightened to fit one screen** — reduced hero/logo sizing and card internal spacing so the full login screen (logo, wordmark, hospital badge, sign-in card, footer) now fits within a standard mobile viewport with no scrolling required, footer included.

**Files changed:**
- `index.html` — Google Fonts request replaced (Plus Jakarta Sans, Inter, Space Grotesk).
- `src/index.css` — `--font-display`/`--font-body` repointed; new `--font-wordmark` token.
- `src/screens/Login.tsx` — wordmark now uses `--font-wordmark`; "Powered by Sofscript" moved to a footer row; spacing tightened throughout.
- `src/App.tsx` — Splash now uses the `TetherLogo` mark + wordmark font (previously the Sofscript image + generic display font).
- `src/screens/staff/StaffLogin.tsx` — wordmark now uses `--font-wordmark`.

**Verification:** clean build, Playwright pass confirming zero vertical overflow on the login screen at a 393×852 viewport (scrollHeight now equals clientHeight) and correct rendering of the new fonts across Login, Home, Profile and the Medical ID card — zero console/page errors.

---

### Polish: a real Tether logomark, bolder login typography

Client feedback: the login screen's fonts/sizing needed another pass, and "Tether" needed to look like a proper logo rather than the Sofscript maker's-mark sitting above plain text.

- **New Tether logomark** (`src/components/TetherLogo.tsx`) — a standalone app glyph: a "T" whose stem resolves into a single anchor point (evoking the product name — a tether is a line anchored to a fixed point), rendered as flat vector shapes in a glossy gradient squircle badge so it stays crisp at any size. This is the app's own mark, distinct from the Sofscript logo image still used for hospital/vendor branding elsewhere (brand strip, Staff Login, the Medical ID card).
- **Bolder wordmark** — added the Fraunces 900 (black) weight to the Google Fonts request and used it for "Tether" on the login screen, larger and tighter-tracked than before.
- **Refined sizing hierarchy** — "Welcome back" and "Verify OTP" headings now use the display typeface at a larger size to match the bolder wordmark above them; the tagline and field labels got tighter, more deliberate letter-spacing; body copy line-heights tightened slightly throughout the card.

**Files changed:**
- `src/components/TetherLogo.tsx` (new).
- `src/screens/Login.tsx` — hero now renders `TetherLogo` instead of the Sofscript image; heading/label typography resized.
- `index.html` — added Fraunces weight 900 to the Google Fonts request.

**Verification:** clean build, Playwright pass through the login flow (mobile entry, consent, OTP) confirming the new mark and typography render correctly at the mobile viewport — zero console/page errors.

---

### Fix + polish: Digital Medical ID QR overflow, redesigned Login screen

Client reported the Medical ID card's QR was breaking out of the card visually, and asked for the login screen to be redesigned to something cleaner and more state-of-the-art, with a better treatment of the app name.

- **Fixed** — the flip card's back face (QR + caption) was taller than the front face's natural content height, but both faces share one fixed-height container (`position: absolute; inset: 0`), so the QR visibly overflowed above/below the card. Fixed by widening the card's aspect ratio (1.55:1 → 1.3:1 — a bit taller), trimming the QR size and back-face padding/copy to comfortably fit, and adding `overflow: hidden` plus `display:flex` to `.m-flip-face` as a safety net so this class of bug can't recur even if content grows slightly.
- **Redesigned Login screen** — new wordmark lockup ("Tether" in the display typeface, an uppercase "Patient Portal · by Sofscript" tag beneath, a pill-styled hospital name/city badge) with two soft blurred accent orbs behind it for depth; the card now uses the app's floating-elevation surface with a sheet-style grabber handle; the mobile-number field gained a left-aligned phone icon + "+91" prefix; the OTP entry is now six individual boxes (segmented input, teal highlight on the active/filled cells) instead of one masked text field; buttons gained directional icons (Send OTP →, Verify & Continue →); the consent statement moved into its own bordered card; and the "Multiple Records"/"New Patient Registration"/"Visit Hospital" screens each got a small icon-led heading to match. No business logic changed — same OTP/registration/multi-match flow throughout.

**Files changed:**
- `src/screens/Login.tsx` — full visual redesign (see above); logic (state, `sendOtp`/`verifyOtp`/`submitRegistration`) unchanged.
- `src/screens/MedicalId.tsx` — front/back face layout reworked to fit the taller aspect ratio (`justify-between` distribution on front, tighter QR/copy on back).
- `src/index.css` — `.m-flip-card` aspect-ratio 1.3:1, `.m-flip-face` gets `overflow:hidden`/flex-column; new `.m-login-orb`/`.m-login-orb-1`/`.m-login-orb-2` decorative background glows for the login screen.

**Verification:** clean build, Playwright pass through the full login flow (mobile entry → consent → OTP boxes filling one-by-one → verify → Home) and the Medical ID card flip in both directions — QR now renders fully inside the card with no overflow — zero console/page errors.

---

### Feature: competitive differentiators — Digital Medical ID (QR), doctor ratings, symptom-to-department wizard, follow-up nudge

Third and final follow-up batch after "what else can you do." Scope was explicitly bounded by the client: no bed/ward availability, stars-only doctor ratings (no raw comments surfaced), and the Medical ID card must not show its QR by default — it flips like a physical ID card instead.

- **Digital Medical ID card** (Profile → Digital Medical ID, `/medical-id`) — a flip card (CSS 3D transform, respects `prefers-reduced-motion`): the front shows patient identity (name, DOB, gender, UHID, patient type); tapping it flips to a back face showing a QR code (via the new `qrcode.react` dependency) encoding the patient's UHID plus a short, non-sensitive, deterministic verification token — intended for a future hospital-scanner/kiosk integration, not wired to any real scanner today. A caption makes clear exactly what the QR does and doesn't contain.
- **Doctor ratings** — `Doctor.ratingAvg`/`ratingCount` (seeded, one value per doctor) rendered as a new shared `StarRating` component (stars + average + count, no comments) on the doctor-selection step of Book a Visit.
- **Symptom-to-department wizard** — a "Not sure which department?" entry point on the department-selection step of Book a Visit opens a sheet: pick from ~13 common symptom descriptions, get a suggested department (or two), tap to apply it and continue booking. Carries a visible disclaimer ("routing help, not a diagnosis... in a medical emergency, call your local emergency number or go to the nearest ER immediately") on every screen of the wizard.
- **Follow-up rebook nudge** (Home) — surfaces the most recent past consultation whose doctor-advised follow-up date is due or overdue and for which no later appointment with that same doctor is already booked; tapping it deep-links straight into Book a Visit with that doctor pre-selected (reuses the existing `?doctorId=` support).

**Files changed:**
- `package.json` — added `qrcode.react` dependency.
- `src/data/types.ts` — added `Doctor.ratingAvg`/`ratingCount`.
- `src/data/seed.ts` — seeded a rating per doctor; added `SYMPTOM_DEPARTMENT_MAP`; added one additional past consultation (`CON-3298`, Dermatology, overdue follow-up, no rebook yet) so the follow-up nudge has a real case to demonstrate.
- `src/components/bits.tsx` — new `StarRating` component.
- `src/screens/MedicalId.tsx` (new) — the flip card screen.
- `src/screens/Profile.tsx` — new "Digital Medical ID" row.
- `src/screens/Book.tsx` — doctor list now shows `StarRating`; new symptom-wizard sheet and entry point on the department step.
- `src/screens/Home.tsx` — new follow-up nudge banner.
- `src/index.css` — `.m-card-floating` + the `.m-flip-scene`/`.m-flip-card`/`.m-flip-face` flip-card CSS.
- `src/App.tsx` — added the `/medical-id` route.

**Verification:** clean build (`tsc -b && vite build`), Playwright pass confirming the ID card flips both directions and the QR decodes to the expected `TETHER-ID|<UHID>|<token>` payload, star ratings render on the doctor list, the symptom wizard resolves "Chest pain / palpitations" → Cardiology and applies it back into the booking flow, and the follow-up nudge appears for the seeded overdue case and deep-links into Book a Visit with the correct doctor pre-selected — zero console/page errors.

---

### Feature: functional depth — family dashboard, medicine dose checklist, investigation trend graphs, recovery checklist, slot waitlist

Second of three follow-up batches after "what else can you do" (interface depth, functional depth, competitive differentiators). This batch adds real functional value on top of the existing data model without touching any compliance-critical logic (consent, chief-complaint locking, refund authorization, SLA escalation).

- **Family dashboard (Home)** — for a logged-in family head, a new "Family" section shows a horizontally-scrollable strip of cards for every linked family member: name/relation, their next upcoming appointment (or "No upcoming visit"), and "Payment Due"/"Diet" pill badges where relevant. Tapping a card switches the active patient context (`store.switchActivePatient`). Correctly hidden for a non-head member logged in directly (matches existing `family`/`headUhid` computation — not a new rule).
- **Medicine dose checklist (Health → Medicines)** — a new "Today's Doses" section derives a mock AM/Afternoon/Night frequency per medicine name (`getDoseLabelsForMedicine()`) and renders tappable pills that toggle a `doseLog` entry for that patient/medicine/date.
- **Investigation trend graphs (Records → Reports)** — investigations sharing a test name are grouped into a trend card (latest value + unit, a small sparkline, and the reading history) instead of only a flat list. Regex-parses the numeric result out of the free-text `resultSummary` field.
- **Post-discharge recovery checklist (Records → Visit History → IP Visits)** — each IP visit's discharge summary now shows a checkable list of discharge instructions (`recoveryChecklist` on the visit, logged per item via `toggleRecoveryChecklistItem`).
- **Slot waitlist (Visits + Book a Visit)** — when a doctor's day is fully booked, "Join Waitlist" is offered on the booking screen; entries appear under a new "My Waitlist" section on the Visits screen with "Book Now" (deep-links back into Book with `?doctorId=&date=` pre-filled) and "Cancel". Existing `cancelAppointment`/`rescheduleAppointment` now call `notifyWaitlistForOpening()` when a slot frees up.

**Files changed:**
- `src/data/types.ts` — added `DoseLogEntry`, `RecoveryChecklistItem` (+ `IPVisit.recoveryChecklist?`), `RecoveryChecklistLogEntry`, `WaitlistEntry`.
- `src/data/seed.ts` — added a third HbA1c investigation reading for Kavita Chouhan so her trend graph has real history; seeded 5 recovery-checklist items each on `IPV-501` and `IPV-502`.
- `src/data/store.tsx` — added `getDoseLabelsForMedicine()`, `doseLog` state + `toggleDoseTaken()`; `recoveryChecklistLog` state + `toggleRecoveryChecklistItem()`; `waitlist` state + `joinWaitlist()` / `cancelWaitlistEntry()` / `getWaitlistForPatient()` / `notifyWaitlistForOpening()` (wired into `cancelAppointment`/`rescheduleAppointment`).
- `src/screens/Home.tsx` — new "Family" section.
- `src/screens/Health.tsx` — new "Today's Doses" section in the Medicines tab.
- `src/screens/Records.tsx` — investigation trend cards (`parseNumericResult`/`parseResultUnit` helpers) and the recovery-checklist UI under IP Visits.
- `src/screens/Appointments.tsx` — new "My Waitlist" section.
- `src/screens/Book.tsx` — "Join Waitlist" action when a day is fully booked, plus `?doctorId=&date=` deep-link support.

**Fixed during verification:** the trend-card headline initially showed "1" instead of the true latest reading (e.g. "6.8%") for HbA1c — `parseNumericResult()`'s regex was matching the digit embedded in the test name "HbA1c" itself before reaching the actual result. Fixed by parsing only the substring after the first `:` in `resultSummary`.

**Verification:** clean build (`tsc -b && vite build`), Playwright pass covering the family dashboard (both as family head and as a non-head member), the dose checklist (empty state and a patient with 4 seeded medicines), the fixed trend graph, the recovery checklist, and the waitlist section — zero console/page errors.

---

### Feature: interface depth — dark mode, skeleton loading states, pull-to-refresh, accessibility mode, coach marks

First of the three follow-up batches. Adds interaction/interface polish without touching the existing clean visual language — every new surface reuses the established design tokens and button/typography system rather than introducing a new style.

- **Dark mode** — a Light/Dark/System control in Profile → Display & Accessibility. Resolved in JS (not a CSS media query) so "System" tracks OS changes live; persisted to `localStorage`; applied before first paint to avoid a flash of the wrong theme. Every screen re-themed via a `data-theme="dark"` token layer, including a lightened brand-teal for legibility on dark surfaces — contrast was the explicit constraint from the client ("everything should be perfectly visible in contrast").
- **Accessibility mode** — a second toggle in the same Profile section: larger effective text/touch-targets (via a body-level zoom, since sizing is mostly fixed px rather than rem) and higher-contrast text/borders, with a 44px minimum touch-target floor.
- **Skeleton loading states** — shimmer placeholders (`SkeletonBlock`/`SkeletonCard`/`SkeletonList`/`SkeletonGrid`) shown briefly on pull-to-refresh across Home, Discover, Visits, Health and the Staff dashboard; skipped automatically under `prefers-reduced-motion`.
- **Pull-to-refresh** — a self-built (no new dependency) touch-gesture wrapper, armed only when the screen is scrolled to the top, used on the same five screens.
- **Coach marks** — small dismiss-once tooltips (persisted per-key in `localStorage`) introduced on the Discover tab, the Vitals segment in Records, and the "Who Can Access My Records" screen.
- **CSS/icon polish** — a `.m-noscroll` utility (referenced in 8 files but never actually defined until now — fixed as a real cross-browser scrollbar-hide rule), `:focus-visible` outline rules, and subtle hover states gated behind `@media (hover: hover)` so touch devices are unaffected.

**Files changed:**
- `src/lib/theme.ts` (new), `src/lib/a11y.ts` (new) — init/persist/toggle logic for the two modes.
- `src/components/Skeleton.tsx` (new), `src/components/PullToRefresh.tsx` (new), `src/components/CoachMark.tsx` (new).
- `src/main.tsx` — calls both init functions synchronously before React renders.
- `src/index.css` — full dark-mode token re-listing, a global re-skin layer covering every hardcoded Tailwind color utility found via audit, `@custom-variant dark` registration, accessibility-mode CSS block, skeleton shimmer keyframe, focus/hover rules, the real `.m-noscroll` definition.
- `src/screens/Profile.tsx` — new "Display & Accessibility" section (theme segmented control + accessibility toggle).
- `src/screens/Home.tsx`, `src/screens/CampsOffers.tsx`, `src/screens/Appointments.tsx`, `src/screens/Records.tsx`, `src/screens/staff/StaffDashboard.tsx` — wrapped in `PullToRefresh` + skeleton loading; coach-mark instances added where noted above.

**Verification:** clean build, Playwright pass in both light and dark mode across Home/Visits/Health/Discover/Records/Care/Profile (theme toggle confirmed working and legible in both directions), accessibility toggle confirmed applying zoom/contrast, skeleton+pull-to-refresh confirmed on all five wired screens — zero console/page errors (Google Fonts CDN unreachable only inside this build sandbox's restricted network, as noted in earlier entries — unaffected in production).

---

## [Unreleased] — 2026-09-07

### Polish: Home "Camps & Offers" simplified to an auto-scrolling ad board, renamed to "Discover"

Client feedback on the design pass: the Home-screen camps/offers section was too dense (a row of full cards). Replaced it with a slim, single-item advertisement/announcement board that auto-rotates through every live item (category-colored, icon + title, dot indicators, tap-through to the same detail sheet, pauses on hover/touch, respects `prefers-reduced-motion`) — the full browsable grid (filters, bookmarking, categories) stays exactly as-is on the dedicated tab, reached via "View All". After iterating on naming with the client (Camps & Offers → Announcements & Offers → tab-bar-only "Announcements" → "For You" → final pick), the section label, the dedicated screen's title, and the bottom tab bar are now consistently branded **"Discover"** everywhere they appear (code comments updated to match; internal-only identifiers — the `/camps` route, `CampsOffers.tsx` filename, the `'Camps Tab'` placement value — were deliberately left as-is since renaming them has no user-visible effect).

- `src/components/content.tsx` — new `AnnouncementBoard` component (single-item auto-rotating board, replaces the multi-card row on Home).
- `src/index.css` — new `m-fade-swap` crossfade keyframe for the board's item transitions.
- `src/components/Shell.tsx` — bottom tab renamed to "Discover".
- `src/screens/Home.tsx` — section now renders `AnnouncementBoard` under a "Discover" label instead of a card row.
- `src/screens/CampsOffers.tsx` — screen title renamed to "Discover" (subtitle unchanged, still describes what's inside).

**Verification:** clean build, Playwright-confirmed the board auto-rotates (distinct item visible before/after the interval), tap-through opens the correct detail sheet, and the "Discover" tab label renders on one line with no overlap in the 6-tab bar. Zero console errors.

---

### Polish: app-wide UI/UX design-system pass

Client asked for a dedicated design pass on top of the feature-complete app: modern, cohesive, icons/buttons aligned, workflows optimized, user-satisfaction-first, state-of-the-art but not overcomplicated. This is a presentation-layer and workflow-friction pass only — no route, business rule, or data logic changed.

- **Typography**: replaced the generic system-font stack with a real pairing — **Fraunces** (headings, hero numbers, money/vitals figures with tabular numerals) + **Manrope** (body/UI/buttons), loaded via Google Fonts with a graceful serif/sans fallback stack if the CDN is ever unreachable. New type-scale utility classes (`.m-caption/.m-label/.m-body/.m-subhead/.m-heading/.m-display/.m-hero/.m-num`) replace scattered inline font sizes on every screen's headers and primary content.
- **Color & elevation**: kept the navy/teal brand palette, added deeper accent variants and a formalized gradient language (`--grad-navy`, `--grad-teal`, etc., replacing one-off gradients), plus a 3-tier shadow scale (resting/raised/floating) so cards, hero surfaces and sheets read as distinct layers instead of flat.
- **Icons & buttons**: `lucide-react` icon sizes normalized to a fixed scale (16 dense/inline, 18–20 row-leading, 22–24 header/hero) with consistent stroke width everywhere; formalized a 4-tier button system — primary / secondary / new `.m-btn-danger` + `.m-btn-danger-outline` (destructive) / new `.m-btn-ghost` (text-only) — and replaced every ad-hoc red-override button (cancel appointment, revoke access, reject correction request, etc.) with the correct destructive variant.
- **Workflow friction**: added a direct "Book a Visit" action to the empty Appointments state (previously only reachable via the header icon) and a one-tap "Clear Filters" on Camps & Offers when filters return nothing — both pure UI conveniences, no compliance or business-rule step touched (chief-complaint locking, smart-engine warnings, refund authorization chain and reschedule/cancellation policy logic are all untouched).
- **Motion & empty states**: staggered reveal animation on card grids (Home quick actions, Camps & Offers), a success-state animation on booking/payment/cancellation confirmations, all respecting `prefers-reduced-motion`; every `MEmpty` across the app now shows a contextual icon, a plain-language sentence, and a CTA back into the flow where one exists, instead of a dead-end "No data" message.

**Verification:** clean build, Playwright pass across Login, Home, Visits, Camps, Health, Care and Profile — icon/button consistency and the new empty-state CTAs confirmed visually; zero console errors (the Google Fonts CDN was unreachable only inside the build sandbox's restricted network — the fallback font stack rendered correctly there, and the app will pick up the real fonts on any normal network).

---

### Feature: full consolidated BRD pass — identity/consent overhaul, smart booking engine, Health Camps & Offers module, remaining admin masters

Client supplied a 24-section consolidated multi-hospital Patient Portal BRD (superset of two source client documents) and asked for the remaining rules/flows to be implemented in full. Delivered in two sequential passes so shared files (`store.tsx`/`types.ts`/`seed.ts`) never had two edits in flight at once.

**Pass 1 — Identity, consent & booking compliance (BRD §5–10)**
- `SELF_REGISTRATION_MODE` tenant policy flag (`HOSPITAL_ONLY` vs `SELF_WITH_DUP_CHECK`, BRD D1) — store-backed, read live by Login.tsx; default preserves existing self-registration behavior.
- **Profile Correction Request** workflow (FR-M1-02): patients request changes to hospital-controlled fields (name/DOB/gender/mobile) with a reason; routed to a new **MRD Queue** in the Staff Portal; approval mutates the actual patient record and notifies the patient either way.
- **Authorization-table access model** (BRD M2, the most legally sensitive module): a proper `AccessGrant` layer (relationship, basis, scope, optional expiry, revocable) alongside the existing family grouping — "Who Can Access My Records" (view/revoke grants on your own record, grant access to a family member), an "Access History" audit trail, and a 30-day advance banner modeling the BRD's mandatory guardian-access-expires-at-18 rule.
- **Smart Appointment Engine** (§7.4) in Book.tsx: duplicate-appointment and age/specialty-mismatch confirm-to-override warnings (audit-logged), an outstanding-dues prompt with a Pay Now link, and a hard block on booking while the patient has an active IP admission.
- **Reschedule/Cancellation policy** (FR-M3-06): live fee-window text, enforced 2-reschedule maximum.
- **Live queue widget** (FR-M6-05/06): current token / your token / estimated wait on checked-in visits.

Files: `src/data/types.ts`, `src/data/seed.ts`, `src/data/store.tsx`, `src/screens/Login.tsx`, `src/screens/Book.tsx`, `src/screens/Appointments.tsx`, `src/screens/Profile.tsx`, `src/screens/Home.tsx`, `src/screens/staff/StaffDashboard.tsx`.

**Pass 2 — Health Camps & Offers module, remaining admin masters (BRD §18–19)**
- **Health Camps, Offers & Advertisements** (§18) — the full module: a rich content model (category, targeting by patient type/gender/age, placement, CTA, maker-checker approval status, pinning), a priority-ordered category-coded banner carousel on Home, a new **Camps** bottom tab (browsable/filterable, bookmarkable, detail view with venue/dates/fee/eligibility/terms), camp registration with capacity tracking, and impression/tap analytics.
- **Content Console** (`/staff/content`) — the BRD's Central Master Screen: create/edit, maker-checker approve/reject, activate/deactivate, manual reorder, per-item analytics.
- **Remaining Admin Masters** (§19.1): Payer Master, Tariff Master (service × payer pricing), Feedback Master (service-wise scale + escalation threshold), Complaint Category Master, and a **Policy & Config** tab surfacing every tenant flag from the BRD — `SELF_REGISTRATION_MODE`, Pay Later, and the live-queue toggle are wired live into real app behavior; EMR visibility window/download limits, mandatory feedback gates, in-app correction requests and auto-authorize-linked-UHIDs are configurable and explicitly marked display-only in this prototype.
- **EMR visibility window** (FR-M7-03): investigation reports older than the configured window are visually greyed out on Records with an explanatory note, rather than being deleted.
- **Mandatory feedback gate** (FR-M10-04, OP leg): a soft nudge banner on My Visits when a completed OP consultation has no feedback submitted yet.

Files: `src/data/types.ts`, `src/data/seed.ts`, `src/data/store.tsx`, `src/components/content.tsx` (new), `src/screens/CampsOffers.tsx` (new), `src/screens/staff/StaffContentConsole.tsx` (new), `src/components/Shell.tsx`, `src/screens/Home.tsx`, `src/screens/Profile.tsx`, `src/screens/Book.tsx`, `src/screens/Appointments.tsx`, `src/screens/Care.tsx`, `src/screens/Records.tsx`, `src/screens/staff/StaffAdminMasters.tsx`, `src/screens/staff/StaffDashboard.tsx`, `src/App.tsx`.

**Explicitly out of scope for this prototype** (frontend-only mock, no backend/native shell): React Native packaging, real HMIS/LIS/RIS/PACS/payment-gateway/SMS-DLT/WhatsApp integrations, multi-tenant infrastructure, device binding/biometric lock/certificate pinning and other NFR-grade security controls, and language-pack localization (single-language mock). These require real backend and platform work beyond what a static frontend demo can responsibly claim to implement.

**Verification:** two full clean builds (`tsc -b && vite build`), Playwright pass after each batch — correction-request and access-grant flows, smart-engine warnings, reschedule policy text, live-queue widget, the Camps tab and detail/registration flow, the staff Content Console (maker-checker + analytics), and the Policy & Config tab's live vs display-only wiring — zero console/page errors throughout.

---

### Feature: vitals trends, OP/IP visit & billing split, and a login consent gate

Client review flagged four more gaps after testing the deepened prototype.

**1. Vitals tracking and trends** — every BP/heart rate/temperature/SpO2/RBS/weight reading recorded against a patient (OPD or IPD) is now visible as a trend, not just a number on the day it was taken.

- `src/data/types.ts` — added `VitalsReading`.
- `src/data/seed.ts` — added `seedVitals` (an OPD hypertension patient with a BP trend across visits; an IPD patient with BP/temperature/RBS trending down across her admission).
- `src/data/store.tsx` — exposed `vitals` read-only.
- `src/screens/Records.tsx` — new "Vitals" segment: one card per vital sign with its latest value, an inline SVG trend sparkline, reading count, and a tap-to-expand sheet listing the full history (value, context, recorded-by, timestamp per reading).

**2. Separate OP and IP visit history** — a patient's outpatient and inpatient visits now have distinct visit numbering and are never mixed together. Per the BRD's clinical-confidentiality intent, an IP visit shows the patient only its Discharge Summary — never the underlying day-to-day clinical notes.

- `src/data/types.ts` — added `IPVisit` (IP No., admission/discharge dates, ward, bed, treating doctor, discharge summary); documented the existing `ConsultationRecord` as OP-specific.
- `src/data/seed.ts` — added `seedIPVisits` with realistic discharge summaries.
- `src/data/store.tsx` — exposed `ipVisits` read-only, scoped to the current patient only (never family-wide, unlike billing — see below).
- `src/screens/Records.tsx` — "Visit History" now has an OP Visits / IP Visits sub-toggle; IP Visits render only IP No., dates, ward/bed, treating doctor, and the discharge summary.

**3. Billing now reflects IP bills alongside OP vouchers** — an admitted patient's per-admission bill (room, nursing, consultant, pharmacy, investigation line items, with Total/Paid/Balance Due) is now visible next to their existing OP transaction vouchers.

- `src/data/types.ts` — added `IPBillLineItem`, `IPBill`.
- `src/data/seed.ts` — added `seedIPBills` (one Partially Paid, one Settled, matching the seeded IP visits' IP numbers).
- `src/data/store.tsx` — exposed `ipBills` read-only.
- `src/screens/Health.tsx` — Bills tab restructured into "OP Vouchers" and "IP Bills" sections; IP Bills are family-scoped exactly like OP Vouchers already were (billing has always been visible at the family level so a family head can settle a member's bill), while Vitals/Visit History above stay strictly patient-scoped for clinical privacy. Balance Due is highlighted whenever it is greater than zero.

**4. Login consent gate** — before entering a mobile number, the patient must check a consent statement covering the hospital's use of that number for OTP, reminders, billing/payment updates, and other communication. The mobile number field and Send OTP button are disabled until the checkbox is checked.

- `src/screens/Login.tsx` — added a `consented` state flag; the mobile input and Send OTP button are both `disabled={!consented}`; added a checkbox + hospital-drafted consent label above the button.

**Verification:** rebuilt clean, Playwright pass covering: the consent gate (input/button disabled pre-check, typing has no effect while disabled, both enable immediately on check, zero regression to the OTP flow); Vitals segment (sparklines, latest values, tap-to-expand history) for both an OPD and an IPD patient; the OP/IP Visit History sub-toggle (IP Visits showing only the discharge summary, no clinical-note leakage) for both patient types; and the Bills tab (OP Vouchers + IP Bills rendering correctly, including the family-scoping behavior for a family head viewing another member's IP bill). Zero console/page errors throughout.

**Suggested commit message:**
```
feat: add vitals trends, OP/IP visit & billing split, login consent gate

- Track vitals (BP/HR/temp/SpO2/RBS/weight) against a patient across
  both OPD and IPD contexts, with trend sparklines and full history
  in Medical Records.
- Split visit history into OP Visits and IP Visits with independent
  visit numbering; IP Visits show only the Discharge Summary, never
  raw clinical notes, per the BRD's confidentiality intent.
- Add per-admission IP Bills (room/nursing/consultant/pharmacy/
  investigation line items, Total/Paid/Balance Due) alongside the
  existing OP Vouchers, using the same family-level billing scope
  OP vouchers already used.
- Require patients to check a consent statement (hospital's use of
  their mobile number for OTP, reminders, billing and other
  communication) before the mobile number field or Send OTP button
  become usable.

Verified with a clean build and Playwright across both an OPD-only
and an IPD patient, zero console errors.
```

---

### Feature: real diet menu selection + dedicated Medical Records screen

Client review flagged two gaps against the BRD after testing the prototype.

**1. Diet self-request was just a single free-text field** — replaced with a proper meal-based menu: patients pick a meal (Breakfast/Lunch/Dinner/Evening Snack), select from that meal's actual menu items for the day, and can add an ad-hoc note for anything not listed. The existing clinical-conflict blocking rule (a request that conflicts with the patient's active prescribed diet is blocked, never silently allowed) was preserved and now checks against the real menu selections and ad-hoc text.

- `src/data/types.ts` — `DietSelfRequest` restructured from `{item, notes}` to `{mealType, menuItems, adhocRequest}`; `Investigation` gained an optional `resultSummary` field for report content.
- `src/data/seed.ts` — added `TODAYS_MENU` (per-meal item lists); added more historical `ConsultationRecord`, `Investigation` (with `resultSummary`), and `MedicineOrder` entries so the new Records screen has real history to show.
- `src/data/store.tsx` — `submitDietRequest` signature updated to `(mealType, menuItems, adhocRequest)`; conflict-blocking logic re-keyed off the patient's actual active prescribed diet type.
- `src/screens/Health.tsx` — Diet tab rebuilt with a meal-type selector, per-meal chip multi-select, and an ad-hoc text field.

**2. No dedicated way to access visit history, investigation reports, or prescription history** (BRD Workflow 10 — Patient Records Access) — patients previously had no way to view a past investigation's actual report, and consultation history was a buried, incomplete section in Profile.

- `src/screens/Records.tsx` (new) — a full-screen Medical Records view with three segments: Visit History (diagnosis, doctor's advice, prescriptions, follow-up date per past visit), Reports (every investigation ordered, tappable to open an in-app report viewer once results are available), and Prescriptions (full medicine history).
- `src/App.tsx` — added `/records` route.
- `src/screens/Profile.tsx` — removed the old inline "Consultation History" section; added a "Medical Records" row under Account that opens the new screen.

**Verification:** rebuilt clean, Playwright pass across both new features (Records — all 3 tabs, including opening a report sheet; Diet — meal switching, menu selection, and confirmed the conflict-blocking rule still fires correctly with a test case), zero console errors.

**Suggested commit message:**
```
feat: add real diet menu selection and a dedicated Medical Records screen

Replace the single free-text diet self-request with an actual
meal-based menu (Breakfast/Lunch/Dinner/Evening Snack), each showing
that day's real menu items plus an ad-hoc field for anything else —
the existing clinical-conflict blocking rule is preserved and now
checks the real selections.

Add a dedicated, read-only Medical Records screen (Profile > Medical
Records) covering Visit History, Investigation Reports (with an
in-app report viewer), and Prescription history, per the BRD's
Patient Records Access workflow — previously scattered/incomplete
across Profile and the payment-focused Health tabs.

Verified with a clean build and Playwright, zero console errors.
```

---

### Fix: production build failing on deploy platforms (Slate)

**Problem:** The build failed on Slate's deployer with `exit code 1` and almost no error output. Reproducing locally with `NODE_ENV=production npm install` (which is what Slate — and many other deploy platforms — set during install) showed the real cause: npm's default behavior under `NODE_ENV=production` is to silently skip everything listed in `devDependencies`. This project had `vite`, `typescript`, `@vitejs/plugin-react`, and the `@types/*` packages in `devDependencies`, so none of them were installed on Slate, and `vite.config.ts` failed immediately with `Cannot find module '@vitejs/plugin-react'` before the build could even start.

**Fix:** Moved every package the build script (`tsc -b && vite build`) actually needs at build time from `devDependencies` into `dependencies`, so they install regardless of `NODE_ENV`. Only `oxlint` (a standalone lint command, not part of the build script) stayed in `devDependencies`.

**Files changed:**
- `package.json` — moved `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite` from `devDependencies` to `dependencies`.
- `package-lock.json` — regenerated to match.

**Verification:** Clean install + build tested twice locally — once with plain `npm install`, once with `NODE_ENV=production npm install` — both produced a working `dist/` with no errors.

**Suggested commit message:**
```
fix: move build-time packages out of devDependencies

Slate (and similar deploy platforms) set NODE_ENV=production during
npm install, which makes npm silently skip devDependencies. vite,
typescript, @vitejs/plugin-react and the @types/* packages were listed
there, so the production build failed instantly with "Cannot find
module '@vitejs/plugin-react'" before vite could even start.

Move everything the build script needs into dependencies so it
installs regardless of NODE_ENV. Verified with a clean install and
build both with and without NODE_ENV=production set.
```

---

### Feature: Chief Complaint self-entry + mobile Staff Portal (RBAC + Admin Masters)

Brought the app fully in line with the client's detailed 75-page Patient Portal BRD/PRD. Everything else in the BRD (OTP login + self-registration with duplicate-check, multi-parameter family linking, appointment booking with roster/leave/OPD-day validation, Pay Now/Pay Later, counter reconciliation, refund authorization requiring patient OTP *and* staff approval, payer/tariff locking, investigations/medicines self-billing, diet orders, feedback/service-request/complaint SLA escalation) was already implemented and verified against the BRD in an earlier pass — this change adds the two pieces that were genuinely missing.

**1. Chief Complaint self-entry** (BRD's "nice-to-have" workflow): patients can now record their chief complaint(s) — from a predefined list and/or free text, multiple allowed — against any upcoming appointment before their visit. Entry locks automatically once the appointment reaches Checked-in/Token Generated/Consultation Started/Completed, matching the BRD's intent that it inform the doctor before or during consultation.

- `src/data/types.ts` — added `ChiefComplaint` type.
- `src/data/seed.ts` — added `CHIEF_COMPLAINT_OPTIONS` (predefined list) and empty `seedChiefComplaints`.
- `src/data/store.tsx` — added `chiefComplaints` state, `submitChiefComplaint()`, `getChiefComplaint()`, `isChiefComplaintLocked()`, wired into notifications/audit trail like every other mutation.
- `src/screens/Appointments.tsx` — added an "Add/Edit/View Chief Complaint" action + bottom sheet per appointment card, respecting the lock rule.

**2. Mobile Staff Portal** (BRD's Staff Portal & RBAC + Admin Masters requirements), reached at `/staff/login`, linked from the bottom of the patient login screen:

- Role-based login (Staff, Supervisor, Department Head, Admin, Management) with quick-fill demo accounts.
- A dashboard scoped by role: `Staff`/`Supervisor`/`Department Head` see their own department's complaints and service requests; `Admin`/`Management` see everything across all departments — enforced in the data layer, not just hidden in the UI.
- Respond / Escalate / Close actions on complaints and service requests, appropriate to each role.
- **Admin Masters** (Admin/Management only) — four live-editable configuration screens matching the BRD's "Recommended Master Configuration" section exactly: Service Master (IPD/OPD applicability + feedback/complaint/request toggles per service), Department & Person Mapping (per-category L1/L2/L3 escalation chain + final authority), SLA Master (initial response + L1/L2/L3 + escalation timers per category), and Notification Master (Portal/WhatsApp/SMS/Email toggles per event type and recipient).

**Files changed:**
- `src/data/types.ts` — added `ServiceMasterEntry`, `DepartmentMappingEntry`, `SLAMasterEntry`, `NotificationMasterEntry`; added `username` to `StaffUser`.
- `src/data/seed.ts` — added `username` to `seedStaff`; added `seedServiceMaster`, `seedDepartmentMappingMaster`, `seedSLAMaster`, `seedNotificationMaster` (existing `departmentMapping`/`slaMaster` records used by complaint auto-escalation were left untouched).
- `src/data/store.tsx` — added masters state + `currentStaffId` auth state; added `staffLogin()`, `staffLogout()`, `getScopedComplaints()`, `getScopedServiceRequests()`, `staffRespondServiceRequest()`, `staffCloseServiceRequest()`, `staffEscalateServiceRequest()`, and `updateServiceMasterEntry()` / `updateDepartmentMappingEntry()` / `updateSLAMasterEntry()` / `updateNotificationMasterEntry()`.
- `src/screens/staff/StaffLogin.tsx` (new), `src/screens/staff/StaffDashboard.tsx` (new), `src/screens/staff/StaffAdminMasters.tsx` (new).
- `src/App.tsx` — added `/staff/login`, `/staff/dashboard`, `/staff/masters` routes with a `StaffGuard` wrapper (mirrors the existing patient auth guard).
- `src/screens/Login.tsx` — added a small "Hospital Staff Login" link on the mobile-number entry screen.
- `README.md` — documented every workflow, including the new Chief Complaint and Staff Portal sections.

**Verification:** Full Playwright smoke test across the patient flow (login → chief complaint → appointments) and the staff flow (staff login → dashboard → all 4 Admin Masters tabs), zero console/page errors; visually confirmed via screenshots.

**Suggested commit message:**
```
feat: add Chief Complaint entry and mobile Staff Portal with RBAC

Bring the app fully in line with the client's Patient Portal BRD by
adding the two workflows that weren't yet covered:

- Chief Complaint self-entry on upcoming appointments (predefined
  list + free text, locks after check-in), per the BRD's nice-to-have
  workflow.
- A role-based mobile Staff Portal (/staff/login): Staff/Supervisor/
  Department Head/Admin/Management roles, department-scoped dashboards
  with respond/escalate/close actions, and Admin Masters screens
  (Service Master, Department & Person Mapping, SLA Master,
  Notification Master) matching the BRD's Recommended Master
  Configuration section.

All existing patient-facing business logic (registration, family
linking, booking, payments, refunds, diet, feedback/complaint SLA
escalation) was verified against the BRD and left untouched.

Verified end-to-end with Playwright across both the patient and staff
flows, zero console errors.
```

---

## How to use this file

Each section above already reads as a self-contained commit — you can copy the "Suggested commit message" blocks verbatim, or squash both into one commit if you'd rather ship it as a single push. If you split them into two commits, do the feature commit first and the build-fix commit second (or vice versa — they touch different files and don't depend on each other), for example:

```bash
git add src/data/types.ts src/data/seed.ts src/data/store.tsx src/screens/Appointments.tsx src/screens/Login.tsx src/screens/staff/ src/App.tsx README.md
git commit -m "feat: add Chief Complaint entry and mobile Staff Portal with RBAC"

git add package.json package-lock.json
git commit -m "fix: move build-time packages out of devDependencies"

git push
```
