# Morning Accountability App

A mobile-first web app where one person must check in with a selfie before a daily deadline or face SMS shame from their friends.

## Features

- Daily selfie check-in with deadline enforcement
- LOTR-themed UI (dark, dramatic)
- SMS/MMS notifications to opted-in friends via Twilio
- Streak tracking with milestone quotes
- Weekend auto-skip
- Admin panel for full management

## Environment Variables

Create a `.env` file (or set in Railway dashboard):

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `TZ` | Must be `America/Chicago` |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `PRIMARY_USER_NAME` | Name shown in SMS messages (e.g. `Jake`) |
| `TWILIO_ACCOUNT_SID` | From [console.twilio.com](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | From [console.twilio.com](https://console.twilio.com) |
| `TWILIO_PHONE_NUMBER` | Your Twilio number in E.164 format (e.g. `+13125550100`) |
| `CLOUDINARY_CLOUD_NAME` | From [cloudinary.com/console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `CHECKIN_OPEN_HOUR` | CT hour check-in opens (default: `4` = 4 AM) |
| `CHECKIN_DEADLINE_HOUR` | CT hour deadline (default: `9` = 9 AM) |

## Running Locally

```bash
cd morning-accountability
npm install
# Fill in .env with your credentials
node server.js
```

Open http://localhost:3000

## Adding Friends

Share the `/join` link with friends. They enter their name and phone number to opt in to SMS notifications.

## Admin Panel

Visit `/admin` and log in with `ADMIN_PASSWORD`.

From the admin panel you can:
- View today's status and current streak
- Browse 30-day history and edit any day's status
- Manage the friends list (remove, send test SMS)
- Update check-in hours and user name
- Pre-mark vacation/skip days
- Manually override the streak counter

## Deploying to Railway

1. Create a new Railway project and connect your GitHub repo
2. Set all environment variables in the Railway **Variables** tab
3. Railway auto-detects Node.js and uses `node server.js` (or the `Procfile`)
4. The app listens on `process.env.PORT` automatically

> **Note:** SQLite is stored at `./data/db.sqlite`. Railway uses ephemeral storage — **data resets on every redeploy**. For persistence, a future improvement would be to use a hosted database like PlanetScale or Turso (libSQL). For a small friend group this is acceptable as the streak can be recovered via the admin override.

## Day Lifecycle

- **4:00 AM CT** — New day opens. Weekdays start as `pending`, weekends as `skipped`.
- **9:00 AM CT** (configurable) — Deadline fires. Any still-`pending` day becomes `missed` and shame SMS goes out.
- Check-in window: 4 AM – 9 AM CT on weekdays. Works on skip days too (optional).
