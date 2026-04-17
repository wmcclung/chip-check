const express     = require('express');
const rateLimit   = require('express-rate-limit');
const router      = express.Router();
const { DateTime } = require('luxon');
const { sendTestSMS, broadcastShame, broadcastSuccess, sendDigest } = require('../sms');
const { sendTestEmail, broadcastSuccessEmail, broadcastShameEmail, sendDigestEmail } = require('../email');
const {
  getSetting, setSetting,
  getCurrentStreak,
  getTodayCheckin,
  getRecentCheckins,
  updateCheckin,
  insertCheckin,
  getActiveFriends,
  getAllFriends,
  getDigestFriends,
  getLastResolvedCheckin,
  removeFriend,
  getFriendById,
  updateFriendPrefs,
  updateFriendDigestSent,
  getWakeStats,
  getTimeMilestones,
  getMissStats,
  getQuestState,
  getCurrentCampaign,
  updateQuestState,
  archiveCampaign,
  createNewCampaign,
  getAllCampaigns,
  getDecisionLog,
  resetCampaign,
} = require('../db');
const {
  CAMPAIGN_1,
  getChapter,
} = require('../quest');

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (ET)'  },
  { value: 'America/Chicago',     label: 'Central (CT)'  },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Phoenix',     label: 'Arizona (MT, no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)'  },
];

function getCTDateStr() {
  const ct = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return [
    ct.getFullYear(),
    String(ct.getMonth() + 1).padStart(2, '0'),
    String(ct.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── Hard timeout wrapper ───────────────────────────────────────────────────────
// Wraps any async route handler and guarantees a response within `ms` ms.
// Intercepts res.json / res.send / res.redirect to clear the timer as soon as
// the handler sends a response. Catches any thrown error and sends 500.

function withTimeout(handler, ms = 15000) {
  return async function (req, res, next) {
    let done = false;

    const timer = setTimeout(() => {
      if (!done && !res.headersSent) {
        done = true;
        console.error(`[TIMEOUT] ${req.method} ${req.path} did not respond within ${ms}ms`);
        res.status(504).json({ success: false, error: 'Request timed out' });
      }
    }, ms);

    function finish() {
      done = true;
      clearTimeout(timer);
    }

    // Intercept the three response-sending methods
    const origJson     = res.json.bind(res);
    const origSend     = res.send.bind(res);
    const origRedirect = res.redirect.bind(res);
    res.json     = function (...a) { finish(); return origJson(...a); };
    res.send     = function (...a) { finish(); return origSend(...a); };
    res.redirect = function (...a) { finish(); return origRedirect(...a); };

    try {
      await handler(req, res, next);
    } catch (err) {
      if (!done && !res.headersSent) {
        finish();
        console.error(`[UNCAUGHT] ${req.method} ${req.path}:`, err);
        res.status(500).json({ error: err.message || 'Server error' });
      } else {
        // Response already sent — log but don't double-respond
        console.error(`[ERROR after response] ${req.method} ${req.path}:`, err);
      }
    }
  };
}

// ── Auth middleware ────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ── Rate limiter for login ─────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         'Too many login attempts. Try again in 15 minutes.',
});

// ── GET /admin/login ──────────────────────────────────────────────────────────

router.get('/admin/login', (req, res) => {
  res.send(loginPage(''));
});

// ── POST /admin/login ─────────────────────────────────────────────────────────

router.post('/admin/login', loginLimiter, withTimeout(async (req, res) => {
  const { password } = req.body;
  const stored = await getSetting('admin_password');
  if (password === stored) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.status(401).send(loginPage('Invalid password.'));
  console.log('[/admin/login] Route complete, response sent');
}));

// ── GET /admin ────────────────────────────────────────────────────────────────

router.get('/admin', requireAuth, withTimeout(async (req, res) => {
  const name         = await getSetting('primary_user_name') || 'Jake';
  const streak       = await getCurrentStreak();
  const openHour     = await getSetting('checkin_open_hour')     || '4';
  const deadlineHour = await getSetting('checkin_deadline_hour') || '9';
  const wakeGoalTime = await getSetting('wake_goal_time') || '420';
  const chipPhone    = await getSetting('chip_phone')     || '';
  const chipEmail    = await getSetting('chip_email')     || '';

  const now   = new Date();
  const ctNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const dateStr = [
    ctNow.getFullYear(),
    String(ctNow.getMonth() + 1).padStart(2, '0'),
    String(ctNow.getDate()).padStart(2, '0'),
  ].join('-');

  const today      = await getTodayCheckin(dateStr);
  const history    = await getRecentCheckins(30);
  const friends    = await getAllFriends();
  const bestStreak = parseInt(await getSetting('best_streak') || '0', 10);
  const questState    = await getQuestState();
  const questCampaign = await getCurrentCampaign();
  const allCampaigns  = await getAllCampaigns();
  const wakeStats     = await getWakeStats();
  let decisionLog  = {};
  try { decisionLog = await getDecisionLog(); } catch (_) {}
  const archiveToken = await getSetting('archive_token') || null;

  res.send(adminDashboard({ name, streak, bestStreak, today, history, friends, openHour, deadlineHour, dateStr, wakeGoalTime, chipPhone, chipEmail, questState, questCampaign, allCampaigns, wakeStats, decisionLog, archiveToken }));
  console.log('[GET /admin] Route complete, response sent');
}));

// ── POST /admin/day ───────────────────────────────────────────────────────────

router.post('/admin/day', requireAuth, withTimeout(async (req, res) => {
  const { date, status, notes } = req.body;
  if (!date || !status) return res.status(400).json({ error: 'date and status required' });

  await updateCheckin(date, { status, notes: notes || null });
  const streak = await getCurrentStreak();
  if (['success', 'missed', 'skipped'].includes(status)) {
    await updateCheckin(date, { streak_at_checkin: status === 'missed' ? 0 : streak });
  }

  res.json({ ok: true, streak });
  console.log('[/admin/day] Route complete, response sent');
}));

// ── POST /admin/streak ────────────────────────────────────────────────────────

router.post('/admin/streak', requireAuth, withTimeout(async (req, res) => {
  const value = parseInt(req.body.value, 10);
  if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Invalid value' });

  const row = await getLastResolvedCheckin();
  if (!row) return res.status(404).json({ error: 'No resolved checkin found' });

  await updateCheckin(row.date, { streak_at_checkin: value });
  res.json({ ok: true, date: row.date, streak: value });
  console.log('[/admin/streak] Route complete, response sent');
}));

// ── POST /admin/best-streak ───────────────────────────────────────────────────

router.post('/admin/best-streak', requireAuth, withTimeout(async (req, res) => {
  const value = parseInt(req.body.value, 10);
  if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Invalid value' });
  await setSetting('best_streak', value);
  res.json({ ok: true, bestStreak: value });
  console.log('[/admin/best-streak] Route complete, response sent');
}));

// ── POST /admin/settings ──────────────────────────────────────────────────────

router.post('/admin/settings', requireAuth, withTimeout(async (req, res) => {
  const { checkin_open_hour, checkin_deadline_hour, primary_user_name, wake_goal_time, chip_phone, chip_email } = req.body;
  if (checkin_open_hour)     await setSetting('checkin_open_hour',     checkin_open_hour);
  if (checkin_deadline_hour) await setSetting('checkin_deadline_hour', checkin_deadline_hour);
  if (primary_user_name)     await setSetting('primary_user_name',     String(primary_user_name).trim());
  if (wake_goal_time)        await setSetting('wake_goal_time',        String(parseInt(wake_goal_time, 10)));
  await setSetting('chip_phone', chip_phone ? String(chip_phone).trim() : '');
  await setSetting('chip_email', chip_email ? String(chip_email).trim().toLowerCase() : '');
  res.redirect('/admin');
}));

// ── POST /admin/password ──────────────────────────────────────────────────────

router.post('/admin/password', requireAuth, withTimeout(async (req, res) => {
  const { current_password, new_password } = req.body;
  const stored = await getSetting('admin_password');
  if (current_password !== stored) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }
  if (!new_password || new_password.length < 4) {
    return res.status(400).json({ error: 'New password too short' });
  }
  await setSetting('admin_password', new_password);
  res.json({ ok: true });
  console.log('[/admin/password] Route complete, response sent');
}));

