require('dotenv').config();
process.env.TZ = 'America/Chicago';

const express = require('express');
const session = require('express-session');
const cron    = require('node-cron');
const path    = require('path');
const crypto  = require('crypto');

const { DateTime } = require('luxon');
const {
  init: initDB,
  getSetting,
  insertCheckin,
  getTodayCheckin,
  updateCheckin,
  getCurrentStreak,
  getActiveFriends,
  getDigestFriends,
  updateFriendDigestSent,
} = require('./db');
const { broadcastShame, sendDigest } = require('./sms');
const { broadcastShameEmail, sendDigestEmail, transporter } = require('./email');

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

cron.schedule('0 4 * * *', async () => {
  try {
    const dateStr = getCTDateStr();
    const dow     = getCTDayOfWeek();
    const status  = (dow === 0 || dow === 6) ? 'skipped' : 'pending';

    await insertCheckin(dateStr, status);
    console.log(`[CRON 4AM] Opened day ${dateStr} as ${status}`);
  } catch (err) {
    console.error('[CRON 4AM] Error:', err);
  }
}, { timezone: 'America/Chicago' });

// ── Cron: deadline — shame check ──────────────────────────────────────────────

cron.schedule('0 * * * *', async () => {
  try {
    const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9', 10);
    const now = new Date();
    const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const currentHour = ct.getHours();

    if (currentHour !== deadlineHour) return;

    const dateStr = getCTDateStr();
    const checkin = await getTodayCheckin(dateStr);

    if (!checkin || checkin.status !== 'pending') {
      console.log(`[CRON DEADLINE] ${dateStr} status is ${checkin ? checkin.status : 'no row'} — no action`);
      return;
    }

    await updateCheckin(dateStr, { status: 'missed', streak_at_checkin: 0 });
    console.log(`[CRON DEADLINE] ${dateStr} marked as missed`);

    const name    = await getSetting('primary_user_name') || 'Jake';
    const friends = await getActiveFriends();
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
    const name         = await getSetting('primary_user_name') || 'Jake';
    const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9', 10);
    const dateStr      = getCTDateStr();
    const todayCheckin = await getTodayCheckin(dateStr);
    const nowUtc       = DateTime.utc();

    const digestFriends = await getDigestFriends();

    for (const friend of digestFriends) {
      if (!friend.digest_time || !friend.timezone) continue;

      const friendNow = nowUtc.setZone(friend.timezone);

      const [dh, dm] = friend.digest_time.split(':').map(Number);
      const digestMinutes = dh * 60 + dm;
      const friendMinutes = friendNow.hour * 60 + friendNow.minute;

      if (friendMinutes < digestMinutes || friendMinutes >= digestMinutes + 15) continue;

      const friendDateStr = friendNow.toFormat('yyyy-MM-dd');
      if (friend.last_digest_sent === friendDateStr) continue;

      await sendDigest(friend, name, todayCheckin, deadlineHour);
      await sendDigestEmail(friend, name, todayCheckin, deadlineHour);

      await updateFriendDigestSent(friend.id, friendDateStr);
      console.log(`[CRON DIGEST] Sent digest to ${friend.name} (${[friend.phone, friend.email].filter(Boolean).join(', ')})`);
    }
  } catch (err) {
    console.error('[CRON DIGEST] Error:', err);
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

async function start() {
  await initDB();

  const verifyTimeout = setTimeout(() => {
    console.error('[EMAIL] transporter.verify() timed out after 10s — Railway may be blocking outbound SMTP');
  }, 10000);
  transporter.verify((error, success) => {
    clearTimeout(verifyTimeout);
    if (error) {
      console.error('[EMAIL] SMTP connection failed:', error.message);
      console.error('[EMAIL] Full error:', JSON.stringify(error));
    } else {
      console.log('[EMAIL] SMTP connection verified and ready');
    }
  });

  app.listen(PORT, () => {
    console.log(`\n🏔️  Chip Check is running`);
    console.log(`👉 http://localhost:${PORT}\n`);
  });
}

start().catch(err => {
  console.error('[Fatal] Could not start server:', err);
  process.exit(1);
});
