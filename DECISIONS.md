# Chip Check — Technical Decisions & Known Constraints

## Railway
- Railway blocks ALL outbound SMTP on ports 465 and 587 regardless
  of provider (tested: Gmail, Namecheap Private Email). Do not
  attempt any SMTP-based email solution.
- Use HTTP-based APIs only for external services (Resend, Twilio)
- Railway requires app.set('trust proxy', 1) for express-rate-limit
  to work correctly behind Railway's proxy
- SQLite is ephemeral on Railway — data wipes on every redeploy.
  We use Railway Postgres via ${{Postgres.DATABASE_URL}} reference
- connect.session() MemoryStore warning is expected in production
  and non-critical for this app's scale

## Email
- Provider: Resend (resend.com) using HTTP API, not SMTP
- Sending domain: riversgoat.com (verified in Resend)
- From address: rivers@riversgoat.com
- Env vars: RESEND_API_KEY and RESEND_FROM_EMAIL
- Do not use nodemailer, Gmail SMTP, or any SMTP transport

## SMS
- Provider: Twilio
- A2P 10DLC registration pending approval (~7 business days)
- SMS will not deliver until A2P is approved — this is expected
- Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- MMS selfie delivery will work once A2P clears

## Database
- Production: Railway Postgres via pg package
- Local: Same Railway Postgres instance via DATABASE_URL in .env
  using the public URL
- better-sqlite3 has been fully removed
- All queries are async/await with pg Pool

## Hosting
- Platform: Railway
- GitHub repo: wmcclung/chip-check
- Auto-deploys on push to main branch
- Public URL: web-production-d9820b.up.railway.app

## Primary User
- Name: Chip
- Check-in window: 4AM - 9AM CT
- Weekends are auto-skipped but count if he checks in

## Known Working
- Check-in flow with selfie upload to Cloudinary
- Admin panel with test tools
- Email notifications via Resend
- Streak tracking and milestone system
- Friend opt-in via /join page
- Postgres persistence across deploys
