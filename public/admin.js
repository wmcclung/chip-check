/* Frontend JS for the admin panel */

function editDay(date, status, notes) {
  document.getElementById('edit-date').value   = date;
  document.getElementById('edit-status').value = status;
  document.getElementById('edit-notes').value  = notes;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

function submitEdit() {
  const date   = document.getElementById('edit-date').value;
  const status = document.getElementById('edit-status').value;
  const notes  = document.getElementById('edit-notes').value;

  fetch('/admin/day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, status, notes }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        closeModal();
        window.location.reload();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    })
    .catch(() => alert('Network error'));
}

function overrideStreak() {
  const value = document.getElementById('streak-override').value;
  if (value === '') return alert('Enter a value');

  fetch('/admin/streak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        alert('Streak set to ' + data.streak);
        window.location.reload();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    })
    .catch(() => alert('Network error'));
}

function overrideBestStreak() {
  const value = document.getElementById('best-streak-override').value;
  if (value === '') return alert('Enter a value');

  fetch('/admin/best-streak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        alert('Best streak set to ' + data.bestStreak);
        window.location.reload();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    })
    .catch(() => alert('Network error'));
}

function skipDay() {
  const date = document.getElementById('skip-date').value;
  if (!date) return alert('Select a date');

  fetch('/admin/skip-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        alert('Day marked as skipped: ' + date);
        window.location.reload();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    })
    .catch(() => alert('Network error'));
}

function testSMS(id) {
  fetch('/admin/test-sms/' + id, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        const channels = (data.sent && data.sent.length) ? data.sent.join(' + ') : 'nothing (no active channels)';
        alert('Test notification sent via: ' + channels);
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    })
    .catch(() => alert('Network error'));
}

function changePassword() {
  const cur = document.getElementById('cur-pw').value;
  const nw  = document.getElementById('new-pw').value;
  const msg = document.getElementById('pw-msg');

  fetch('/admin/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: cur, new_password: nw }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        msg.textContent = 'Password updated!';
        msg.style.color = '#5adb8f';
        document.getElementById('cur-pw').value = '';
        document.getElementById('new-pw').value = '';
      } else {
        msg.textContent = 'Error: ' + (data.error || 'Unknown');
        msg.style.color = '#ff6b6b';
      }
    })
    .catch(() => {
      msg.textContent = 'Network error';
      msg.style.color = '#ff6b6b';
    });
}

// Close modal on backdrop click
document.getElementById('edit-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── Notification Prefs Modal ──────────────────────────────────────────────────

function editPrefs(btn) {
  const id            = btn.dataset.id;
  const mode          = btn.dataset.mode || 'realtime';
  const digestTime    = btn.dataset.digestTime || '08:00';
  const timezone      = btn.dataset.timezone   || 'America/Chicago';
  const notifySuccess = btn.dataset.notifySuccess === '1';
  const notifyMissed  = btn.dataset.notifyMissed  === '1';
  const notifySMS     = btn.dataset.notifySms   === '1';
  const notifyEmail   = btn.dataset.notifyEmail === '1';
  const email         = btn.dataset.email || '';

  document.getElementById('prefs-id').value = id;
  document.getElementById('prefs-notify-sms').checked   = notifySMS;
  document.getElementById('prefs-notify-email').checked = notifyEmail;
  document.getElementById('prefs-email').value          = email;
  document.querySelector(`input[name="prefs-mode"][value="${mode}"]`).checked = true;
  document.getElementById('prefs-digest-time').value = digestTime;
  document.getElementById('prefs-timezone').value    = timezone;
  document.getElementById('prefs-notify-success').checked = notifySuccess;
  document.getElementById('prefs-notify-missed').checked  = notifyMissed;
  document.getElementById('prefs-checkbox-error').style.display = 'none';

  updatePrefsDigestVisibility(mode);
  document.getElementById('prefs-modal').classList.remove('hidden');
}

function updatePrefsDigestVisibility(mode) {
  document.getElementById('prefs-digest-options').style.display =
    mode === 'digest' ? 'block' : 'none';
}

document.querySelectorAll('input[name="prefs-mode"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    updatePrefsDigestVisibility(this.value);
  });
});

function closePrefsModal() {
  document.getElementById('prefs-modal').classList.add('hidden');
}

function submitPrefs() {
  const id            = document.getElementById('prefs-id').value;
  const mode          = document.querySelector('input[name="prefs-mode"]:checked').value;
  const digest_time   = document.getElementById('prefs-digest-time').value;
  const timezone      = document.getElementById('prefs-timezone').value;
  const notifySuccess = document.getElementById('prefs-notify-success').checked ? '1' : '0';
  const notifyMissed  = document.getElementById('prefs-notify-missed').checked  ? '1' : '0';
  const notifySMS     = document.getElementById('prefs-notify-sms').checked   ? '1' : '0';
  const notifyEmail   = document.getElementById('prefs-notify-email').checked ? '1' : '0';
  const email         = document.getElementById('prefs-email').value.trim();

  if (notifySuccess === '0' && notifyMissed === '0') {
    document.getElementById('prefs-checkbox-error').style.display = 'block';
    return;
  }
  document.getElementById('prefs-checkbox-error').style.display = 'none';

  fetch('/admin/friends/' + id + '/prefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notify_mode:    mode,
      digest_time:    digest_time,
      timezone:       timezone,
      notify_success: notifySuccess,
      notify_missed:  notifyMissed,
      notify_sms:     notifySMS,
      notify_email:   notifyEmail,
      email:          email,
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        closePrefsModal();
        window.location.reload();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    })
    .catch(() => alert('Network error'));
}

document.getElementById('prefs-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closePrefsModal();
});

// ── Testing Tools ─────────────────────────────────────────────────────────────

function testAction(action, warning) {
  if (!confirm('⚠️ ' + warning + '\n\nProceed?')) return;

  const resultEl = document.getElementById('test-result');
  resultEl.textContent = 'Working…';
  resultEl.style.color = '';

  fetch('/admin/test/' + action, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        resultEl.textContent = '✅ ' + data.message;
        resultEl.style.color = '#5adb8f';
      } else {
        resultEl.textContent = '❌ Error: ' + (data.error || 'Unknown');
        resultEl.style.color = '#ff6b6b';
      }
    })
    .catch(() => {
      resultEl.textContent = '❌ Network error';
      resultEl.style.color = '#ff6b6b';
    });
}
