const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const { uploadBuffer }     = require('../cloudinary');
const { broadcastSuccess } = require('../sms');
const {
  getSetting,
  setSetting,
  getTodayCheckin,
  updateCheckin,
  getCurrentStreak,
  getActiveFriends,
} = require('../db');
const { getSuccessQuote, getFailureQuote } = require('../quotes');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Time helpers ──────────────────────────────────────────────────────────────

function getCTDate() {
  // Returns { dateStr: 'YYYY-MM-DD', hour: 0-23, dayOfWeek: 0-6 } in CT
  const now = new Date();
  const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const year  = ct.getFullYear();
  const month = String(ct.getMonth() + 1).padStart(2, '0');
  const day   = String(ct.getDate()).padStart(2, '0');
  return {
    dateStr:   `${year}-${month}-${day}`,
    hour:      ct.getHours(),
    minute:    ct.getMinutes(),
    dayOfWeek: ct.getDay(), // 0 = Sun, 6 = Sat
  };
}

// ── GET / ─────────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  try {
    const { dateStr, hour } = getCTDate();
    const openHour     = parseInt(getSetting('checkin_open_hour')     || '4',  10);
    const deadlineHour = parseInt(getSetting('checkin_deadline_hour') || '9',  10);
    const name         = getSetting('primary_user_name') || 'Jake';
    const streak       = getCurrentStreak();
    const checkin      = getTodayCheckin(dateStr);
    const status       = checkin ? checkin.status : null;

    // Format current CT time for display
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    const dateDisplay = now.toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long', month: 'long', day: 'numeric',
    });

    // Determine screen state
    let screen = 'pending';

    if (hour < openHour) {
      screen = 'too-early';
    } else if (status === 'success') {
      screen = 'success';
    } else if (status === 'missed') {
      screen = 'missed';
    } else if (status === 'skipped') {
      screen = checkin && checkin.checked_in_at ? 'success' : 'skipped';
    } else {
      // pending or no row yet
      screen = 'pending';
    }

    const successQuote = getSuccessQuote(streak);
    const failureQuote = getFailureQuote();
    const isMilestone  = [5, 10, 20, 30, 50, 100].includes(streak);
    const selfieUrl    = checkin && checkin.selfie_url ? checkin.selfie_url : null;
    const bestStreak   = parseInt(getSetting('best_streak') || '0', 10);

    res.send(renderCheckinPage({
      screen, name, streak, bestStreak, timeStr, dateDisplay,
      openHour, deadlineHour,
      successQuote, failureQuote, isMilestone,
      selfieUrl,
    }));
  } catch (err) {
    console.error('[GET /]', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ── POST /checkin ─────────────────────────────────────────────────────────────

router.post('/checkin', upload.single('selfie'), async (req, res) => {
  try {
    const { dateStr, hour } = getCTDate();
    const openHour     = parseInt(getSetting('checkin_open_hour')     || '4',  10);
    const deadlineHour = parseInt(getSetting('checkin_deadline_hour') || '9',  10);

    // Validate time window
    if (hour < openHour || hour >= deadlineHour) {
      return res.status(400).json({ success: false, error: 'Check-in window is not open.' });
    }

    const checkin = getTodayCheckin(dateStr);
    if (!checkin || !['pending', 'skipped'].includes(checkin.status)) {
      return res.status(400).json({ success: false, error: 'Cannot check in right now.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Selfie is required.' });
    }

    // Upload to Cloudinary (throws on failure → returns 500, does NOT mark success)
    const selfieUrl = await uploadBuffer(req.file.buffer);

    // Mark success
    const now = new Date().toISOString();
    updateCheckin(dateStr, {
      status:       'success',
      selfie_url:   selfieUrl,
      checked_in_at: now,
    });

    const streak = getCurrentStreak();
    updateCheckin(dateStr, { streak_at_checkin: streak });

    // Update best streak if this is a new record
    const prevBest = parseInt(getSetting('best_streak') || '0', 10);
    if (streak > prevBest) setSetting('best_streak', streak);

    // Broadcast success MMS (errors logged, not thrown)
    const name    = getSetting('primary_user_name') || 'Jake';
    const friends = getActiveFriends();
    broadcastSuccess(friends, name, streak, selfieUrl).catch(() => {});

    const quote = getSuccessQuote(streak);
    res.json({ success: true, streak, quote: `"${quote.text}" — ${quote.speaker}` });
  } catch (err) {
    console.error('[POST /checkin]', err);
    res.status(500).json({ success: false, error: 'Server error. Check-in failed.' });
  }
});

// ── HTML renderer ─────────────────────────────────────────────────────────────

function renderCheckinPage(data) {
  const { screen, name, streak, bestStreak, timeStr, dateDisplay,
          openHour, deadlineHour, successQuote, failureQuote,
          isMilestone, selfieUrl } = data;

  let bodyContent = '';

  if (screen === 'too-early') {
    bodyContent = `
      <div class="screen center-screen">
        <div class="status-label muted">TOO EARLY</div>
        <div class="big-time">${timeStr}</div>
        <p class="muted">Check-in opens at ${openHour}:00 AM.</p>
        <p class="muted">Come back later.</p>
      </div>`;
  } else if (screen === 'pending') {
    bodyContent = `
      <div class="screen center-screen" id="pending-screen">
        <div class="streak-number">${streak}</div>
        <div class="streak-label">day streak</div>
        <div class="date-display">${dateDisplay}</div>
        <button class="checkin-btn pulse-btn" id="checkin-btn">CHECK IN</button>
        <p class="muted small">Deadline: ${deadlineHour}:00 AM CT</p>
      </div>
      <div class="screen center-screen hidden" id="selfie-screen">
        <div class="selfie-flash-bg">
          <div class="selfie-now-text" id="selfie-flash">SELFIE NOW</div>
          <button class="take-selfie-btn hidden" id="take-selfie-btn">TAKE SELFIE</button>
          <input type="file" id="selfie-input" accept="image/*" capture="user" class="hidden">
        </div>
      </div>
      <div class="screen center-screen hidden" id="uploading-screen">
        <div class="status-label">UPLOADING...</div>
        <div class="spinner"></div>
      </div>`;
  } else if (screen === 'success') {
    const milestoneClass = isMilestone ? 'milestone' : '';
    const isNewRecord    = streak > 0 && streak === bestStreak;
    bodyContent = `
      <div class="screen center-screen">
        ${isMilestone ? '<div class="milestone-badge">🏆</div>' : ''}
        <div class="streak-number ${milestoneClass}">🔥 ${streak}</div>
        <div class="streak-label">DAY ${streak} COMPLETE</div>
        <div class="streak-stats">
          <div class="streak-stat">Current Streak: <strong>${streak}</strong> day${streak === 1 ? '' : 's'} 🔥</div>
          <div class="streak-stat">Best Streak: <strong>${bestStreak}</strong> day${bestStreak === 1 ? '' : 's'} 🏆</div>
          ${isNewRecord ? '<div class="new-record">✨ New record!</div>' : ''}
        </div>
        ${selfieUrl ? `<img src="${escapeHtml(selfieUrl)}" class="selfie-thumb" alt="Today's selfie">` : ''}
        <blockquote class="lotr-quote">
          <p>"${escapeHtml(successQuote.text)}"</p>
          <cite>— ${escapeHtml(successQuote.speaker)}</cite>
        </blockquote>
        <div class="locked-msg">✅ Checked in today. Come back tomorrow.</div>
      </div>`;
  } else if (screen === 'missed') {
    bodyContent = `
      <div class="screen center-screen">
        <div class="streak-number broken">0</div>
        <div class="streak-label broken">STREAK BROKEN</div>
        <blockquote class="lotr-quote failure">
          <p>"${escapeHtml(failureQuote.text)}"</p>
          <cite>— ${escapeHtml(failureQuote.speaker)}</cite>
        </blockquote>
        <div class="locked-msg muted">❌ Missed today. Don't let it happen again.</div>
      </div>`;
  } else if (screen === 'skipped') {
    bodyContent = `
      <div class="screen center-screen" id="pending-screen">
        <div class="streak-number">${streak}</div>
        <div class="streak-label">day streak</div>
        <div class="date-display">${dateDisplay}</div>
        <div class="rest-day-badge">REST DAY</div>
        <p class="muted">No check-in required today.</p>
        <button class="checkin-btn secondary-btn pulse-btn" id="checkin-btn">CHECK IN ANYWAY</button>
      </div>
      <div class="screen center-screen hidden" id="selfie-screen">
        <div class="selfie-flash-bg">
          <div class="selfie-now-text" id="selfie-flash">SELFIE NOW</div>
          <button class="take-selfie-btn hidden" id="take-selfie-btn">TAKE SELFIE</button>
          <input type="file" id="selfie-input" accept="image/*" capture="user" class="hidden">
        </div>
      </div>
      <div class="screen center-screen hidden" id="uploading-screen">
        <div class="status-label">UPLOADING...</div>
        <div class="spinner"></div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${name}'s Morning Check-In</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  ${bodyContent}
  <script src="/checkin.js"></script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
