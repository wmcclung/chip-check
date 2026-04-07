const express = require('express');
const router  = express.Router();
const { upsertFriend } = require('../db');

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (ET)'  },
  { value: 'America/Chicago',     label: 'Central (CT)'  },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Phoenix',     label: 'Arizona (MT, no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)'  },
];

// ── Phone normalization ───────────────────────────────────────────────────────

function normalizePhone(raw) {
  // Strip all non-digits
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

// ── GET /join ─────────────────────────────────────────────────────────────────

router.get('/join', (req, res) => {
  const tzOptions = TIMEZONES.map(tz =>
    `<option value="${tz.value}"${tz.value === 'America/Chicago' ? ' selected' : ''}>${tz.label}</option>`
  ).join('\n            ');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Join Morning Accountability</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="screen center-screen join-screen">
    <div class="join-title">JOIN THE FELLOWSHIP</div>
    <p class="muted">Opt in to receive morning accountability updates via SMS.</p>
    <p class="muted small">Your number is only used for notifications.</p>

    <form id="join-form" method="POST" action="/join">
      <div class="form-group">
        <label for="name">First Name</label>
        <input type="text" id="name" name="name" required placeholder="Legolas" autocomplete="given-name">
      </div>
      <div class="form-group">
        <label for="phone-digits">Phone Number</label>
        <div class="phone-row">
          <span class="phone-prefix">+1</span>
          <input type="tel" id="phone-digits" inputmode="numeric" placeholder="(312) 555-0100" autocomplete="tel-national" maxlength="14">
        </div>
        <input type="hidden" id="phone" name="phone">
      </div>

      <!-- Notification Timing -->
      <div class="select-cards-label">NOTIFICATION TIMING</div>
      <div class="select-cards">
        <div class="select-card selected" id="card-realtime" onclick="selectTiming('realtime')">
          <div class="select-card-title">Real-time</div>
          <div class="select-card-sub">Text me the moment it happens</div>
        </div>
        <div class="select-card" id="card-digest" onclick="selectTiming('digest')">
          <div class="select-card-title">Pick a time</div>
          <div class="select-card-sub" id="digest-sub">I'll get a daily status at my chosen time</div>
          <div class="digest-opts hidden" id="digest-opts" onclick="event.stopPropagation()">
            <input type="time" name="digest_time" id="digest_time" value="08:00">
            <select name="timezone" id="timezone">
            ${tzOptions}
            </select>
          </div>
        </div>
      </div>
      <input type="hidden" name="notify_mode" id="notify_mode_input" value="realtime">

      <!-- Notify Me For -->
      <div class="select-cards-label" style="margin-top:1.2rem">NOTIFY ME FOR</div>
      <div class="select-cards">
        <div class="select-card" id="card-success" onclick="selectNotify('success')">
          <div class="select-card-title">✅ Successes only</div>
          <div class="select-card-sub">When he checks in</div>
        </div>
        <div class="select-card" id="card-missed" onclick="selectNotify('missed')">
          <div class="select-card-title">❌ Failures only</div>
          <div class="select-card-sub">When he misses</div>
        </div>
        <div class="select-card selected" id="card-both" onclick="selectNotify('both')">
          <div class="select-card-title">Both</div>
          <div class="select-card-sub">I want the full picture</div>
        </div>
      </div>
      <input type="hidden" name="notify_success" id="notify_success_input" value="1">
      <input type="hidden" name="notify_missed"  id="notify_missed_input"  value="1">

      <button type="submit" class="checkin-btn">OPT IN</button>
    </form>
  </div>
  <script>
    // Phone — format visible input, populate hidden field on submit
    var phoneDigits = document.getElementById('phone-digits');
    var phoneHidden = document.getElementById('phone');

    phoneDigits.addEventListener('input', function() {
      var digits = this.value.replace(/\\D/g, '').slice(0, 10);
      var formatted = '';
      if (digits.length > 6)      formatted = '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6);
      else if (digits.length > 3) formatted = '(' + digits.slice(0,3) + ') ' + digits.slice(3);
      else if (digits.length > 0) formatted = '(' + digits;
      this.value = formatted;
    });

    document.getElementById('join-form').addEventListener('submit', function(e) {
      var digits = phoneDigits.value.replace(/\\D/g, '');
      if (digits.length !== 10) {
        e.preventDefault();
        phoneDigits.setCustomValidity('Enter a 10-digit US phone number.');
        phoneDigits.reportValidity();
        return;
      }
      phoneDigits.setCustomValidity('');
      phoneHidden.value = '+1' + digits;
    });

    function selectTiming(mode) {
      document.getElementById('card-realtime').classList.toggle('selected', mode === 'realtime');
      document.getElementById('card-digest').classList.toggle('selected', mode === 'digest');
      document.getElementById('notify_mode_input').value = mode;
      var digestOpts = document.getElementById('digest-opts');
      var digestSub  = document.getElementById('digest-sub');
      if (mode === 'digest') {
        digestOpts.classList.remove('hidden');
        digestSub.classList.add('hidden');
      } else {
        digestOpts.classList.add('hidden');
        digestSub.classList.remove('hidden');
      }
    }

    function selectNotify(which) {
      document.getElementById('card-success').classList.toggle('selected', which === 'success');
      document.getElementById('card-missed').classList.toggle('selected', which === 'missed');
      document.getElementById('card-both').classList.toggle('selected', which === 'both');
      document.getElementById('notify_success_input').value = (which === 'success' || which === 'both') ? '1' : '0';
      document.getElementById('notify_missed_input').value  = (which === 'missed'  || which === 'both') ? '1' : '0';
    }
  </script>
</body>
</html>`);
});

// ── POST /join ────────────────────────────────────────────────────────────────

router.post('/join', (req, res) => {
  try {
    const { name, phone, notify_mode, digest_time, timezone, notify_success, notify_missed } = req.body;

    if (!name || !phone) {
      return res.status(400).send(errorPage('Name and phone are required.'));
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return res.status(400).send(errorPage('Could not parse phone number. Use format: +13125550100 or 10 digits.'));
    }

    // Validate notify prefs
    const notifySuccess = notify_success === '1' ? 1 : 0;
    const notifyMissed  = notify_missed  === '1' ? 1 : 0;
    if (!notifySuccess && !notifyMissed) {
      return res.status(400).send(errorPage('At least one notification type must be selected.'));
    }

    const mode = notify_mode === 'digest' ? 'digest' : 'realtime';

    // Validate digest_time and timezone if digest mode
    let safeDigestTime = null;
    let safeTimezone   = 'America/Chicago';
    if (mode === 'digest') {
      if (!digest_time || !/^\d{2}:\d{2}$/.test(digest_time)) {
        return res.status(400).send(errorPage('Invalid digest time. Use HH:MM format.'));
      }
      const allowedTz = TIMEZONES.map(t => t.value);
      if (!timezone || !allowedTz.includes(timezone)) {
        return res.status(400).send(errorPage('Invalid timezone selection.'));
      }
      safeDigestTime = digest_time;
      safeTimezone   = timezone;
    }

    const safeName = String(name).trim().slice(0, 50);
    upsertFriend(safeName, normalized, {
      notify_success: notifySuccess,
      notify_missed:  notifyMissed,
      notify_mode:    mode,
      digest_time:    safeDigestTime,
      timezone:       safeTimezone,
    });

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're In!</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="screen center-screen">
    <div class="streak-number">✅</div>
    <div class="streak-label">YOU'RE IN, ${escapeHtml(safeName).toUpperCase()}!</div>
    <p class="muted">You'll receive SMS updates when check-ins happen.</p>
    <p class="muted small">To opt out, contact the admin.</p>
  </div>
</body>
</html>`);
  } catch (err) {
    console.error('[POST /join]', err);
    res.status(500).send(errorPage('Server error. Please try again.'));
  }
});

function errorPage(msg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="screen center-screen">
    <div class="streak-label broken">ERROR</div>
    <p class="muted">${escapeHtml(msg)}</p>
    <a href="/join" class="checkin-btn" style="text-decoration:none;">TRY AGAIN</a>
  </div>
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
