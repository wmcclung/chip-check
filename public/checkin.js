/* Frontend JS for the primary check-in flow */

// ── Milestone celebration overlay ─────────────────────────────────────────────
(function () {
  var overlay = document.getElementById('milestone-overlay');
  if (!overlay) return;
  var type     = overlay.dataset.type;
  var duration = type === '100' ? 5000 : 3000;

  function dismissOverlay() {
    overlay.classList.add('milestone-overlay--fade');
    setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 700);
  }

  setTimeout(dismissOverlay, duration);
  overlay.addEventListener('click', dismissOverlay);
})();

(function () {
  const checkinBtn = document.getElementById('checkin-btn');
  if (!checkinBtn) return; // not on a screen with a checkin button

  const pendingScreen   = document.getElementById('pending-screen');
  const selfieScreen    = document.getElementById('selfie-screen');
  const uploadingScreen = document.getElementById('uploading-screen');
  const selfieFlash     = document.getElementById('selfie-flash');
  const takeSelfieBtn   = document.getElementById('take-selfie-btn');
  const selfieInput     = document.getElementById('selfie-input');

  // Flash sequence config
  const FLASH_COLORS    = ['#ff0000', '#0000ff', '#ff4400', '#ff00ff', '#000000', '#8b0000', '#00aa00', '#ff0000', '#0000ff', '#ff6600'];
  const POPUP_WORDS     = ['WAKE UP', 'DO IT', 'NOW!!!', 'NO EXCUSES', 'GET UP', 'MOVE!', '🚨', '⚠️', 'RISE!', "LET'S GO", 'DO IT NOW', '‼️'];
  const FLASH_INTERVAL_MS  = 80;
  const POPUP_INTERVAL_MS  = 220;
  const FLASH_DURATION_MS  = 4000;

  // Step 1: User taps CHECK IN — show selfie screen with flash + shake + popups
  checkinBtn.addEventListener('click', () => {
    pendingScreen.classList.add('hidden');
    selfieScreen.classList.remove('hidden');

    const flashBg   = document.querySelector('.selfie-flash-bg');
    const flashText = selfieFlash;

    if (flashText) flashText.style.animation = 'none';

    let colorIndex = 0;

    // Every 80ms: new color + shake translate + scale jolt
    function applyFlashFrame() {
      if (!flashText) return;
      flashText.style.color = FLASH_COLORS[colorIndex % FLASH_COLORS.length];
      const dx    = (Math.random() - 0.5) * 28;
      const dy    = (Math.random() - 0.5) * 18;
      const scale = 0.88 + Math.random() * 0.38; // 0.88 – 1.26
      flashText.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      colorIndex++;
    }

    applyFlashFrame();
    const flashTimer = setInterval(applyFlashFrame, FLASH_INTERVAL_MS);

    // Every 220ms: spawn a random alarm word at a random position
    function spawnPopup() {
      if (!flashBg) return;
      const word  = POPUP_WORDS[Math.floor(Math.random() * POPUP_WORDS.length)];
      const color = FLASH_COLORS[Math.floor(Math.random() * FLASH_COLORS.length)];
      const size  = (1.2 + Math.random() * 2.8).toFixed(1); // 1.2rem – 4rem
      const el    = document.createElement('div');
      el.className    = 'flash-popup';
      el.textContent  = word;
      el.style.cssText = `
        position:absolute;
        left:${5 + Math.random() * 78}%;
        top:${5 + Math.random() * 78}%;
        font-size:${size}rem;
        font-weight:900;
        font-family:'Arial Black',Impact,sans-serif;
        color:${color};
        letter-spacing:0.05em;
        pointer-events:none;
        transform:translate(-50%,-50%);
        white-space:nowrap;
        z-index:5;
      `;
      flashBg.appendChild(el);
      setTimeout(() => el.remove(), 280 + Math.random() * 180);
    }

    const popupTimer = setInterval(spawnPopup, POPUP_INTERVAL_MS);

    // After 4 seconds: stop everything, settle, reveal button
    setTimeout(() => {
      clearInterval(flashTimer);
      clearInterval(popupTimer);
      if (flashBg) flashBg.querySelectorAll('.flash-popup').forEach(el => el.remove());
      if (flashText) {
        flashText.style.color     = '#000000';
        flashText.style.transform = '';
      }
      if (takeSelfieBtn) takeSelfieBtn.classList.remove('hidden');
    }, FLASH_DURATION_MS);
  });

  // Step 2: Tap TAKE SELFIE — trigger camera input
  if (takeSelfieBtn) {
    takeSelfieBtn.addEventListener('click', () => {
      selfieInput.click();
    });
  }

  // Step 3: File selected — upload immediately
  if (selfieInput) {
    selfieInput.addEventListener('change', () => {
      const file = selfieInput.files[0];
      if (!file) return;
      uploadSelfie(file);
    });
  }

  function uploadSelfie(file) {
    // Show uploading screen
    selfieScreen.classList.add('hidden');
    uploadingScreen.classList.remove('hidden');

    const formData = new FormData();
    formData.append('selfie', file);

    fetch('/checkin', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Reload to show success screen
          window.location.reload();
        } else {
          showError(data.error || 'Check-in failed. Please try again.');
        }
      })
      .catch(() => {
        showError('Network error. Please try again.');
      });
  }

  function showError(msg) {
    uploadingScreen.classList.add('hidden');
    pendingScreen.classList.remove('hidden');

    let errEl = document.getElementById('checkin-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'checkin-error';
      errEl.className = 'error-msg';
      pendingScreen.appendChild(errEl);
    }
    errEl.textContent = msg;
  }
})();
