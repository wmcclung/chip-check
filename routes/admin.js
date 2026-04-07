const express     = require('express');
const rateLimit   = require('express-rate-limit');
const router      = express.Router();
const { DateTime } = require('luxon');
const { sendTestSMS, broadcastShame, broadcastSuccess, sendDigest } = require('../sms');
const {
  getSetting, setSetting,
  getCurrentStreak,
  getTodayCheckin,
  getRecentCheckins,
  updateCheckin,
  insertCheckin,
  getActiveFriends,
  getAllFriends,
  removeFriend,
  getFriendById,
  updateFriendPrefs,
  db,
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

router.post('/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  const stored = getSetting('admin_password');
  if (password === stored) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.status(401).send(loginPage('Invalid password.'));
});

// ── GET /admin ────────────────────────────────────────────────────────────────

router.get('/admin', requireAuth, (req, res) => {
  try {
    const name    = getSetting('primary_user_name') || 'Jake';
    const streak  = getCurrentStreak();
    const openHour     = getSetting('checkin_open_hour')     || '4';
    const deadlineHour = getSetting('checkin_deadline_hour') || '9';

    // Today's info
    const now = new Date();
    const ctNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const dateStr = [
      ctNow.getFullYear(),
      String(ctNow.getMonth() + 1).padStart(2, '0'),
      String(ctNow.getDate()).padStart(2, '0'),
    ].join('-');

    const today   = getTodayCheckin(dateStr);
    const history = getRecentCheckins(30);
    const friends = getAllFriends();

    const bestStreak = parseInt(getSetting('best_streak') || '0', 10);

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

router.post('/admin/day', requireAuth, (req, res) => {
  try {
    const { date, status, notes } = req.body;
    if (!date || !status) return res.status(400).json({ error: 'date and status required' });

    updateCheckin(date, { status, notes: notes || null });

    // Recompute streak for the most recent resolved row
    const streak = getCurrentStreak();
    // Update streak_at_checkin for this row if it's resolved
    if (['success', 'missed', 'skipped'].includes(status)) {
      updateCheckin(date, { streak_at_checkin: status === 'missed' ? 0 : streak });
    }

    res.json({ ok: true, streak });
  } catch (err) {
    console.error('[POST /admin/day]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/streak ────────────────────────────────────────────────────────

router.post('/admin/streak', requireAuth, (req, res) => {
  try {
    const value = parseInt(req.body.value, 10);
    if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Invalid value' });

    // Update the most recent resolved row's streak_at_checkin
    const row = db.prepare(
      "SELECT date FROM checkins WHERE status IN ('success','missed','skipped') ORDER BY date DESC LIMIT 1"
    ).get();

    if (!row) return res.status(404).json({ error: 'No resolved checkin found' });

    updateCheckin(row.date, { streak_at_checkin: value });
    res.json({ ok: true, date: row.date, streak: value });
  } catch (err) {
    console.error('[POST /admin/streak]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/best-streak ───────────────────────────────────────────────────

router.post('/admin/best-streak', requireAuth, (req, res) => {
  try {
    const value = parseInt(req.body.value, 10);
    if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Invalid value' });
    setSetting('best_streak', value);
    res.json({ ok: true, bestStreak: value });
  } catch (err) {
    console.error('[POST /admin/best-streak]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/settings ──────────────────────────────────────────────────────

router.post('/admin/settings', requireAuth, (req, res) => {
  try {
    const { checkin_open_hour, checkin_deadline_hour, primary_user_name } = req.body;
    if (checkin_open_hour)     setSetting('checkin_open_hour',     checkin_open_hour);
    if (checkin_deadline_hour) setSetting('checkin_deadline_hour', checkin_deadline_hour);
    if (primary_user_name)     setSetting('primary_user_name',     String(primary_user_name).trim());
    res.redirect('/admin');
  } catch (err) {
    console.error('[POST /admin/settings]', err);
    res.status(500).send('Server error');
  }
});

// ── POST /admin/password ──────────────────────────────────────────────────────

router.post('/admin/password', requireAuth, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const stored = getSetting('admin_password');
    if (current_password !== stored) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    if (!new_password || new_password.length < 4) {
      return res.status(400).json({ error: 'New password too short' });
    }
    setSetting('admin_password', new_password);
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /admin/password]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/friends/:id/remove ───────────────────────────────────────────

router.post('/admin/friends/:id/remove', requireAuth, (req, res) => {
  try {
    removeFriend(parseInt(req.params.id, 10));
    res.redirect('/admin');
  } catch (err) {
    console.error('[POST /admin/friends/:id/remove]', err);
    res.status(500).send('Server error');
  }
});

// ── POST /admin/friends/:id/prefs ────────────────────────────────────────────

router.post('/admin/friends/:id/prefs', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const friend = getFriendById(id);
    if (!friend) return res.status(404).json({ error: 'Friend not found' });

    const { notify_mode, digest_time, timezone, notify_success, notify_missed } = req.body;

    const notifySuccess = notify_success === '1' || notify_success === 1 ? 1 : 0;
    const notifyMissed  = notify_missed  === '1' || notify_missed  === 1 ? 1 : 0;
    if (!notifySuccess && !notifyMissed) {
      return res.status(400).json({ error: 'At least one notification type must be selected.' });
    }

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

    updateFriendPrefs(id, {
      notify_success: notifySuccess,
      notify_missed:  notifyMissed,
      notify_mode:    mode,
      digest_time:    safeDigestTime,
      timezone:       safeTimezone,
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
    const friend = getFriendById(parseInt(req.params.id, 10));
    if (!friend) return res.status(404).json({ error: 'Friend not found' });
    await sendTestSMS(friend.phone);
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /admin/test-sms/:id]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/skip-day ──────────────────────────────────────────────────────

router.post('/admin/skip-day', requireAuth, (req, res) => {
  try {
    const { date } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    insertCheckin(date, 'skipped');
    // If already exists with a different status, update it
    const existing = getTodayCheckin(date);
    if (existing && existing.status !== 'skipped') {
      updateCheckin(date, { status: 'skipped' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /admin/skip-day]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /admin/test/open-window ─────────────────────────────────────────────

router.post('/admin/test/open-window', requireAuth, (req, res) => {
  try {
    const dateStr = getCTDateStr();
    insertCheckin(dateStr, 'pending');
    const row = getTodayCheckin(dateStr);
    if (row && row.status !== 'pending') {
      updateCheckin(dateStr, { status: 'pending' });
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
    insertCheckin(dateStr, 'pending');
    updateCheckin(dateStr, { status: 'missed', streak_at_checkin: 0, selfie_url: null, checked_in_at: null });

    const name    = getSetting('primary_user_name') || 'Jake';
    const friends = getActiveFriends();
    await broadcastShame(friends, name);

    const sent = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_missed !== 0).length;
    res.json({ ok: true, message: `Today marked missed. Shame SMS fired to ${sent} real-time friend${sent === 1 ? '' : 's'}.` });
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

    insertCheckin(dateStr, 'pending');
    updateCheckin(dateStr, {
      status:        'success',
      selfie_url:    testSelfieUrl,
      checked_in_at: new Date().toISOString(),
    });

    const streak = getCurrentStreak();
    updateCheckin(dateStr, { streak_at_checkin: streak });

    const name    = getSetting('primary_user_name') || 'Jake';
    const friends = getActiveFriends();
    await broadcastSuccess(friends, name, streak, testSelfieUrl);

    const sent = friends.filter(f => (f.notify_mode || 'realtime') === 'realtime' && f.notify_success !== 0).length;
    res.json({ ok: true, message: `Today marked success (streak: ${streak}). Success MMS fired to ${sent} real-time friend${sent === 1 ? '' : 's'}.` });
  } catch (err) {
    console.error('[POST /admin/test/simulate-success]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /admin/test/reset-today ─────────────────────────────────────────────

router.post('/admin/test/reset-today', requireAuth, (req, res) => {
  try {
    const dateStr = getCTDateStr();
    insertCheckin(dateStr, 'pending');
    updateCheckin(dateStr, {
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
    const name         = getSetting('primary_user_name') || 'Jake';
    const deadlineHour = parseInt(getSetting('checkin_deadline_hour') || '9', 10);
    const dateStr      = getCTDateStr();
    const todayCheckin = getTodayCheckin(dateStr);

    const digestFriends = db.prepare(
      "SELECT * FROM friends WHERE active = 1 AND notify_mode = 'digest'"
    ).all();

    let sent = 0;
    for (const friend of digestFriends) {
      try {
        await sendDigest(friend, name, todayCheckin, deadlineHour);
        const friendDate = DateTime.now().setZone(friend.timezone || 'America/Chicago').toFormat('yyyy-MM-dd');
        db.prepare('UPDATE friends SET last_digest_sent = ? WHERE id = ?').run(friendDate, friend.id);
        sent++;
      } catch (err) {
        console.error(`[TEST DIGEST] Failed for ${friend.phone}:`, err.message);
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

  const historyRows = history.map(row => `
    <tr>
      <td>${escapeHtml(row.date)}</td>
      <td>${statusBadge(row.status)}</td>
      <td>${row.streak_at_checkin !== null ? row.streak_at_checkin : '—'}</td>
      <td>${row.selfie_url ? `<a href="${escapeHtml(row.selfie_url)}" target="_blank">📸</a>` : '—'}</td>
      <td class="muted small">${escapeHtml(row.notes || '')}</td>
      <td>
        <button class="btn-sm" onclick="editDay('${escapeHtml(row.date)}','${escapeHtml(row.status)}','${escapeHtml(row.notes || '')}')">Edit</button>
      </td>
    </tr>`).join('');

  const friendRows = friends.map(f => {
    const mode = f.notify_mode || 'realtime';
    const modeLabel = mode === 'digest'
      ? `Digest @ ${escapeHtml(f.digest_time || '?')} ${escapeHtml(f.timezone ? f.timezone.split('/')[1].replace('_', ' ') : 'CT')}`
      : 'Real-time';
    const notifyFor = [];
    if (f.notify_success !== 0) notifyFor.push('✅ Success');
    if (f.notify_missed  !== 0) notifyFor.push('❌ Missed');
    const notifyLabel = notifyFor.length ? notifyFor.join(', ') : 'None';

    const prefsData = [
      `data-id="${f.id}"`,
      `data-mode="${escapeHtml(mode)}"`,
      `data-digest-time="${escapeHtml(f.digest_time || '')}"`,
      `data-timezone="${escapeHtml(f.timezone || 'America/Chicago')}"`,
      `data-notify-success="${f.notify_success !== 0 ? '1' : '0'}"`,
      `data-notify-missed="${f.notify_missed !== 0 ? '1' : '0'}"`,
    ].join(' ');

    return `
    <tr class="${f.active ? '' : 'inactive-row'}">
      <td>${escapeHtml(f.name)}</td>
      <td>${escapeHtml(f.phone)}</td>
      <td>${f.active ? '<span class="badge badge-success">active</span>' : '<span class="badge badge-missed">removed</span>'}</td>
      <td>${escapeHtml(f.joined_at ? f.joined_at.split('T')[0] : '')}</td>
      <td class="small muted">${modeLabel}</td>
      <td class="small muted">${notifyLabel}</td>
      <td>
        ${f.active ? `
          <button class="btn-sm" onclick="testSMS(${f.id})">Test SMS</button>
          <button class="btn-sm" onclick="editPrefs(this)" ${prefsData}>Edit Prefs</button>
          <form method="POST" action="/admin/friends/${f.id}/remove" style="display:inline">
            <button type="submit" class="btn-sm btn-danger" onclick="return confirm('Remove ${escapeHtml(f.name)}?')">Remove</button>
          </form>` : '—'}
      </td>
    </tr>`;
  }).join('');

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
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Date</th><th>Status</th><th>Streak</th><th>Selfie</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>${historyRows}</tbody>
          </table>
        </div>
      </div>
    </details>

    <!-- Friends -->
    <details open>
      <summary class="section-summary">👥 Friends (${activeCount} active)</summary>
      <div class="admin-card">
        <p class="muted small">Share <code>/join</code> link to add new friends.</p>
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Joined</th><th>Mode</th><th>Notified For</th><th>Actions</th></tr></thead>
            <tbody>${friendRows}</tbody>
          </table>
        </div>
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
        <div style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-bottom:1rem">
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
        <label>Notification Timing</label>
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
