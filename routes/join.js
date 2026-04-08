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
    <p class="muted">Opt in to receive morning accountability updates.</p>

    <form id="join-form" method="POST" action="/join">

      <!-- Name -->
      <div class="form-group">
        <label for="name">First Name</label>
        <input type="text" id="name" name="name" required placeholder="Legolas" autocomplete="given-name">
      </div>

      <!-- Contact info -->
      <div class="form-group">
        <label for="phone-digits">Phone Number <span class="muted">(optional)</span></label>
        <div class="phone-row">
          <span class="phone-prefix">+1</span>
          <input type="tel" id="phone-digits" inputmode="numeric" placeholder="(312) 555-0100" autocomplete="tel-national" maxlength="14">
        </div>
        <input type="hidden" id="phone" name="phone">
      </div>
      <div class="form-group">
        <label for="email">Email Address <span class="muted">(optional)</span></label>
        <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email">
        <small class="muted">Add at least one — phone, email, or both</small>
      </div>

      <!-- How to notify me -->
      <div class="select-cards-label" style="margin-top:1.2rem">NOTIFY ME VIA — pick one or both</div>
      <p class="channel-hint muted">You can select both if you want redundant notifications</p>
      <div class="select-cards" id="channel-cards">

        <div class="select-card channel-card channel-pulse" id="card-sms" onclick="toggleChannel('sms', event)">
          <span class="card-check" id="sms-check"></span>
          <div class="select-card-title">📱 Text me (SMS)</div>
          <div class="select-card-sub" id="sms-sub-collapsed">As it happens or pick a time</div>
          <div class="channel-sub-opts hidden" id="sms-timing-opts" onclick="event.stopPropagation()">
            <label class="channel-radio">
              <input type="radio" name="sms_timing" value="realtime" checked> Real-time — as it happens
            </label>
            <label class="channel-radio">
              <input type="radio" name="sms_timing" value="digest"> Pick a time
            </label>
            <div class="digest-opts hidden" id="sms-digest-opts" onclick="event.stopPropagation()">
              <input type="time" name="digest_time" id="digest_time" value="08:00">
              <select name="timezone" id="timezone">
              ${tzOptions}
              </select>
            </div>
          </div>
        </div>

        <div class="select-card channel-card channel-pulse" id="card-email" onclick="toggleChannel('email', event)">
          <span class="card-check" id="email-check"></span>
          <div class="select-card-title">📧 Email me</div>
          <div class="select-card-sub">Get notified by email — works great alongside SMS</div>
        </div>

      </div>
      <div class="both-channel-msg hidden" id="both-channel-msg">📬 You'll receive both SMS and email notifications</div>
      <small class="muted" id="channel-error" style="color:#ff6b6b;display:none;max-width:380px;text-align:left">Select at least one notification method.</small>
      <input type="hidden" name="notify_sms"   id="notify_sms_input"   value="0">
      <input type="hidden" name="notify_email"  id="notify_email_input" value="0">
      <input type="hidden" name="notify_mode"   id="notify_mode_input"  value="realtime">

      <!-- Notify me for -->
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
    var phoneDigits  = document.getElementById('phone-digits');
    var phoneHidden  = document.getElementById('phone');
    var emailInput   = document.getElementById('email');
    var channelError = document.getElementById('channel-error');

    // Remove pulse after 2s
    setTimeout(function() {
      document.getElementById('card-sms').classList.remove('channel-pulse');
      document.getElementById('card-email').classList.remove('channel-pulse');
    }, 2100);

    // Phone live-format
    phoneDigits.addEventListener('input', function() {
      var digits = this.value.replace(/\\D/g, '').slice(0, 10);
      var fmt = '';
      if (digits.length > 6)      fmt = '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6);
      else if (digits.length > 3) fmt = '(' + digits.slice(0,3) + ') ' + digits.slice(3);
      else if (digits.length > 0) fmt = '(' + digits;
      this.value = fmt;
    });

    // Multi-select channel cards
    function toggleChannel(channel, e) {
      if (channel === 'sms') {
        var card    = document.getElementById('card-sms');
        var isNowOn = !card.classList.contains('selected');
        card.classList.toggle('selected', isNowOn);
        document.getElementById('notify_sms_input').value = isNowOn ? '1' : '0';
        document.getElementById('sms-timing-opts').classList.toggle('hidden', !isNowOn);
        document.getElementById('sms-sub-collapsed').classList.toggle('hidden', isNowOn);
      } else {
        var card    = document.getElementById('card-email');
        var isNowOn = !card.classList.contains('selected');
        card.classList.toggle('selected', isNowOn);
        document.getElementById('notify_email_input').value = isNowOn ? '1' : '0';
      }
      // Both-selected confirmation
      var smsOn   = document.getElementById('notify_sms_input').value === '1';
      var emailOn = document.getElementById('notify_email_input').value === '1';
      document.getElementById('both-channel-msg').classList.toggle('hidden', !(smsOn && emailOn));
      channelError.style.display = 'none';
    }

    // SMS timing radio
    document.querySelectorAll('input[name="sms_timing"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        document.getElementById('notify_mode_input').value = this.value;
        document.getElementById('sms-digest-opts').classList.toggle('hidden', this.value !== 'digest');
      });
    });

    // NOTIFY ME FOR single-select
    function selectNotify(which) {
      document.getElementById('card-success').classList.toggle('selected', which === 'success');
      document.getElementById('card-missed').classList.toggle('selected', which === 'missed');
      document.getElementById('card-both').classList.toggle('selected', which === 'both');
      document.getElementById('notify_success_input').value = (which === 'success' || which === 'both') ? '1' : '0';
      document.getElementById('notify_missed_input').value  = (which === 'missed'  || which === 'both') ? '1' : '0';
    }

    // Submit validation
    document.getElementById('join-form').addEventListener('submit', function(e) {
      var wantSMS   = document.getElementById('notify_sms_input').value === '1';
      var wantEmail = document.getElementById('notify_email_input').value === '1';

      if (!wantSMS && !wantEmail) {
        e.preventDefault();
        channelError.style.display = 'block';
        return;
      }

      if (wantSMS) {
        var digits = phoneDigits.value.replace(/\\D/g, '');
        if (digits.length !== 10) {
          e.preventDefault();
          phoneDigits.setCustomValidity('Enter a 10-digit US phone number.');
          phoneDigits.reportValidity();
          return;
        }
        phoneDigits.setCustomValidity('');
        phoneHidden.value = '+1' + digits;
      }

      if (wantEmail) {
        var ev = emailInput.value.trim();
        if (!ev || !ev.includes('@')) {
          e.preventDefault();
          emailInput.setCustomValidity('Enter a valid email address.');
          emailInput.reportValidity();
          return;
        }
        emailInput.setCustomValidity('');
      }
    });
  </script>