// ── POST /admin/friends/:id/remove ───────────────────────────────────────────

router.post('/admin/friends/:id/remove', requireAuth, withTimeout(async (req, res) => {
  await removeFriend(parseInt(req.params.id, 10));
  res.redirect('/admin');
}));

// ── POST /admin/friends/:id/prefs ────────────────────────────────────────────

router.post('/admin/friends/:id/prefs', requireAuth, withTimeout(async (req, res) => {
  const id     = parseInt(req.params.id, 10);
  const friend = await getFriendById(id);
  if (!friend) return res.status(404).json({ error: 'Friend not found' });

  const { notify_mode, digest_time, timezone, notify_success, notify_missed, notify_sms, notify_email, email } = req.body;

  const notifySuccess = notify_success === '1' || notify_success === 1 ? 1 : 0;
  const notifyMissed  = notify_missed  === '1' || notify_missed  === 1 ? 1 : 0;
  if (!notifySuccess && !notifyMissed) {
    return res.status(400).json({ error: 'At least one notification type must be selected.' });
  }

  const notifySMS    = notify_sms   === '1' || notify_sms   === 1 ? 1 : 0;
  const notifyEmail  = notify_email === '1' || notify_email === 1 ? 1 : 0;
  const safeEmail    = email ? String(email).trim().toLowerCase().slice(0, 200) : null;
  const mode         = notify_mode === 'digest' ? 'digest' : 'realtime';
  const allowedTz    = TIMEZONES.map(t => t.value);
  const safeTimezone = allowedTz.includes(timezone) ? timezone : 'America/Chicago';

  let safeDigestTime = null;
  if (mode === 'digest') {
    if (!digest_time || !/^\d{2}:\d{2}$/.test(digest_time)) {
      return res.status(400).json({ error: 'Invalid digest time. Use HH:MM format.' });
    }
    safeDigestTime = digest_time;
  }

  await updateFriendPrefs(id, {
    notify_success: notifySuccess,
    notify_missed:  notifyMissed,
    notify_mode:    mode,
    digest_time:    safeDigestTime,
    timezone:       safeTimezone,
    notify_sms:     notifySMS,
    notify_email:   notifyEmail,
    email:          safeEmail,
  });

  res.json({ ok: true });
  console.log('[/admin/friends/:id/prefs] Route complete, response sent');
}));

// ── POST /admin/test-sms/:id ──────────────────────────────────────────────────

router.post('/admin/test-sms/:id', requireAuth, withTimeout(async (req, res) => {
  const friend = await getFriendById(parseInt(req.params.id, 10));
  if (!friend) return res.status(404).json({ error: 'Friend not found' });

  const name     = await getSetting('primary_user_name') || 'Chip';
  const willSend = [];
  if (friend.notify_sms   !== 0 && friend.phone) willSend.push('SMS');
  if (friend.notify_email !== 0 && friend.email) willSend.push('email');

  // Respond immediately — notification sends are slow external calls
  res.json({ ok: true, sent: willSend });
  console.log('[/admin/test-sms] Route complete, response sent');

  if (friend.notify_sms !== 0 && friend.phone) {
    sendTestSMS(friend.phone)
      .catch(err => console.error('[test-sms] SMS error:', err.message));
  }
  if (friend.notify_email !== 0 && friend.email) {
    sendTestEmail(friend, name)
      .catch(err => console.error('[test-sms] Email error:', err.message));
  }
}));

// ── POST /admin/skip-day ──────────────────────────────────────────────────────

router.post('/admin/skip-day', requireAuth, withTimeout(async (req, res) => {
  const { date } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  await insertCheckin(date, 'skipped');
  const existing = await getTodayCheckin(date);
  if (existing && existing.status !== 'skipped') {
    await updateCheckin(date, { status: 'skipped' });
  }
  res.json({ ok: true });
  console.log('[/admin/skip-day] Route complete, response sent');
}));

// ── POST /admin/test/open-window ─────────────────────────────────────────────

router.post('/admin/test/open-window', requireAuth, withTimeout(async (req, res) => {
  const dateStr = getCTDateStr();
  await insertCheckin(dateStr, 'pending');
  const row = await getTodayCheckin(dateStr);
  if (row && row.status !== 'pending') {
    await updateCheckin(dateStr, { status: 'pending' });
  }
  res.json({ ok: true, message: `Today (${dateStr}) set to pending — check-in button will show on the main page.` });
  console.log('[/admin/test/open-window] Route complete, response sent');
}));

// ── POST /admin/test/simulate-missed ─────────────────────────────────────────
// Sends shame notifications WITHOUT modifying the database.

