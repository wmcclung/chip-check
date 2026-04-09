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
  getWakeStats,
  getMissStats,
} = require('./db');
const { broadcastShame, sendDigest, sendSMS } = require('./sms');
const { broadcastShameEmail, sendDigestEmail, sendSuccessEmail } = require('./email');

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
app.use('/', require('./routes/stats'));

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
      const missStats = await getMissStats();
      await broadcastShame(friends, name);
      await broadcastShameEmail(friends, name, missStats);
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

// ── Cron: Friday 5 PM CT — weekly summary to Chip ────────────────────────────

function minutesToTimeStr(minutes) {
  const h    = Math.floor(minutes / 60);
  const m    = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const dh   = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dh}:${String(m).padStart(2, '0')} ${ampm}`;
}

function avgMinutes(rows) {
  if (!rows.length) return null;
  return Math.round(rows.reduce((s, r) => s + r.checkin_minutes, 0) / rows.length);
}

cron.schedule('0 17 * * 5', async () => {
  try {
    const chipPhone = await getSetting('chip_phone');
    const chipEmail = await getSetting('chip_email');
    if (!chipPhone && !chipEmail) return; // not configured

    const name   = await getSetting('primary_user_name') || 'Chip';
    const streak = await getCurrentStreak();
    const wakeRows = await getWakeStats();

    const thisWeek = wakeRows.slice(0, 7);
    const lastWeek = wakeRows.slice(7, 14);
    const thisAvg  = avgMinutes(thisWeek);
    const lastAvg  = avgMinutes(lastWeek);
    const bestThis = thisWeek.length
      ? thisWeek.reduce((b, r) => r.checkin_minutes < b.checkin_minutes ? r : b)
      : null;

    const trendStr = (thisAvg != null && lastAvg != null)
      ? (lastAvg - thisAvg >= 10
          ? `${lastAvg - thisAvg} min earlier`
          : (thisAvg - lastAvg >= 10
              ? `${thisAvg - lastAvg} min later`
              : 'About the same'))
      : 'Not enough data';

    const smsBody = [
      `📊 Week in Review:`,
      `This week avg: ${thisAvg != null ? minutesToTimeStr(thisAvg) : '—'}`,
      `Last week avg: ${lastAvg != null ? minutesToTimeStr(lastAvg) : '—'}`,
      `Trend: ${trendStr}`,
      `Streak: ${streak} days`,
      `Best this week: ${bestThis ? minutesToTimeStr(bestThis.checkin_minutes) : '—'}`,
      `Keep going 🔥`,
    ].join('\n');

    if (chipPhone) {
      sendSMS(chipPhone, smsBody)
        .catch(err => console.error('[CRON WEEKLY] SMS failed:', err.message));
    }

    if (chipEmail) {
      // Reuse a simple friend-shaped object for sendSuccessEmail shape — just use raw resend
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const htmlBody = `<pre style="font-family:monospace;color:#f0e8d8;line-height:1.8">${smsBody}</pre>`;
      resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL,
        to:      chipEmail,
        subject: `📊 ${name}'s Weekly Wake-Up Review`,
        html:    `<!DOCTYPE html><html><body style="background:#0a0a0f;padding:2rem">${htmlBody}</body></html>`,
      }).catch(err => console.error('[CRON WEEKLY] Email failed:', err.message));
    }

    console.log('[CRON WEEKLY] Weekly summary sent to Chip');
  } catch (err) {
    console.error('[CRON WEEKLY] Error:', err);
  }
}, { timezone: 'America/Chicago' });

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

async function start() {
  await initDB();

  console.log('[EMAIL] Resend configured:', !!process.env.RESEND_API_KEY);
  console.log('[EMAIL] From address:', process.env.RESEND_FROM_EMAIL || 'NOT SET');

  app.listen(PORT, () => {
    console.log(`\n🏔️  Chip Check is running`);
    console.log(`👉 http://localhost:${PORT}\n`);
  });
}

start().catch(err => {
  console.error('[Fatal] Could not start server:', err);
  process.exit(1);
});
