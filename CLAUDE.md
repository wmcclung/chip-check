# Morning Accountability App — CLAUDE.md

## Project Overview

Build a mobile-first web accountability app. One primary user ("the sleeper") must check in with a selfie before a configurable deadline (default 9:00 AM CT) each weekday. A group of opted-in friends receive SMS/MMS notifications. An admin panel allows full management.

This is a complete full-stack Node.js app. Build everything in one pass. Do not scaffold placeholders — write real, working code for every feature listed.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite via `better-sqlite3`
- **Scheduler**: `node-cron`
- **SMS/MMS**: Twilio (`twilio` npm package)
- **Image storage**: Cloudinary (`cloudinary` npm package)
- **File uploads**: `multer` (to buffer, then pipe to Cloudinary)
- **Templating**: Vanilla HTML/CSS/JS served as static files or inline Express responses
- **Timezone**: All times in `America/Chicago` (CT). Set `TZ=America/Chicago` in env.
- **Hosting target**: Railway (reads from environment variables, listens on `process.env.PORT`)

---

## Environment Variables

Store in `.env` locally, Railway dashboard in production. Never hardcode.

```
PORT=3000
TZ=America/Chicago
ADMIN_PASSWORD=changeme
PRIMARY_USER_NAME=Jake
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CHECKIN_OPEN_HOUR=4
CHECKIN_DEADLINE_HOUR=9
```

`CHECKIN_OPEN_HOUR` and `CHECKIN_DEADLINE_HOUR` are integers (CT hour, 24h). Admin panel can update these in the DB; the env vars are just defaults for first run.

---

## Database Schema (SQLite)

Create all tables on startup via `db.exec(...)` if they don't exist.

### `settings`
| column | type | notes |
|---|---|---|
| key | TEXT PRIMARY KEY | |
| value | TEXT | |

Seed on first run (if not present):
- `checkin_open_hour` → `"4"`
- `checkin_deadline_hour` → `"9"`
- `primary_user_name` → value of `PRIMARY_USER_NAME` env var
- `admin_password` → value of `ADMIN_PASSWORD` env var

### `checkins`
| column | type | notes |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| date | TEXT | YYYY-MM-DD, unique |
| status | TEXT | `pending`, `success`, `missed`, `skipped` |
| selfie_url | TEXT | Cloudinary URL, nullable |
| checked_in_at | TEXT | ISO timestamp, nullable |
| streak_at_checkin | INTEGER | streak value after this day resolved |
| notes | TEXT | admin notes, nullable |

### `friends`
| column | type | notes |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| name | TEXT | |
| phone | TEXT | E.164 format e.g. +13125550100 |
| active | INTEGER | 1 = opted in, 0 = removed |
| joined_at | TEXT | ISO timestamp |

---

## Streak Logic

Compute streak as: count of consecutive most-recent days (going backward from yesterday or today) where status is `success` OR `skipped`. A `missed` day breaks the chain. `pending` days do not count and do not break.

Expose a `getCurrentStreak()` helper function used everywhere streak is displayed.

Weekend days: auto-insert as `skipped` at day open (4 AM cron). Do not auto-insert weekdays — they start as `pending` at 4 AM.

Skip days (manually set or weekends): if missed, no streak reset, no shame SMS. If checked in on a skip day, status becomes `success`, streak grows.

---

## Day Lifecycle (node-cron)

### 4:00 AM CT daily
- Insert a new row into `checkins` for today's date
- If today is Saturday or Sunday → status = `skipped`
- If today is a weekday → status = `pending`
- If a row already exists for today (admin pre-set it as skipped), leave it alone

### 9:00 AM CT daily (deadline — use the `checkin_deadline_hour` setting)
- Find today's row in `checkins`
- If status is still `pending` → update to `missed`, streak resets to 0
- Send shame SMS to all active friends: "❌ {name} missed his check-in today. Streak reset to 0. Shame him accordingly."
- If status is `skipped` → do nothing, no SMS
- If status is `success` → do nothing

Re-read `checkin_deadline_hour` from DB at cron fire time (not cached) so admin changes take effect.

---

## Routes

### `GET /`
Primary user check-in page. Mobile-optimized. Logic:

- Get current CT time
- Get today's checkin row from DB
- **Before open hour (4 AM):** Show "Come back after 4 AM" screen with current time displayed
- **Window open, status = pending:** Show big CHECK IN button
- **Window open, status = success:** Show streak + "Already checked in today" locked screen
- **Status = missed:** Show locked screen, streak = 0, LOTR failure quote
- **Status = skipped, not checked in:** Show "Rest day — no check-in required today" with optional check-in button that still works
- **Status = skipped, checked in:** Show success screen with streak