</body>
</html>`);
});

// ── POST /join ────────────────────────────────────────────────────────────────

router.post('/join', (req, res) => {
  try {
    const {
      name, phone, email,
      notify_mode, digest_time, timezone,
      notify_success, notify_missed,
      notify_sms, notify_email,
    } = req.body;

    if (!name) return res.status(400).send(errorPage('Name is required.'));

    const wantSMS   = notify_sms   === '1';
    const wantEmail = notify_email === '1';

    if (!wantSMS && !wantEmail) {
      return res.status(400).send(errorPage('Select at least one notification method (SMS or email).'));
    }

    // Phone validation (required when SMS opted in)
    let normalizedPhone = null;
    if (wantSMS) {
      if (!phone) return res.status(400).send(errorPage('Phone number is required for SMS notifications.'));
      normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) return res.status(400).send(errorPage('Invalid phone number. Use 10 digits or +1XXXXXXXXXX.'));
    }

    // Email validation (required when email opted in)
    let safeEmail = null;
    if (wantEmail) {
      safeEmail = String(email || '').trim().toLowerCase().slice(0, 200);
      if (!safeEmail || !safeEmail.includes('@') || !safeEmail.includes('.')) {
        return res.status(400).send(errorPage('Invalid email address.'));
      }
    }

    // Notify-for validation
    const notifySuccess = notify_success === '1' ? 1 : 0;
    const notifyMissed  = notify_missed  === '1' ? 1 : 0;
    if (!notifySuccess && !notifyMissed) {
      return res.status(400).send(errorPage('At least one notification type must be selected.'));
    }

    // Digest time + timezone (only relevant for SMS digest mode)
    const mode = notify_mode === 'digest' ? 'digest' : 'realtime';
    let safeDigestTime = null;
    let safeTimezone   = 'America/Chicago';
    if (mode === 'digest' && wantSMS) {
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
    upsertFriend(safeName, normalizedPhone, {
      email:          safeEmail,
      notify_success: notifySuccess,
      notify_missed:  notifyMissed,
      notify_mode:    mode,
      notify_sms:     wantSMS   ? 1 : 0,
      notify_email:   wantEmail ? 1 : 0,
      digest_time:    safeDigestTime,
      timezone:       safeTimezone,
    });

    const channels = [];
    if (wantSMS)   channels.push('SMS');
    if (wantEmail) channels.push('email');

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
    <p class="muted">You'll receive updates via ${channels.join(' and ')} when check-ins happen.</p>
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