router.post('/admin/test/simulate-missed', requireAuth, withTimeout(async (req, res) => {
  const name    = await getSetting('primary_user_name') || 'Jake';
  const friends = await getActiveFriends();

  const smsSent   = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_missed !== 0 && f.notify_sms !== 0 && f.phone).length;
  const emailSent = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_missed !== 0).length;

  res.json({ ok: true, message: `Sending shame notifications to ${smsSent} SMS, ${emailSent} email in background. No data was changed.` });
  console.log('[/admin/test/simulate-missed] Route complete, response sent');

  broadcastShame(friends, name)
    .catch(err => console.error('[simulate-missed] SMS shame error:', err.message));
  getMissStats().then(missStats =>
    broadcastShameEmail(friends, name, missStats)
      .catch(err => console.error('[simulate-missed] Email shame error:', err.message))
  ).catch(err => console.error('[simulate-missed] getMissStats error:', err.message));
}));

// ── POST /admin/test/simulate-success ────────────────────────────────────────
// Sends success notifications using real today's data WITHOUT modifying the database.

router.post('/admin/test/simulate-success', requireAuth, withTimeout(async (req, res) => {
  const dateStr   = getCTDateStr();
  const today     = await getTodayCheckin(dateStr);
  const streak    = await getCurrentStreak();
  const name      = await getSetting('primary_user_name') || 'Jake';
  const friends   = await getActiveFriends();

  // Use real selfie if available, fall back to placeholder
  const selfieUrl = (today && today.selfie_url) || 'https://placehold.co/600x600/8b0000/c8a96e/png?text=TEST+SELFIE';
  const extras    = (today && today.quote_text)
    ? { quote: { text: today.quote_text, speaker: today.quote_speaker } }
    : {};

  const smsSent   = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_success !== 0 && f.notify_sms !== 0 && f.phone).length;
  const emailSent = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_success !== 0).length;

  res.json({ ok: true, message: `Sending success notifications (streak: ${streak}) to ${smsSent} SMS, ${emailSent} email in background. No data was changed.` });
  console.log('[/admin/test/simulate-success] Route complete, response sent');

  broadcastSuccess(friends, name, streak, selfieUrl)
    .catch(err => console.error('[simulate-success] SMS broadcast error:', err.message));
  broadcastSuccessEmail(friends, name, selfieUrl, streak, extras)
    .catch(err => console.error('[simulate-success] Email broadcast error:', err.message));
}));

// ── POST /admin/quest/override ────────────────────────────────────────────────

router.post('/admin/quest/override', requireAuth, withTimeout(async (req, res) => {
  const day = parseInt(req.body.quest_day, 10);
  if (isNaN(day) || day < 0 || day > 60) {
    return res.status(400).json({ error: 'quest_day must be 0–60' });
  }
  const fraction = day % 1 === 0 ? 0 : day % 1;
  await updateQuestState({ quest_day: Math.floor(day), quest_day_fraction: fraction });
  res.json({ ok: true, message: `Quest day set to ${Math.floor(day)}.` });
}));

// ── POST /admin/quest/trigger-fall ────────────────────────────────────────────

router.post('/admin/quest/trigger-fall', requireAuth, withTimeout(async (req, res) => {
  const campaign = await getCurrentCampaign();
  if (!campaign) return res.status(400).json({ error: 'No active campaign.' });
  const qs = await getQuestState();
  await archiveCampaign(campaign.id, 'fallen', {
    questDaysReached: qs ? qs.quest_day : 0,
    bestStreak:       0,
    avgWakeMinutes:   null,
  });
  const newId = await createNewCampaign(campaign.campaign_number + 1);
  res.json({ ok: true, message: `Campaign ${campaign.campaign_number} archived as fallen. New campaign created (id ${newId}).` });
}));

// ── POST /admin/quest/trigger-complete ────────────────────────────────────────

router.post('/admin/quest/trigger-complete', requireAuth, withTimeout(async (req, res) => {
  const campaign = await getCurrentCampaign();
  if (!campaign) return res.status(400).json({ error: 'No active campaign.' });
  const qs = await getQuestState();
  await archiveCampaign(campaign.id, 'completed', {
    questDaysReached: qs ? qs.quest_day : 60,
    bestStreak:       0,
    avgWakeMinutes:   null,
  });
  const newId = await createNewCampaign(campaign.campaign_number + 1);
  res.json({ ok: true, message: `Campaign ${campaign.campaign_number} marked completed. New campaign created (id ${newId}).` });
}));

// ── POST /admin/quest/decisions/clear ────────────────────────────────────────

