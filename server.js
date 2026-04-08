require('dotenv').config();
process.env.TZ = 'America/Chicago';

const express = require('express');
const session = require('express-session');
const cron    = require('node-cron');
const path    = require('path');
const crypto  = require('crypto');

const { DateTime } = require('luxon');
const {
  getSetting,
  insertCheckin,
  getTodayCheckin,
  updateCheckin,
  getCurrentStreak,
  getActiveFriends,
  db,
} = require('./db');
const { broadcastShame, sendDigest } = require('./sms');
const { broadcastShameEmail, sendDigestEmail } = require('./email');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:            process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   8 * 60 * 60 * 1000, // 8 hours
  },
}));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/', require('./routes/checkin'));
app.use('/', require('./routes/join'));
app.use('/', require('./routes/admin'));

// ── Cron helpers ──────────────────────────────────────────────────────────────

function getCTDateStr() {
  const now = new Date();
  const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return [
    ct.getFullYear(),
    String(ct.getMonth() + 1).padStart(2, '0'),
    String(ct.getDate()).padStart(2, '0'),
  ].join('-');
}

function getCTDayOfWeek() {
  const now = new Date();
  const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return ct.getDay(); // 0 = Sun, 6 = Sat
}

// ── Cron: 4 AM — open day ──────────────────────────────────────────────────────

cron.schedule('0 4 * * *', () => {
  try {
    const dateStr = getCTDateStr();
    const dow     = getCTDayOfWeek();
    const status  = (dow === 0 || dow === 6) ? 'skipped' : 'pending';

    // INSERT OR IGNORE — leaves existing rows alone
    insertCheckin(dateStr, status);
    console.log(`[CRON 4AM] Opened day ${dateStr} as ${status}`);
  } catch (err) {
    console.error('[CRON 4AM] Error:', err);
  }
}, { timezone: 'America/Chicago' });

// ── Cron: deadline — shame check ─────────────────────────────────────────────
// Run every minute in the deadline hour range to catch dynamic deadline setting.
// Actually fire logic only when current hour matches the deadline setting.

cron.schedule('0 * * * *', async () => {
  try {
    const deadlineHour = parseInt(getSetting('checkin_deadline_hour') || '9', 10);
    const now = new Date();
    const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const currentHour = ct.getHours();

    if (currentHour !== deadlineHour) return;

    const dateStr = getCTDateStr();
    const checkin = getTodayCheckin(dateStr);

    if (!checkin || checkin.status !== 'pending') {
      console.log(`[CRON DEADLINE] ${dateStr} status is ${checkin ? checkin.status : 'no row'} — no action`);
      return;
    }

    // Missed!
    updateCheckin(dateStr, { status: 'missed', streak_at_checkin: 0 });
    console.log(`[CRON DEADLINE] ${dateStr} marked as missed`);

    const name    = getSetting('primary_user_name') || 'Jake';
    const friends = getActiveFriends();
    if (friends.length > 0) {
      await broadcastShame(friends, name);
      await broadcastShameEmail(friends, name);
      console.log(`[CRON DEADLINE] Shame notifications sent to ${friends.length} friends`);
    }
  } catch (err) {
    console.error('[CRON DEADLINE] Error:', err);
  }
}, { timezone: 'America/Chicago' });

// ── Cron: digest — send digest SMS every 15 minutes ──────────────────────────

cron.schedule('*/15 * * * *', async () => {
  try {
    const name         = getSetting('primary_user_name') || 'Jake';
    const deadlineHour = parseInt(getSetting('checkin_deadline_hour') || '9', 10);
    const dateStr      = getCTDateStr();
    const todayCheckin = getTodayCheckin(dateStr);
    const nowUtc       = DateTime.utc();

    const digestFriends = db.prepare(
      "SELECT * FROM friends WHERE active = 1 AND notify_mode = 'digest'"
    ).all();

    for (const friend of digestFriends) {
      if (!friend.digest_time || !friend.timezone) continue;

      // Convert current UTC time to friend's timezone
      const friendNow = nowUtc.setZone(friend.timezone);

      // Check if current time falls within this 15-min window starting at digest_time
      const [dh, dm] = friend.digest_time.split(':').map(Number);
      const digestMinutes = dh * 60 + dm;
      const friendMinutes = friendNow.hour * 60 + friendNow.minute;

      if (friendMinutes < digestMinutes || friendMinutes >= digestMinutes + 15) continue;

      // Check we haven't already sent their digest today (in their local date)
      const friendDateStr = friendNow.toFormat('yyyy-MM-dd');
      if (friend.last_digest_sent === friendDateStr) continue;

      // Send digest via SMS and/or email
      await sendDigest(friend, name, todayCheckin, deadlineHour);
      await sendDigestEmail(friend, name, todayCheckin, deadlineHour);

      // Mark digest as sent for today
      db.prepare('UPDATE friends SET last_digest_sent = ? WHERE id = ?').run(friendDateStr, friend.id);
      console.log(`[CRON DIGEST] Sent digest to ${friend.name} (${[friend.phone, friend.email].filter(Boolean).join(', ')})`);
    }
  } catch (err) {
    console.error('[CRON DIGEST] Error:', err);
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏔️  Chip Check is running`);
  console.log(`👉 http://localhost:${PORT}\n`);
});
