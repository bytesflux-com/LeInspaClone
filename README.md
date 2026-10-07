# Le-Inspa-Admin-Panel
Official Le Inspa Admin Panel — a secure web dashboard for managing users, businesses, bookings, services, content, and platform operations.

## Stack

- **Frontend:** React 19, Vite, React Router 7, Tailwind CSS 4 (PostCSS), Lucide / Heroicons
- **Backend:** Firebase — Firestore, Cloud Storage, Auth, Cloud Functions (Node 24)
- **Maps:** Leaflet / React-Leaflet, Google Places Autocomplete
- **Utilities:** date-fns(-tz), jsPDF + autotable, SheetJS (xlsx), browser-image-compression, react-easy-crop, Recharts, SimpleWebAuthn

## Project layout

```
src/
  components/layout/   AdminLayout (sidebar), ProtectedRoute (admin guard)
  context/             AuthContext (Firebase Auth + admin custom claim)
  lib/                 firebase.js (client SDK + emulator wiring), googleMaps.js
  pages/               Route pages
  router.jsx           Route table
functions/             Cloud Functions (Node 24, ESM)
  src/index.js         Callable functions
  src/mailer.js        Nodemailer transport (SMTP via Firebase secrets)
  scripts/grant-admin.js
firebase.json          Hosting target "admin" + functions codebase "admin"
```

## Getting started

```bash
npm install
cd functions && npm install && cd ..
cp .env.example .env    # fill in your Firebase web config
npm run dev
```

### Shared Firebase project

This panel shares the `le-inspa` Firebase project with the mobile client app.

- **Rules are not deployed from this repo.** Firestore/Storage rules are project-wide and live in one place (the mobile repo). Add admin access rules there.
- **Functions use the `admin` codebase**, so deploying here never touches the mobile app's functions (and vice versa). Function names must still be unique across the project — prefix admin ones with `admin`.
- **Hosting deploys to its own site** via the `admin` target.

One-time hosting setup:

```bash
firebase login
firebase hosting:sites:create le-inspa-admin        # pick any available site ID
firebase target:apply hosting admin le-inspa-admin
```

Deploy:

```bash
firebase deploy --only hosting:admin
firebase deploy --only functions:admin
```

Never run a bare `firebase deploy` from either repo without checking what it includes.

### Admin Cloud Functions (`functions/`, codebase `admin`)

| Function | Purpose |
|---|---|
| `adminPing` | Health check |
| `adminStartSecondFactor` | ADM-002 — emails a 6-digit code for the current sign-in (or resumes the active one) |
| `adminVerifySecondFactor` | ADM-002 — checks the code; on success sets the `adm2fa` claim for this sign-in |
| `adminRequestPasswordReset` | ADM-003 — emails a recovery code to active admins; always the same neutral answer (no enumeration) |
| `adminVerifyPasswordReset` | ADM-003 — exchanges the code for a single-use, 15-minute reset token |
| `adminCompletePasswordReset` | ADM-003 — sets the new password (12+ chars, mixed case, number, symbol), revokes all sessions, emails a notice |
| `adminGetSession` | ADM-004 — session status + activity heartbeat; returns identity and fresh role/permissions/markets |
| `adminVerifySession` | ADM-004 — re-verifies a locked session with the admin's password (checked by Firebase Auth); 5 failures end the session |
| `adminEndSession` | Ends the current admin session server-side (sign out / "Not You?") |
| `adminGetDashboardSummary` | ADM-005 Global Dashboard — read-only counts/aggregates over `users`, `bookings`, `withdrawal_requests`, `support_tickets` |

Every function checks admin access server-side (`functions/src/auth.js`), using the same rule as the mobile backend, plus account status. All except the two ADM-002 functions also require two-factor verification for the current sign-in (`adm2fa` claim == token `auth_time`).

**Admin access collections** (`functions/src/accessModel.js`, written only by these functions):

| Collection | Contents | Written |
|---|---|---|
| `admin_permissions` | Catalog of admin permissions (`withdrawals.approve`, …) | On login when missing/outdated (`CATALOG_VERSION`) |
| `admin_roles` | `super_admin`, `country_admin`, `finance_admin`, `verification_officer`, `support_agent` | Same |
| `admin_profiles/{uid}` | `roleId`, `status` (ACTIVE / SUSPENDED / REVOKED), `twoFactorEnabled`, `lastLoginAt` | First and every 2FA-verified login; existing admins start as `super_admin` |
| `admin_sessions/{uid}_{authTime}` | One per 2FA-verified sign-in: IP, user agent, `ACTIVE`/`REVOKED` | On 2FA success; revoked on password reset |

A non-ACTIVE profile blocks access; functions can require a role permission via `requireAdmin(request, { permission })`.

**Session security (ADM-004, `functions/src/session.js`)** is enforced on every admin call, not by the browser:

- Idle for 15 minutes → session `LOCKED`; the workspace blurs behind ADM-004 and the interrupted request is retried after verification, so the admin stays on the same screen.
- `requireAdmin(request, { fresh: true })` marks a sensitive action: it needs a verification within the last 10 minutes.
- Sessions last at most 12 hours; a different browser/device, 5 failed verifications, sign-out, suspension or a password reset end the session (full sign-in).
- Defaults can be overridden without a redeploy in `platform_settings/admin_security`: `idleTimeoutMinutes`, `maxSessionHours`, `sensitiveFreshnessMinutes`, `maxVerificationAttempts`.

**Two-factor and recovery codes** (`functions/src/otp.js`) reuse the mobile backend's email verification engine: the `email_verification_requests` collection (purposes `admin_2fa`, `admin_password_reset`), HMAC hashing with the shared `OTP_HASH_SECRET`, 5-minute expiry, 60 s resend delay, 5 sends/hour, 5 attempts then a 15-minute lock. Emails go out from a leinspa.com mailbox on Namecheap Private Email (`mail.privateemail.com:465`, SSL) and need, once per project:

```bash
firebase functions:secrets:set EMAIL_SMTP_PASSWORD   # password of the sending mailbox
# EMAIL_SENDER_ADDRESS (e.g. no-reply@leinspa.com) is asked for on the first deploy
```

The emulators need Java 21+ (`JAVA_HOME=/usr/lib/jvm/java-25-openjdk` works on this machine).

### Local development with emulators

```bash
# .env
VITE_USE_EMULATORS=true

firebase emulators:start   # in one terminal
npm run dev                # in another
```