### `POST /checkin`
- Validate: window is open (between open hour and deadline hour CT)
- Validate: today's status is `pending` or `skipped`
- Accept multipart form data with `selfie` field (image file)
- Upload image to Cloudinary, get back a secure URL
- Update today's checkin row: status = `success`, selfie_url, checked_in_at, streak_at_checkin
- Compute new streak, store it
- Send success MMS to all active friends: selfie image + "✅ {name} checked in! Streak: X days 🔥"
- Return JSON `{ success: true, streak: X, quote: "..." }`

### `GET /join`
Opt-in page for friends. Simple form: first name + phone number (with +1 country code helper). Mobile-optimized. On submit → `POST /join`.

### `POST /join`
- Normalize phone to E.164
- Insert into `friends` table (or reactivate if phone exists)
- Return confirmation page

### `GET /admin`
If not authenticated (session cookie), redirect to `/admin/login`.
Admin dashboard showing:
- Today's status card
- Current streak
- Last selfie thumbnail (if exists)
- Calendar-style list of last 30 days with status badges
- Accountability friends list
- Settings form

### `GET /admin/login` / `POST /admin/login`
Simple password form. On success set a signed session cookie (use `express-session` with a random secret). Redirect to `/admin`.

Apply `express-rate-limit` to `POST /admin/login` only:
- Max 5 failed attempts per IP per 15 minutes
- After limit hit, return 429 with message: "Too many login attempts. Try again in 15 minutes."
- Use `standardHeaders: true`, `legacyHeaders: false`
- In-memory store is fine (no Redis needed)

### `POST /admin/day`
Body: `{ date, status, notes }`. Update a checkin row's status and notes. If setting to `missed` and it was previously `success`, recompute streak. If setting to `success` manually (no selfie), that's fine — selfie_url stays null. Recompute streak after any change.

### `POST /admin/streak`
Body: `{ value }`. Directly set the streak by updating the most recent resolved day's `streak_at_checkin`. Use this for bug recovery.

### `POST /admin/settings`
Body: `{ checkin_open_hour, checkin_deadline_hour, primary_user_name }`. Update settings table.

### `POST /admin/password`
Body: `{ current_password, new_password }`. Validate current, update settings table.

### `POST /admin/friends/:id/remove`
Set `active = 0` for that friend.

### `POST /admin/test-sms/:id`
Send a test SMS to that friend: "👋 Test message from Morning Accountability App. You're opted in!"

### `POST /admin/skip-day`
Body: `{ date }`. Insert or update that date as `skipped`. Used for pre-marking vacation days.

---

## Frontend Design

### Primary User Pages

**Aesthetic direction:** Dark, dramatic, high-contrast. Think Mordor meets alarm clock. Deep near-black background (`#0a0a0f`), parchment/amber text (`#c8a96e`), accent red (`#8b0000`). Font: a serif for quotes (Georgia or similar), bold condensed sans for status/numbers.

**CHECK IN screen:**
- Full viewport, centered
- Large streak number at top in amber
- Day/date subtitle
- Big pulsing CHECK IN button in deep red, white text
- Subtle animated ring around button

**SELFIE NOW screen:**
- Pure white background (`#ffffff`), `filter: brightness(1)` max
- "SELFIE NOW" text flashes (CSS keyframe opacity 0→1→0, 3 second duration, bold, all-caps, large)
- After 3 seconds: flash stops, TAKE SELFIE button appears
- Clicking opens `<input type="file" accept="image/*" capture="user">` which on mobile triggers front camera

**Success screen:**
- Dark background returns
- 🔥 streak number, large, centered
- "DAY X COMPLETE" 
- LOTR success quote in serif italic, amber
- Locked for rest of day

**Missed/Locked screen:**
- Dark background
- Streak: 0
- "STREAK BROKEN"
- LOTR failure quote in serif italic, muted red

### `/join` Page

Clean, mobile-friendly. Dark theme matching primary page. Simple form, clear instructions. "Your friends will see your number only for notifications."

### Admin Panel

Functional, clean, dark theme. No need for heavy design — prioritize usability. Tables, status badges (green/red/gray/yellow), a settings form, a friends list with remove buttons. Use `<details>` dropdowns or tabs to organize sections. Keep it all on one page.