router.post('/admin/quest/decisions/clear', requireAuth, withTimeout(async (req, res) => {
  try {
    await updateQuestState({ decision_log: {} });
    res.json({ ok: true, success: true, message: 'Decision log cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
}));

// ── POST /admin/test/reset-today ─────────────────────────────────────────────

router.post('/admin/test/reset-today', requireAuth, withTimeout(async (req, res) => {
  const dateStr = getCTDateStr();
  await insertCheckin(dateStr, 'pending');
  await updateCheckin(dateStr, {
    status:            'pending',
    selfie_url:        null,
    checked_in_at:     null,
    streak_at_checkin: null,
    notes:             null,
  });
  res.json({ ok: true, message: `Today (${dateStr}) reset to pending. Ready to test again.` });
  console.log('[/admin/test/reset-today] Route complete, response sent');
}));

// ── POST /admin/test/trigger-digest ──────────────────────────────────────────

router.post('/admin/test/trigger-digest', requireAuth, withTimeout(async (req, res) => {
  const name         = await getSetting('primary_user_name') || 'Jake';
  const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9', 10);
  const dateStr      = getCTDateStr();
  const todayCheckin = await getTodayCheckin(dateStr);
  const digestFriends = await getDigestFriends();

  // DB work done — respond now, fire notifications in background
  res.json({ ok: true, message: `Triggering digest for ${digestFriends.length} digest friend${digestFriends.length === 1 ? '' : 's'} in background.` });
  console.log('[/admin/test/trigger-digest] Route complete, response sent');

  for (const friend of digestFriends) {
    const friendDate = DateTime.now().setZone(friend.timezone || 'America/Chicago').toFormat('yyyy-MM-dd');
    sendDigest(friend, name, todayCheckin, deadlineHour)
      .catch(err => console.error(`[trigger-digest] SMS failed for ${friend.phone || friend.email}:`, err.message));
    sendDigestEmail(friend, name, todayCheckin, deadlineHour)
      .catch(err => console.error(`[trigger-digest] Email failed for ${friend.phone || friend.email}:`, err.message));
    updateFriendDigestSent(friend.id, friendDate)
      .catch(err => console.error(`[trigger-digest] DB update failed for friend ${friend.id}:`, err.message));
  }
}));

// ── POST /admin/test/resend-today ─────────────────────────────────────────────

router.post('/admin/test/resend-today', requireAuth, withTimeout(async (req, res) => {
  const dateStr = getCTDateStr();
  const today   = await getTodayCheckin(dateStr);

  if (!today || today.status !== 'success') {
    return res.json({ ok: false, message: "Today isn't a success check-in — nothing to resend." });
  }

  const name    = await getSetting('primary_user_name') || 'Chip';
  const friends = await getActiveFriends();

  const emailTargets = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_success !== 0).length;
  const smsTargets   = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_success !== 0 && f.notify_sms !== 0 && f.phone).length;

  res.json({ ok: true, message: `Resending today's result to ${emailTargets} email, ${smsTargets} SMS in background.` });
  console.log('[/admin/test/resend-today] Route complete, response sent');

  // Build extras for email: stored quote + wake stats + milestones earned today
  const wakeRows = await getWakeStats();
  const { avg7, avg30, avgAll, personalBest, yesterday, thisWeekAvg, lastWeekAvg } =
    (function computeWakeStats(rows, ds) {
      const withoutToday = rows.filter(r => r.date !== ds);
      return {
        avg7:         rows.slice(0,7).reduce((s,r,_,a) => s + r.checkin_minutes/a.length, 0) || null,
        avg30:        rows.slice(0,30).reduce((s,r,_,a) => s + r.checkin_minutes/a.length, 0) || null,
        avgAll:       rows.reduce((s,r,_,a) => s + r.checkin_minutes/a.length, 0) || null,
        personalBest: rows.length ? rows.reduce((b,r) => r.checkin_minutes < b.checkin_minutes ? r : b) : null,
        yesterday:    withoutToday[0] || null,
        thisWeekAvg:  rows.slice(0,7).reduce((s,r,_,a) => s + r.checkin_minutes/a.length, 0) || null,
        lastWeekAvg:  rows.slice(7,14).reduce((s,r,_,a) => s + r.checkin_minutes/a.length, 0) || null,
      };
    })(wakeRows, dateStr);

  const allMilestones  = await getTimeMilestones();
  const todayMilestoneKeys = allMilestones
    .filter(m => m.achieved_at && m.achieved_at.slice(0, 10) === dateStr)
    .map(m => m.milestone_key);

  const { timeMilestones } = require('../quotes');
  const newMilestones = todayMilestoneKeys
    .map(k => timeMilestones.find(t => t.key === k))
    .filter(Boolean)
    .map(m => ({ badge: m.badge, text: m.text, speaker: m.speaker }));

  const extras = {
    checkinTime:   today.checkin_time,
    wakeStats:     { avg7: Math.round(avg7), avg30: Math.round(avg30), avgAll: Math.round(avgAll), personalBest, yesterday, thisWeekAvg: Math.round(thisWeekAvg), lastWeekAvg: Math.round(lastWeekAvg) },
    newMilestones,
    quote:         today.quote_text ? { text: today.quote_text, speaker: today.quote_speaker } : null,
  };

  broadcastSuccessEmail(friends, name, today.selfie_url, today.streak_at_checkin || 0, extras)
    .catch(err => console.error('[resend-today] Email error:', err.message));

  broadcastSuccess(friends, name, today.streak_at_checkin || 0, today.selfie_url)
    .catch(err => console.error('[resend-today] SMS error:', err.message));
}));

// ── POST /admin/logout ────────────────────────────────────────────────────────

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── HTML helpers ──────────────────────────────────────────────────────────────

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="screen center-screen">
    <div class="join-title">ADMIN LOGIN</div>
    ${error ? `<p class="error-msg">${escapeHtml(error)}</p>` : ''}
    <form method="POST" action="/admin/login">
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autofocus>
      </div>
      <button type="submit" class="checkin-btn">LOGIN</button>
    </form>
  </div>
</body>
</html>`;
}

function statusBadge(status) {
  const map = {
    success: '<span class="badge badge-success">✅ success</span>',
    missed:  '<span class="badge badge-missed">❌ missed</span>',
    skipped: '<span class="badge badge-skipped">⏭ skipped</span>',
    pending: '<span class="badge badge-pending">⏳ pending</span>',
  };
  return map[status] || `<span class="badge">${escapeHtml(status)}</span>`;
}

function adminDashboard({ name, streak, bestStreak, today, history, friends, openHour, deadlineHour, dateStr, wakeGoalTime, chipPhone, chipEmail, questState, questCampaign, allCampaigns, wakeStats, decisionLog = {}, archiveToken = null }) {
  const activeCount = friends.filter(f => f.active).length;

  let historyRows  = '';
  let historyCards = '';
  for (const row of history) {
    const editArgs = `'${escapeHtml(row.date)}','${escapeHtml(row.status)}','${escapeHtml(row.notes || '')}'`;
    historyRows += `
    <tr>
      <td>${escapeHtml(row.date)}</td>
      <td class="small">${escapeHtml(row.checkin_time || '—')}</td>
      <td>${statusBadge(row.status)}</td>
      <td>${row.streak_at_checkin !== null ? row.streak_at_checkin : '—'}</td>
      <td>${row.selfie_url ? `<a href="${escapeHtml(row.selfie_url)}" target="_blank">📸</a>` : '—'}</td>
      <td class="muted small">${escapeHtml(row.notes || '')}</td>
      <td><button class="btn-sm" onclick="editDay(${editArgs})">Edit</button></td>
    </tr>`;
    historyCards += `
    <div class="admin-card-row">
      <div class="card-row-header">
        <span class="card-date">${escapeHtml(row.date)}</span>
        ${statusBadge(row.status)}
      </div>
      <div class="card-row-meta">
        ${row.checkin_time ? `${escapeHtml(row.checkin_time)} &nbsp;·&nbsp; ` : ''}Streak: ${row.streak_at_checkin !== null ? row.streak_at_checkin : '—'}${row.selfie_url ? ` &nbsp;·&nbsp; <a href="${escapeHtml(row.selfie_url)}" target="_blank">📸 Selfie</a>` : ''}${row.notes ? `<br>${escapeHtml(row.notes)}` : ''}
      </div>
      <div class="card-row-actions">
        <button class="btn-sm" onclick="editDay(${editArgs})">Edit</button>
      </div>
    </div>`;
  }

  let friendRows  = '';
  let friendCards = '';
  for (const f of friends) {
    const mode = f.notify_mode || 'realtime';
    const modeLabel = mode === 'digest'
      ? `Digest @ ${escapeHtml(f.digest_time || '?')} ${escapeHtml(f.timezone ? f.timezone.split('/')[1].replace('_', ' ') : 'CT')}`
      : 'Real-time';
    const notifyFor = [];
    if (f.notify_success !== 0) notifyFor.push('✅');
    if (f.notify_missed  !== 0) notifyFor.push('❌');
    const notifyLabel = notifyFor.length ? notifyFor.join(' ') : 'None';

    const emailDisplay = f.email
      ? escapeHtml(f.email.length > 22 ? f.email.slice(0, 22) + '…' : f.email)
      : '—';

    const channels = [];
    if (f.notify_sms   !== 0 && f.phone) channels.push('SMS');
    if (f.notify_email !== 0 && f.email) channels.push('Email');
    const channelLabel = channels.length ? channels.join('+') : 'None';

    const prefsData = [
      `data-id="${f.id}"`,
      `data-mode="${escapeHtml(mode)}"`,
      `data-digest-time="${escapeHtml(f.digest_time || '')}"`,
      `data-timezone="${escapeHtml(f.timezone || 'America/Chicago')}"`,
      `data-notify-success="${f.notify_success !== 0 ? '1' : '0'}"`,
      `data-notify-missed="${f.notify_missed !== 0 ? '1' : '0'}"`,
      `data-notify-sms="${f.notify_sms !== 0 ? '1' : '0'}"`,
      `data-notify-email="${f.notify_email !== 0 ? '1' : '0'}"`,
      `data-email="${escapeHtml(f.email || '')}"`,
    ].join(' ');

    const actionBtns = f.active ? `
          <button class="btn-sm" onclick="testSMS(${f.id})">Test</button>
          <button class="btn-sm" onclick="editPrefs(this)" ${prefsData}>Prefs</button>
          <form method="POST" action="/admin/friends/${f.id}/remove" style="display:inline">
            <button type="submit" class="btn-sm btn-danger" onclick="return confirm('Remove ${escapeHtml(f.name)}?')">Remove</button>
          </form>` : '—';

    const cardActions = f.active ? `
      <div class="card-row-actions">
        <button class="btn-sm" onclick="testSMS(${f.id})">Test Notify</button>
        <button class="btn-sm" onclick="editPrefs(this)" ${prefsData}>Edit Prefs</button>
        <form method="POST" action="/admin/friends/${f.id}/remove" style="display:inline;flex:1">
          <button type="submit" class="btn-sm btn-danger" style="width:100%" onclick="return confirm('Remove ${escapeHtml(f.name)}?')">Remove</button>
        </form>
      </div>` : '';

    friendRows += `
    <tr class="${f.active ? '' : 'inactive-row'}">
      <td>${escapeHtml(f.name)}</td>
      <td class="small">${escapeHtml(f.phone || '—')}</td>
      <td class="small muted" title="${escapeHtml(f.email || '')}">${emailDisplay}</td>
      <td>${f.active ? '<span class="badge badge-success">active</span>' : '<span class="badge badge-missed">removed</span>'}</td>
      <td>${escapeHtml(f.joined_at ? f.joined_at.split('T')[0] : '')}</td>
      <td class="small muted">${channelLabel}</td>
      <td class="small muted">${modeLabel}</td>
      <td class="small muted">${notifyLabel}</td>
      <td>${actionBtns}</td>
    </tr>`;

    const contactLine = [
      f.phone ? `📱 ${escapeHtml(f.phone)}` : '',
      f.email ? `📧 ${escapeHtml(f.email.length > 28 ? f.email.slice(0, 28) + '…' : f.email)}` : '',
    ].filter(Boolean).join(' &nbsp;·&nbsp; ') || '—';

    friendCards += `
    <div class="admin-card-row ${f.active ? '' : 'inactive-row'}">
      <div class="card-row-header">
        <strong>${escapeHtml(f.name)}</strong>
        ${f.active ? '<span class="badge badge-success">active</span>' : '<span class="badge badge-missed">removed</span>'}
      </div>
      <div class="card-row-meta">${contactLine}</div>
      <div class="card-row-meta">${channelLabel} &nbsp;·&nbsp; ${modeLabel} &nbsp;·&nbsp; ${notifyLabel}</div>
      ${cardActions}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Morning Accountability</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="admin-body">
  <div class="admin-container">
    <div class="admin-header">
      <h1>⚔️ Admin Panel</h1>
      <div class="admin-meta">
        Logged in as admin &nbsp;|&nbsp;
        <form method="POST" action="/admin/logout" style="display:inline">
          <button type="submit" class="btn-link">Logout</button>
        </form>
      </div>
    </div>

    <!-- Today's Status -->
    <div class="admin-card">
      <h2>Today — ${escapeHtml(dateStr)}</h2>
      <div class="status-row">
        <div>Status: ${today ? statusBadge(today.status) : '<span class="badge badge-pending">no row yet</span>'}</div>
        <div>Current streak: <strong>${streak}</strong></div>
        ${today && today.selfie_url ? `<div><a href="${escapeHtml(today.selfie_url)}" target="_blank"><img src="${escapeHtml(today.selfie_url)}" class="selfie-thumb-sm" alt="Today's selfie"></a></div>` : ''}
      </div>
    </div>

    <!-- History -->
    <details open>
      <summary class="section-summary">📅 Last 30 Days</summary>
      <div class="admin-card">
        <div class="table-scroll hide-mobile">
          <table class="admin-table">
            <thead><tr><th>Date</th><th>Time</th><th>Status</th><th>Streak</th><th>Selfie</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>${historyRows}</tbody>
          </table>
        </div>
        <div class="show-mobile">${historyCards}</div>
      </div>
    </details>

    <!-- Friends -->
    <details open>
      <summary class="section-summary">👥 Friends (${activeCount} active)</summary>
      <div class="admin-card">
        <p class="muted small">Share <code>/join</code> link to add new friends.</p>
        <div class="table-scroll hide-mobile">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th>Joined</th><th>Via</th><th>Timing</th><th>Notified For</th><th>Actions</th></tr></thead>
            <tbody>${friendRows}</tbody>
          </table>
        </div>
        <div class="show-mobile">${friendCards}</div>
      </div>
    </details>

    <!-- Settings -->
    <details>
      <summary class="section-summary">⚙️ Settings</summary>
      <div class="admin-card">
        <form method="POST" action="/admin/settings">
          <div class="form-row">
            <div class="form-group">
              <label>Primary User Name</label>
              <input type="text" name="primary_user_name" value="${escapeHtml(name)}" required>
            </div>
            <div class="form-group">
              <label>Check-in Opens (CT hour, 24h)</label>
              <input type="number" name="checkin_open_hour" min="0" max="23" value="${escapeHtml(openHour)}" required>
            </div>
            <div class="form-group">
              <label>Deadline Hour (CT, 24h)</label>
              <input type="number" name="checkin_deadline_hour" min="0" max="23" value="${escapeHtml(deadlineHour)}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Wake Goal Time (minutes since midnight)</label>
              <input type="number" name="wake_goal_time" min="0" max="1439" value="${escapeHtml(wakeGoalTime)}" placeholder="420 = 7:00 AM">
              <small class="muted">420 = 7 AM, 450 = 7:30 AM, 480 = 8 AM</small>
            </div>
            <div class="form-group">
              <label>Chip's Phone (weekly summary)</label>
              <input type="text" name="chip_phone" value="${escapeHtml(chipPhone)}" placeholder="+15555551234">
            </div>
            <div class="form-group">
              <label>Chip's Email (weekly summary)</label>
              <input type="email" name="chip_email" value="${escapeHtml(chipEmail)}" placeholder="chip@example.com">
            </div>
          </div>
          <button type="submit" class="btn-primary">Save Settings</button>
        </form>
      </div>
    </details>

    <!-- Override streak -->
    <details>
      <summary class="section-summary">🔧 Manual Overrides</summary>
      <div class="admin-card">
        <h3>Override Streak</h3>
        <div class="form-row">
          <input type="number" id="streak-override" min="0" placeholder="New streak value">
          <button class="btn-primary" onclick="overrideStreak()">Set Streak</button>
        </div>

        <h3 style="margin-top:1.5rem">Best Streak <span class="muted small">(current: ${bestStreak})</span></h3>
        <div class="form-row">
          <input type="number" id="best-streak-override" min="0" placeholder="New best streak value">
          <button class="btn-primary" onclick="overrideBestStreak()">Set Best Streak</button>
        </div>

        <h3 style="margin-top:1.5rem">Pre-mark Skip Day</h3>
        <div class="form-row">
          <input type="date" id="skip-date" value="${escapeHtml(dateStr)}">
          <button class="btn-primary" onclick="skipDay()">Mark as Skipped</button>
        </div>
      </div>
    </details>

    <!-- Testing Tools -->
    <details>
      <summary class="section-summary">⚗️ Testing Tools</summary>
      <div class="admin-card">
        <p class="error-msg" style="margin-bottom:1rem">
          ⚠️ These actions send <strong>real SMS messages</strong> to real friends and modify today's data.
        </p>
        <div class="test-btn-grid">
          <button class="btn-test" onclick="testAction('open-window',    'This will set today to pending so the check-in button appears on the main page.')">Open Check-in Window</button>
          <button class="btn-test" onclick="testAction('simulate-success','This will mark today as SUCCESS and send a real MMS to all active real-time friends.')">Simulate Successful Check-in</button>
          <button class="btn-test" onclick="testAction('simulate-missed', 'This will mark today as MISSED and send a real shame SMS to all active real-time friends.')">Simulate Missed Deadline</button>
          <button class="btn-test" onclick="testAction('reset-today',     'This will reset today back to pending so you can test again. No SMS sent.')">Reset Today</button>
          <button class="btn-test" onclick="testAction('trigger-digest',  'This will immediately send digest messages to all active digest-mode friends, ignoring their scheduled time.')">Trigger Digest Now</button>
          <button class="btn-test" onclick="testAction('resend-today',    'This will resend today\\'s success email and SMS to all active friends. Use to test the email layout.')">Resend Today's Result</button>
        </div>
        <p id="test-result" class="muted small" style="min-height:1.2em"></p>
      </div>
    </details>

    <!-- Quest System -->
    ${(function() {
      if (!questState || !questCampaign) return '<details><summary class="section-summary">⚔️ Quest System</summary><div class="admin-card"><p class="muted">Quest state not initialized. Will auto-create on next deploy.</p></div></details>';

      const qd = questState.quest_day;
      const currentChapter = qd > 0 ? Math.min(Math.ceil(qd / 5), 12) : 0;
      const chapter = currentChapter > 0 ? CAMPAIGN_1.chapters[currentChapter - 1] : null;

      // Story log table — newest first, use new field names
      const logEntries = Array.isArray(questState.story_log) ? [...questState.story_log].reverse() : [];
      const logRows = logEntries.map(e => {
        const tierClass = e.tier === 'missed' ? 'slog-admin-missed' : `slog-admin-${e.tier || 'standard'}`;
        const snippet = (e.daily_text || '').replace(/\s+/g, ' ').slice(0, 120);
        const pullDot  = e.pull_appears ? ' <span style="color:#8b0000" title="Pull appeared">⬤</span>' : '';
        const artDot   = e.artifact_found ? ' <span style="color:#c8a96e" title="Artifact found">◈</span>' : '';
        return `<tr class="${tierClass}">
          <td>${e.date || ''}</td>
          <td>${e.quest_day || 0}</td>
          <td>${e.chapter_title || ''}</td>
          <td>${e.tier || ''}${pullDot}${artDot}</td>
          <td style="font-size:0.78rem;color:#a89060;max-width:280px">${snippet}${snippet.length === 120 ? '…' : ''}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="5" class="muted">No entries yet.</td></tr>';

      // Hall of campaigns
      const hallRows = (allCampaigns || []).map(c => {
        const isActive = !c.archived_at;
        const statusCls = isActive ? '' : c.archive_reason === 'completed' ? 'style="color:#c8a96e"' : 'style="color:#8b0000"';
        const statusLbl = isActive ? '🟢 Active' : c.archive_reason === 'completed' ? '✅ Complete' : '💀 Fallen';
        return `<tr>
          <td>${c.campaign_number}</td>
          <td>${c.title || ''}</td>
          <td>${isActive ? qd : (c.quest_days_reached || '—')}</td>
          <td>${c.best_streak || '—'}</td>
          <td ${statusCls}>${statusLbl}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="5" class="muted">No campaigns.</td></tr>';

      return `
        <details>
          <summary class="section-summary">⚔️ Quest System</summary>
          <div class="admin-card">

            <!-- Current state -->
            <h3 class="admin-section-label">Current State</h3>
            <div class="quest-admin-state">
              <div class="qas-item"><span class="qas-label">Campaign</span><span class="qas-val">${questCampaign.campaign_number} — ${questCampaign.title || ''}</span></div>
              <div class="qas-item"><span class="qas-label">Quest Day</span><span class="qas-val">${qd} / 60</span></div>
              <div class="qas-item"><span class="qas-label">Chapter</span><span class="qas-val">${chapter ? `${chapter.number}: ${chapter.title}` : '—'}</span></div>
              <div class="qas-item"><span class="qas-label">Location</span><span class="qas-val">${chapter ? chapter.location : '—'}</span></div>
              <div class="qas-item"><span class="qas-label">Consec. Misses</span><span class="qas-val">${questState.consecutive_misses} of 2 before fall</span></div>
              <div class="qas-item"><span class="qas-label">Lifetime Days</span><span class="qas-val">${questState.lifetime_quest_days}</span></div>
              <div class="qas-item"><span class="qas-label">Pending Regroup</span><span class="qas-val">${questState.pending_regroup ? '⚠️ Yes' : 'No'}</span></div>
              <div class="qas-item"><span class="qas-label">Last 3 Variants</span><span class="qas-val" style="font-size:0.78rem">${(Array.isArray(questState.last_variant_ids) ? questState.last_variant_ids.slice(-3) : []).join(', ') || '—'}</span></div>
              <div class="qas-item"><span class="qas-label">Artifacts Found</span><span class="qas-val" style="font-size:0.78rem">${(Array.isArray(questState.artifacts_found) ? questState.artifacts_found : []).join(', ') || 'none'}</span></div>
              <div class="qas-item" style="align-items:flex-start"><span class="qas-label">Decisions</span><span class="qas-val" style="font-size:0.78rem">${Object.keys(decisionLog).length === 0 ? 'No decisions recorded' : Object.entries(decisionLog).sort().map(([k, v]) => `Chapter ${k.slice(1)} (${k}): ${escapeHtml(v)}`).join(' · ')}</span></div>
            </div>

            <!-- Override -->
            <h3 class="admin-section-label" style="margin-top:1.2rem">Manual Quest Day Override</h3>
            <form id="quest-override-form" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
              <input type="number" id="quest-day-input" name="quest_day" min="0" max="60" value="${qd}" style="width:80px;padding:0.4rem;background:#1a1a2e;border:1px solid #3a3a5a;color:#f0e8d8;border-radius:4px">
              <button type="submit" class="btn-small">Set Quest Day</button>
            </form>
            <p id="quest-override-result" class="muted small" style="min-height:1.2em;margin-top:0.4rem"></p>

            <!-- Test buttons -->
            <h3 class="admin-section-label" style="margin-top:1.2rem">Quest Testing</h3>
            <div class="test-btn-grid" style="margin-bottom:0.8rem">
              <button class="btn-test" onclick="questAction('trigger-fall',     'Archive current campaign as FALLEN and start a new one.')">Trigger Campaign Fall</button>
              <button class="btn-test" onclick="questAction('trigger-complete', 'Archive current campaign as COMPLETED and start a new one.')">Trigger Campaign Complete</button>
              <button class="btn-test" onclick="questAction('decisions/clear', 'Reset decision log to empty? This cannot be undone.')">Clear Decision Log</button>
              <button class="btn-test btn-danger" onclick="resetCampaign()">Reset Campaign</button>
            </div>
            <p id="quest-test-result" class="muted small" style="min-height:1.2em"></p>
            <p id="reset-campaign-result" class="muted small" style="min-height:1.2em"></p>

            <!-- Story log -->
            <h3 class="admin-section-label" style="margin-top:1.2rem">Story Log <a href="/story" style="font-size:0.78rem;color:#8a6e3e;margin-left:0.5rem">View full chronicle →</a></h3>
            <div class="table-scroll">
              <table class="admin-table" style="font-size:0.8rem">
                <thead><tr><th>Date</th><th>Day</th><th>Chapter</th><th>Tier</th><th>Narrative</th></tr></thead>
                <tbody>${logRows}</tbody>
              </table>
            </div>

            <!-- Hall of campaigns -->
            <h3 class="admin-section-label" style="margin-top:1.2rem">Hall of Campaigns</h3>
            <div class="table-scroll">
              <table class="admin-table" style="font-size:0.8rem">
                <thead><tr><th>#</th><th>Title</th><th>Quest Days</th><th>Best Streak</th><th>Status</th></tr></thead>
                <tbody>${hallRows}</tbody>
              </table>
            </div>

          </div>
        </details>`;
    })()}

    <!-- Password -->
    <details>
      <summary class="section-summary">🔑 Change Password</summary>
      <div class="admin-card">
        <div class="form-row">
          <div class="form-group">
            <label>Current Password</label>
            <input type="password" id="cur-pw">
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="new-pw">
          </div>
          <button class="btn-primary" onclick="changePassword()">Update Password</button>
        </div>
        <p id="pw-msg" class="muted small"></p>
      </div>
    </details>

    <!-- Archive Link -->
    <details>
      <summary class="section-summary">📖 Chronicle Archive</summary>
      <div class="admin-card">
        <p class="muted small" style="margin-bottom:1rem">Share this link with the party at campaign end. Regenerating invalidates the old link.</p>
        <div id="archive-link-block" style="margin-bottom:0.75rem">
          ${archiveToken
            ? `<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
                 <code id="archive-url" style="font-size:0.78rem;background:#1a1a2e;padding:0.3rem 0.6rem;border-radius:4px;color:#c8a96e;word-break:break-all">${escapeHtml(`${process.env.APP_URL || ''}/archive/${archiveToken}`)}</code>
                 <button class="btn-sm btn-test" onclick="copyArchiveLink()">Copy</button>
               </div>`
            : `<p class="muted small">No token yet — generate one below.</p>`
          }
        </div>
        <button class="btn-test" onclick="generateArchiveToken()">
          ${archiveToken ? 'Regenerate Link' : 'Generate Link'}
        </button>
        <p id="archive-token-result" class="muted small" style="min-height:1.2em;margin-top:0.5rem"></p>
      </div>
    </details>
  </div>

  <!-- Edit Day Modal -->
  <div id="edit-modal" class="modal hidden">
    <div class="modal-box">
      <h3>Edit Day</h3>
      <form id="edit-form">
        <input type="hidden" id="edit-date">
        <div class="form-group">
          <label>Status</label>
          <select id="edit-status">
            <option value="pending">pending</option>
            <option value="success">success</option>
            <option value="missed">missed</option>
            <option value="skipped">skipped</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <input type="text" id="edit-notes" placeholder="Optional notes">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-primary" onclick="submitEdit()">Save</button>
          <button type="button" class="btn-link" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Prefs Modal -->
  <div id="prefs-modal" class="modal hidden">
    <div class="modal-box">
      <h3>Edit Notification Prefs</h3>
      <input type="hidden" id="prefs-id">
      <div class="form-group">
        <label>Channels</label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="prefs-notify-sms"> 📱 SMS
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="prefs-notify-email"> 📧 Email
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="prefs-email" placeholder="friend@example.com">
      </div>
      <div class="form-group">
        <label>SMS Timing</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="prefs-mode" value="realtime"> Real-time
          </label>
          <label class="radio-label">
            <input type="radio" name="prefs-mode" value="digest"> Daily digest
          </label>
        </div>
      </div>
      <div id="prefs-digest-options">
        <div class="form-group">
          <label>Digest Time</label>
          <input type="time" id="prefs-digest-time" value="08:00">
        </div>
        <div class="form-group">
          <label>Timezone</label>
          <select id="prefs-timezone">
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Phoenix">Arizona (MT, no DST)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Notify For</label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="prefs-notify-success"> When he checks in ✅
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="prefs-notify-missed"> When he misses ❌
          </label>
        </div>
        <small class="muted" id="prefs-checkbox-error" style="color:#ff6b6b;display:none">At least one must be selected.</small>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-primary" onclick="submitPrefs()">Save</button>
        <button type="button" class="btn-link" onclick="closePrefsModal()">Cancel</button>
      </div>
    </div>
  </div>

  <script src="/admin.js"></script>
  <script>
    // Quest override form
    (function() {
      var form = document.getElementById('quest-override-form');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var val = document.getElementById('quest-day-input').value;
        var el  = document.getElementById('quest-override-result');
        fetch('/admin/quest/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'quest_day=' + encodeURIComponent(val),
        }).then(r => r.json()).then(d => {
          el.textContent = d.ok ? d.message : (d.error || 'Error');
          if (d.ok) setTimeout(() => location.reload(), 800);
        }).catch(() => { el.textContent = 'Network error.'; });
      });
    })();

    // Quest test action buttons
    function questAction(action, confirmMsg) {
      if (!confirm(confirmMsg)) return;
      var el = document.getElementById('quest-test-result');
      fetch('/admin/quest/' + action, { method: 'POST' })
        .then(r => r.json()).then(d => {
          if (el) el.textContent = d.ok ? d.message : (d.error || 'Error');
          if (d.ok) setTimeout(() => location.reload(), 1200);
        }).catch(() => { if (el) el.textContent = 'Network error.'; });
    }

    // Reset Campaign
    function generateArchiveToken() {
      var el = document.getElementById('archive-token-result');
      if (!confirm('Generate a new archive link? The old link will stop working.')) return;
      fetch('/admin/generate-archive-token', { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.ok) {
            var base = window.location.origin;
            var url  = base + '/archive/' + d.token;
            var block = document.getElementById('archive-link-block');
            if (block) block.innerHTML = '<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap"><code id="archive-url" style="font-size:0.78rem;background:#1a1a2e;padding:0.3rem 0.6rem;border-radius:4px;color:#c8a96e;word-break:break-all">' + url + '</code><button class="btn-sm btn-test" onclick="copyArchiveLink()">Copy</button></div>';
            if (el) el.textContent = 'New link generated.';
          } else {
            if (el) el.textContent = 'Error: ' + (d.error || 'unknown');
          }
        }).catch(function() { if (el) el.textContent = 'Network error.'; });
    }
    function copyArchiveLink() {
      var el = document.getElementById('archive-url');
      if (el) navigator.clipboard.writeText(el.textContent).then(function() {
        el.style.color = '#7aab7a';
        setTimeout(function() { el.style.color = ''; }, 1500);
      });
    }
    function resetCampaign() {
      if (!confirm('Reset campaign? This cannot be undone.')) return;
      var el = document.getElementById('reset-campaign-result');
      fetch('/admin/reset-campaign', { method: 'POST' })
        .then(r => r.json()).then(d => {
          if (d.ok) {
            if (el) el.textContent = 'Campaign reset. Quest day set to 0. Discovery log cleared.';
            setTimeout(() => location.reload(), 1200);
          } else {
            if (el) el.textContent = d.error || 'Error resetting campaign.';
          }
        }).catch(() => { if (el) el.textContent = 'Network error.'; });
    }
  </script>
