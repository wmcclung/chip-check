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
} = require('../db');

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

// ── Auth middleware ────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ── Rate limiter for login ─────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 min
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

router.post('/admin/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  const stored = await getSetting('admin_password');
  if (password === stored) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.status(401).send(loginPage('Invalid password.'));
});

// ── GET /admin ────────────────────────────────────────────────────────────────

router.get('/admin', requireAuth, async (req, res) => {
  try {
    const name    = await getSetting('primary_user_name') || 'Jake';
    const streak  = await getCurrentStreak();
    const openHour     = await getSetting('checkin_open_hour')     || '4';
    const deadlineHour = await getSetting('checkin_deadline_hour') || '9';

    // Today's info
    const now = new Date();
    const ctNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const dateStr = [
      ctNow.getFullYear(),
      String(ctNow.getMonth() + 1).padStart(2, '0'),
      String(ctNow.getDate()).padStart(2, '0'),
    ].join('-');

    const today   = await getTodayCheckin(dateStr);
    const history = await getRecentCheckins(30);
    const friends = await getAllFriends();

    const bestStreak = parseInt(await getSetting('best_streak') || '0', 10);

    res.send(adminDashboard({
      name, streak, bestStreak, today, history, friends,
      openHour, deadlineHour, dateStr,
    }));
  } catch (err) {
    console.error('[GET /admin]', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ── POST /admin/day ───────────────────────────────────────────────────────────

router.post('/admin/day', requireAuth, async (req, res) => {
  try {
    const { date, status, notes } = req.body;
    if (!date || !status) return res.status(400).json({ error: 'date and status required' });

    await updateCheckin(date, { status, notes: notes || null });

    // Recompute streak for the most recent resolved row
    const streak = await getCurrentStreak();
    // Update streak_at_checkin for this row if it's resolved
    if (['success', 'missed', 'skipped'].includes(status)) {
      await updateCheckin(date, { streak_at_checkin: status === 'missed' ? 0 : streak });
    }

    res.json({ ok: true, streak });
  } catch (err) {
    console.error('[POST /admin/day]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/streak ────────────────────────────────────────────────────────

router.post('/admin/streak', requireAuth, async (req, res) => {
  try {
    const value = parseInt(req.body.value, 10);
    if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Invalid value' });

    const row = await getLastResolvedCheckin();
    if (!row) return res.status(404).json({ error: 'No resolved checkin found' });

    await updateCheckin(row.date, { streak_at_checkin: value });
    res.json({ ok: true, date: row.date, streak: value });
  } catch (err) {
    console.error('[POST /admin/streak]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/best-streak ───────────────────────────────────────────────────

router.post('/admin/best-streak', requireAuth, async (req, res) => {
  try {
    const value = parseInt(req.body.value, 10);
    if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Invalid value' });
    await setSetting('best_streak', value);
    res.json({ ok: true, bestStreak: value });
  } catch (err) {
    console.error('[POST /admin/best-streak]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/settings ──────────────────────────────────────────────────────

router.post('/admin/settings', requireAuth, async (req, res) => {
  try {
    const { checkin_open_hour, checkin_deadline_hour, primary_user_name } = req.body;
    if (checkin_open_hour)     await setSetting('checkin_open_hour',     checkin_open_hour);
    if (checkin_deadline_hour) await setSetting('checkin_deadline_hour', checkin_deadline_hour);
    if (primary_user_name)     await setSetting('primary_user_name',     String(primary_user_name).trim());
    res.redirect('/admin');
  } catch (err) {
    console.error('[POST /admin/settings]', err);
    res.status(500).send('Server error');
  }
});

// ── POST /admin/password ──────────────────────────────────────────────────────

router.post('/admin/password', requireAuth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[POST /admin/password]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/friends/:id/remove ───────────────────────────────────────────

router.post('/admin/friends/:id/remove', requireAuth, async (req, res) => {
  try {
    await removeFriend(parseInt(req.params.id, 10));
    res.redirect('/admin');
  } catch (err) {
    console.error('[POST /admin/friends/:id/remove]', err);
    res.status(500).send('Server error');
  }
});

// ── POST /admin/friends/:id/prefs ────────────────────────────────────────────

router.post('/admin/friends/:id/prefs', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const friend = await getFriendById(id);
    if (!friend) return res.status(404).json({ error: 'Friend not found' });

    const { notify_mode, digest_time, timezone, notify_success, notify_missed, notify_sms, notify_email, email } = req.body;

    const notifySuccess = notify_success === '1' || notify_success === 1 ? 1 : 0;
    const notifyMissed  = notify_missed  === '1' || notify_missed  === 1 ? 1 : 0;
    if (!notifySuccess && !notifyMissed) {
      return res.status(400).json({ error: 'At least one notification type must be selected.' });
    }

    const notifySMS   = notify_sms   === '1' || notify_sms   === 1 ? 1 : 0;
    const notifyEmail = notify_email === '1' || notify_email === 1 ? 1 : 0;

    const safeEmail = email ? String(email).trim().toLowerCase().slice(0, 200) : null;

    const mode = notify_mode === 'digest' ? 'digest' : 'realtime';
    const allowedTz = TIMEZONES.map(t => t.value);
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
  } catch (err) {
    console.error('[POST /admin/friends/:id/prefs]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/test-sms/:id ──────────────────────────────────────────────────

router.post('/admin/test-sms/:id', requireAuth, async (req, res) => {
  try {
    const friend = await getFriendById(parseInt(req.params.id, 10));
    if (!friend) return res.status(404).json({ error: 'Friend not found' });
    const name = await getSetting('primary_user_name') || 'Chip';
    const sent = [];
    if (friend.notify_sms !== 0 && friend.phone) {
      await sendTestSMS(friend.phone);
      sent.push('SMS');
    }
    if (friend.notify_email !== 0 && friend.email) {
      await sendTestEmail(friend, name);
      sent.push('email');
    }
    res.json({ ok: true, sent });
  } catch (err) {
    console.error('[POST /admin/test-sms/:id]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/skip-day ──────────────────────────────────────────────────────

router.post('/admin/skip-day', requireAuth, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    await insertCheckin(date, 'skipped');
    // If already exists with a different status, update it
    const existing = await getTodayCheckin(date);
    if (existing && existing.status !== 'skipped') {
      await updateCheckin(date, { status: 'skipped' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /admin/skip-day]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/test/open-window ─────────────────────────────────────────────

router.post('/admin/test/open-window', requireAuth, async (req, res) => {
  try {
    const dateStr = getCTDateStr();
    await insertCheckin(dateStr, 'pending');
    const row = await getTodayCheckin(dateStr);
    if (row && row.status !== 'pending') {
      await updateCheckin(dateStr, { status: 'pending' });
    }
    res.json({ ok: true, message: `Today (${dateStr}) set to pending — check-in button will show on the main page.` });
  } catch (err) {
    console.error('[POST /admin/test/open-window]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/test/simulate-missed ─────────────────────────────────────────

router.post('/admin/test/simulate-missed', requireAuth, async (req, res) => {
  try {
    const dateStr = getCTDateStr();
    await insertCheckin(dateStr, 'pending');
    await updateCheckin(dateStr, { status: 'missed', streak_at_checkin: 0, selfie_url: null, checked_in_at: null });

    const name    = await getSetting('primary_user_name') || 'Jake';
    const friends = await getActiveFriends();
    await broadcastShame(friends, name);
    await broadcastShameEmail(friends, name);

    const smsSent   = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_missed !== 0 && f.notify_sms !== 0 && f.phone).length;
    const emailSent = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_missed !== 0).length;
    res.json({ ok: true, message: `Today marked missed. Shame sent: ${smsSent} SMS, ${emailSent} email.` });
  } catch (err) {
    console.error('[POST /admin/test/simulate-missed]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/test/simulate-success ────────────────────────────────────────

router.post('/admin/test/simulate-success', requireAuth, async (req, res) => {
  try {
    const dateStr      = getCTDateStr();
    const testSelfieUrl = 'https://placehold.co/600x600/8b0000/c8a96e/png?text=TEST+SELFIE';

    await insertCheckin(dateStr, 'pending');
    await updateCheckin(dateStr, {
      status:        'success',
      selfie_url:    testSelfieUrl,
      checked_in_at: new Date().toISOString(),
    });

    const streak = await getCurrentStreak();
    await updateCheckin(dateStr, { streak_at_checkin: streak });

    const name    = await getSetting('primary_user_name') || 'Jake';
    const friends = await getActiveFriends();
    await broadcastSuccess(friends, name, streak, testSelfieUrl);
    await broadcastSuccessEmail(friends, name, testSelfieUrl, streak);

    const smsSent   = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_success !== 0 && f.notify_sms !== 0 && f.phone).length;
    const emailSent = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_success !== 0).length;
    res.json({ ok: true, message: `Today marked success (streak: ${streak}). Sent: ${smsSent} SMS, ${emailSent} email.` });
  } catch (err) {
    console.error('[POST /admin/test/simulate-success]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/test/reset-today ─────────────────────────────────────────────

router.post('/admin/test/reset-today', requireAuth, async (req, res) => {
  try {
    const dateStr = getCTDateStr();
    await insertCheckin(dateStr, 'pending');
    await updateCheckin(dateStr, {
      status:           'pending',
      selfie_url:       null,
      checked_in_at:    null,
      streak_at_checkin: null,
      notes:            null,
    });
    res.json({ ok: true, message: `Today (${dateStr}) reset to pending. Ready to test again.` });
  } catch (err) {
    console.error('[POST /admin/test/reset-today]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/test/trigger-digest ──────────────────────────────────────────

router.post('/admin/test/trigger-digest', requireAuth, async (req, res) => {
  try {
    const name         = await getSetting('primary_user_name') || 'Jake';
    const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9', 10);
    const dateStr      = getCTDateStr();
    const todayCheckin = await getTodayCheckin(dateStr);

    const digestFriends = await getDigestFriends();

    let sent = 0;
    for (const friend of digestFriends) {
      try {
        await sendDigest(friend, name, todayCheckin, deadlineHour);
        await sendDigestEmail(friend, name, todayCheckin, deadlineHour);
        const friendDate = DateTime.now().setZone(friend.timezone || 'America/Chicago').toFormat('yyyy-MM-dd');
        await updateFriendDigestSent(friend.id, friendDate);
        sent++;
      } catch (err) {
        console.error(`[TEST DIGEST] Failed for ${friend.phone || friend.email}:`, err.message);
      }
    }

    res.json({ ok: true, message: `Digest triggered for ${sent} of ${digestFriends.length} digest friend${digestFriends.length === 1 ? '' : 's'}.` });
  } catch (err) {
    console.error('[POST /admin/test/trigger-digest]', err);
    res.status(500).json({ error: err.message });
  }
});

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

function adminDashboard({ name, streak, bestStreak, today, history, friends, openHour, deadlineHour, dateStr }) {
  const activeCount = friends.filter(f => f.active).length;

  let historyRows  = '';
  let historyCards = '';
  for (const row of history) {
    const editArgs = `'${escapeHtml(row.date)}','${escapeHtml(row.status)}','${escapeHtml(row.notes || '')}'`;
    historyRows += `
    <tr>
      <td>${escapeHtml(row.date)}</td>
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
        Streak: ${row.streak_at_checkin !== null ? row.streak_at_checkin : '—'}${row.selfie_url ? ` &nbsp;·&nbsp; <a href="${escapeHtml(row.selfie_url)}" target="_blank">📸 Selfie</a>` : ''}${row.notes ? `<br>${escapeHtml(row.notes)}` : ''}
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
            <thead><tr><th>Date</th><th>Status</th><th>Streak</th><th>Selfie</th><th>Notes</th><th>Actions</th></tr></thead>
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
        </div>
        <p id="test-result" class="muted small" style="min-height:1.2em"></p>
      </div>
    </details>

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
</body>
</html>`;
}

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