---

## LOTR Quotes

Hardcode these arrays in a `quotes.js` module.

**Success quotes (pick randomly):**
1. "Even the smallest person can change the course of the future." — Galadriel
2. "There is some good in this world, and it's worth fighting for." — Samwise Gamgee
3. "I would rather share one lifetime with you than face all the ages of this world alone." — Arwen
4. "It's a dangerous business, Frodo, going out your door. You step onto the road, and if you don't keep your feet, there's no knowing where you might be swept off to." — Bilbo Baggins
5. "You shall not pass!" — Gandalf (use this for a big milestone like streak 30)
6. "All we have to decide is what to do with the time that is given us." — Gandalf
7. "The world is not in your books and maps; it's out there." — Gandalf
8. "Courage is found in unlikely places." — Gildor
9. "I am no man." — Éowyn (works universally)
10. "End? No, the journey doesn't end here." — Gandalf

**Failure quotes (pick randomly):**
1. "So it is that darkness claims its newest servant." — Gandalf (about Boromir)
2. "The ring has awoken. It's heard its master's call." — Gandalf
3. "What has it got in its pocketses?" — Gollum
4. "You cannot pass. The dark fire will not avail you." — Balrog (reversed — now it's for the sleeper)
5. "I have looked into your future and it's not so bright." — use Denethor flavor: "Hope is not in your nature today."
6. "They're taking the hobbits to Isengard!" — a silly one to break the tension
7. "One does not simply wake up on time." — Boromir (adapted)
8. "Even darkness must pass. A new day will come." — Samwise

---

## Streak Milestone Bonuses

At certain streak milestones, use a specific quote and add a 🏆 badge on the success screen:
- Day 5: Gandalf "All we have to decide..."
- Day 10: Aragorn "There is always hope"  
- Day 20: Galadriel "Even the smallest person..."
- Day 30: "You shall not pass!" full screen moment
- Day 50: Sam "I can't carry it for you, but I can carry you"
- Day 100: Custom — "One hundred mornings. The ring is destroyed. You have won."

---

## Error Handling

- All routes: wrap in try/catch, return meaningful error responses
- Twilio failures: log error but do NOT fail the check-in. Check-in succeeds even if SMS fails.
- Cloudinary failures: return 500, do not mark check-in as success if image didn't upload
- Cron jobs: wrap in try/catch, log errors

---

## File Structure

```
/
├── CLAUDE.md
├── package.json
├── .env (gitignored)
├── .gitignore
├── server.js          # Express app, route mounting, cron jobs
├── db.js              # SQLite setup, schema creation, helper functions
├── quotes.js          # LOTR quote arrays and picker functions
├── sms.js             # Twilio send functions
├── cloudinary.js      # Cloudinary upload helper
├── routes/
│   ├── checkin.js     # GET / and POST /checkin
│   ├── join.js        # GET /join and POST /join
│   └── admin.js       # All /admin routes
└── public/
    ├── style.css       # Shared styles
    ├── checkin.js      # Frontend JS for primary user flow
    └── admin.js        # Frontend JS for admin panel
```

---

## package.json dependencies

```json
{
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cloudinary": "^2.2.0",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "express-rate-limit": "^7.3.1",
    "express-session": "^1.18.0",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.3",
    "twilio": "^5.0.4"
  }
}
```

---

## Railway Deployment Notes

- App must listen on `process.env.PORT`
- Set all env vars in Railway dashboard under Variables
- SQLite file will be at `./data/db.sqlite` — Railway has ephemeral storage, so data resets on redeploy. This is acceptable for a small friend group; document this limitation clearly in a README.
- Add a `Procfile`: `web: node server.js`

---

## What to Build First (suggested order)

1. `db.js` — schema, seed, helpers
2. `server.js` — app setup, session, static files, mount routes
3. `quotes.js` — static data
4. `cloudinary.js` and `sms.js` — service wrappers
5. `routes/checkin.js` + `public/checkin.js` + `public/style.css`
6. `routes/join.js`
7. `routes/admin.js` + `public/admin.js`
8. Cron jobs (in server.js)
9. Test all routes manually, verify cron logic with a fake time
10. Write README with setup instructions

---

## README Must Include

- All environment variables and where to get them (Twilio, Cloudinary)
- How to run locally
- How to deploy to Railway
- Note that SQLite is ephemeral on Railway (data resets on redeploy) — future improvement would be a hosted DB
- How to add friends (via /join link)
- How to access admin panel