</body>
</html>`;
}

// ── POST /api/admin/verify ────────────────────────────────────────────────────

router.post('/api/admin/verify', withTimeout(async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ ok: false });
    const stored = await getSetting('admin_password');
    res.json({ ok: password === stored });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}));

// ── GET /api/archive/validate/:token ─────────────────────────────────────────

router.get('/api/archive/validate/:token', withTimeout(async (req, res) => {
  try {
    const stored = await getSetting('archive_token');
    res.json({ valid: !!(stored && stored === req.params.token) });
  } catch (err) {
    res.json({ valid: false });
  }
}));

// ── POST /admin/generate-archive-token ───────────────────────────────────────

router.post('/admin/generate-archive-token', requireAuth, withTimeout(async (req, res) => {
  try {
    const crypto = require('crypto');
    const token  = crypto.randomBytes(20).toString('hex');
    await setSetting('archive_token', token);
    res.json({ ok: true, token });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}));

// ── POST /admin/reset-campaign ────────────────────────────────────────────────

router.post('/admin/reset-campaign', requireAuth, withTimeout(async (req, res) => {
  try {
    await resetCampaign();
    res.json({ ok: true });
  } catch (err) {
    console.error('[/admin/reset-campaign]', err);
    res.status(500).json({ error: err.message });
  }
}));

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
