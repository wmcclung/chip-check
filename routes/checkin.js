const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const { uploadBuffer }     = require('../cloudinary');
const { broadcastSuccess } = require('../sms');
const { broadcastSuccessEmail } = require('../email');
const {
  getSetting,
  setSetting,
  getTodayCheckin,
  updateCheckin,
  getCurrentStreak,
  getActiveFriends,
  getWakeStats,
  getMissStats,
  getTimeMilestones,
  hasTimeMilestone,
  insertTimeMilestone,
} = require('../db');
const { getSuccessQuote, getFailureQuote, getMilestone, timeMilestones } = require('../quotes');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const TREND_THRESHOLD_MINUTES = 10;

// ── Time helpers ──────────────────────────────────────────────────────────────

function getCTDate() {
  const now = new Date();
  const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const year  = ct.getFullYear();
  const month = String(ct.getMonth() + 1).padStart(2, '0');
  const day   = String(ct.getDate()).padStart(2, '0');
  return {
    dateStr:   `${year}-${month}-${day}`,
    hour:      ct.getHours(),
    minute:    ct.getMinutes(),
    dayOfWeek: ct.getDay(),
  };
}

function getCTTimeString() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour:     'numeric',
    minute:   '2-digit',
    hour12:   true,
  });
}

function parseCTMinutes() {
  const now = new Date();
  const ct  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return ct.getHours() * 60 + ct.getMinutes();
}

function minutesToTimeStr(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Wake stats computation ────────────────────────────────────────────────────

function avgMinutes(rows) {
  if (!rows.length) return null;
  return Math.round(rows.reduce((s, r) => s + r.checkin_minutes, 0) / rows.length);
}

function computeWakeStats(wakeRows, todayDateStr) {
  // wakeRows is ordered newest first, includes today if checked in
  const withoutToday = wakeRows.filter(r => r.date !== todayDateStr);
  const last7  = wakeRows.slice(0, 7);
  const last30 = wakeRows.slice(0, 30);

  const avg7    = avgMinutes(last7);
  const avg30   = avgMinutes(last30);
  const avgAll  = avgMinutes(wakeRows);

  const personalBest = wakeRows.length
    ? wakeRows.reduce((best, r) => r.checkin_minutes < best.checkin_minutes ? r : best)
    : null;

  // Yesterday: the row immediately before today
  const yesterday = withoutToday[0] || null;

  // This week vs last week (newest 7 days vs 7 before that)
  const thisWeekRows = wakeRows.slice(0, 7);
  const lastWeekRows = wakeRows.slice(7, 14);
  const thisWeekAvg = avgMinutes(thisWeekRows);
  const lastWeekAvg = avgMinutes(lastWeekRows);

  return { avg7, avg30, avgAll, personalBest, yesterday, thisWeekAvg, lastWeekAvg };
}

// ── GET / ─────────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { dateStr, hour } = getCTDate();
    const openHour     = parseInt(await getSetting('checkin_open_hour')     || '4',  10);
    const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9',  10);
    const name         = await getSetting('primary_user_name') || 'Chip';
    const streak       = await getCurrentStreak();
    const checkin      = await getTodayCheckin(dateStr);
    const status       = checkin ? checkin.status : null;

    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    const dateDisplay = now.toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long', month: 'long', day: 'numeric',
    });

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
      screen = 'pending';
    }

    const milestoneData = getMilestone(streak);
    // Use the quote stored at check-in time so it's consistent across page loads and emails
    const successQuote  = (checkin && checkin.quote_text)
      ? { text: checkin.quote_text, speaker: checkin.quote_speaker }
      : getSuccessQuote(streak);
    const failureQuote  = getFailureQuote();
    const selfieUrl     = checkin && checkin.selfie_url ? checkin.selfie_url : null;
    const bestStreak    = parseInt(await getSetting('best_streak') || '0', 10);

    // Wake stats (only needed on success screen but cheap to fetch)
    let wakeStatsData       = null;
    let isPersonalBest      = false;
    let earnedMilestones    = [];
    let todayTimeMilestones = [];
    let missStatsData       = null;

    if (screen === 'success') {
      const wakeRows = await getWakeStats();
      const stats    = computeWakeStats(wakeRows, dateStr);
      wakeStatsData  = stats;

      // Is today a personal best?
      const todayMinutes = checkin && checkin.checkin_minutes;
      if (todayMinutes != null) {
        const prevBestMin = wakeRows
          .filter(r => r.date !== dateStr)
          .reduce((best, r) => Math.min(best, r.checkin_minutes), Infinity);
        isPersonalBest = isFinite(prevBestMin) && todayMinutes < prevBestMin;
      }

      // Which time milestones were earned today?
      earnedMilestones = await getTimeMilestones();
      // achieved_at is UTC ISO — for morning CT check-ins the UTC date always matches the CT date
      todayTimeMilestones = earnedMilestones
        .filter(m => m.achieved_at && m.achieved_at.slice(0, 10) === dateStr)
        .map(m => timeMilestones.find(t => t.key === m.milestone_key))
        .filter(Boolean);
    }

    if (screen === 'missed') {
      missStatsData = await getMissStats();
    }

    res.send(renderCheckinPage({
      screen, name, streak, bestStreak, timeStr, dateDisplay,
      openHour, deadlineHour,
      successQuote, failureQuote, milestoneData,
      selfieUrl,
      checkinTime:          checkin ? checkin.checkin_time    : null,
      checkinMinutes:       checkin ? checkin.checkin_minutes : null,
      wakeStatsData,
      isPersonalBest,
      earnedMilestones,
      todayTimeMilestones,
      missStatsData,
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
    const openHour     = parseInt(await getSetting('checkin_open_hour')     || '4',  10);
    const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9',  10);

    if (hour < openHour || hour >= deadlineHour) {
      return res.status(400).json({ success: false, error: 'Check-in window is not open.' });
    }

    const checkin = await getTodayCheckin(dateStr);
    if (!checkin || !['pending', 'skipped'].includes(checkin.status)) {
      return res.status(400).json({ success: false, error: 'Cannot check in right now.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Selfie is required.' });
    }

    const selfieUrl = await uploadBuffer(req.file.buffer);

    // Capture exact CT time
    const checkinTimeStr = getCTTimeString();
    const checkinMinutes = parseCTMinutes();

    await updateCheckin(dateStr, {
      status:          'success',
      selfie_url:      selfieUrl,
      checked_in_at:   new Date().toISOString(),
      checkin_time:    checkinTimeStr,
      checkin_minutes: checkinMinutes,
    });

    const streak = await getCurrentStreak();
    await updateCheckin(dateStr, { streak_at_checkin: streak });

    const prevBest = parseInt(await getSetting('best_streak') || '0', 10);
    if (streak > prevBest) await setSetting('best_streak', streak);

    // Evaluate time milestones
    const newMilestones = [];
    const wakeRows = await getWakeStats(); // includes today now

    for (const tm of timeMilestones) {
      if (tm.key === 'personal_best') {
        // Beat the previous best (excluding today)
        const prevRows = wakeRows.filter(r => r.date !== dateStr);
        if (prevRows.length > 0) {
          const prevMin = prevRows.reduce((b, r) => Math.min(b, r.checkin_minutes), Infinity);
          if (checkinMinutes < prevMin && !(await hasTimeMilestone('personal_best'))) {
            await insertTimeMilestone('personal_best', checkinMinutes);
            newMilestones.push(tm);
          }
        }
      } else if (tm.key === 'avg_7day_800') {
        const last7 = wakeRows.slice(0, 7);
        if (last7.length >= 7) {
          const avg = avgMinutes(last7);
          if (avg !== null && avg < tm.threshold && !(await hasTimeMilestone('avg_7day_800'))) {
            await insertTimeMilestone('avg_7day_800', avg);
            newMilestones.push(tm);
          }
        }
      } else {
        // Threshold-based single-achievement milestones
        if (checkinMinutes < tm.threshold && !(await hasTimeMilestone(tm.key))) {
          await insertTimeMilestone(tm.key, checkinMinutes);
          newMilestones.push(tm);
        }
      }
    }

    // Pick quote once — store on the row so it's the same everywhere
    const quote = getSuccessQuote(streak);
    await updateCheckin(dateStr, { quote_text: quote.text, quote_speaker: quote.speaker });

    const name    = await getSetting('primary_user_name') || 'Chip';
    const friends = await getActiveFriends();

    // Compute wake stats for email snapshot (wakeRows already fetched above)
    const emailWakeStats = computeWakeStats(wakeRows, dateStr);

    broadcastSuccess(friends, name, streak, selfieUrl).catch(() => {});
    broadcastSuccessEmail(friends, name, selfieUrl, streak, {
      checkinTime:   checkinTimeStr,
      wakeStats:     emailWakeStats,
      newMilestones: newMilestones.map(m => ({ badge: m.badge, text: m.text, speaker: m.speaker })),
      quote,
    }).catch(() => {});

    res.json({
      success:       true,
      streak,
      checkinTime:   checkinTimeStr,
      newMilestones: newMilestones.map(m => ({ key: m.key, badge: m.badge, text: m.text, speaker: m.speaker })),
      quote:         `"${quote.text}" — ${quote.speaker}`,
    });
  } catch (err) {
    console.error('[POST /checkin]', err);
    res.status(500).json({ success: false, error: 'Server error. Check-in failed.' });
  }
});

// ── HTML renderer ─────────────────────────────────────────────────────────────

function renderCheckinPage(data) {
  const {
    screen, name, streak, bestStreak, timeStr, dateDisplay,
    openHour, deadlineHour, successQuote, failureQuote,
    milestoneData, selfieUrl,
    checkinTime, checkinMinutes,
    wakeStatsData, isPersonalBest,
    earnedMilestones,
    todayTimeMilestones = [],
    missStatsData,
  } = data;

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
    const milestoneClass = milestoneData ? `milestone ${milestoneData.cssClass}` : '';
    const isNewRecord    = streak > 0 && streak === bestStreak;
    const celebOverlay   = milestoneData && (milestoneData.bigMoment || milestoneData.bigCelebration)
      ? `<div id="milestone-overlay" data-type="${milestoneData.bigCelebration ? '100' : '30'}" class="milestone-overlay ${milestoneData.cssClass}-overlay">
          ${milestoneData.bigCelebration ? `<div class="moverlay-badge">${escapeHtml(milestoneData.badge)}</div>` : ''}
          <div class="moverlay-quote">"${escapeHtml(milestoneData.text)}"</div>
          <div class="moverlay-cite">— ${escapeHtml(milestoneData.speaker)}</div>
          <div class="moverlay-tap">tap to continue</div>
        </div>`
      : '';

    // Personal best banner
    const pbBanner = isPersonalBest
      ? `<div class="pb-banner" id="pb-banner">🏆 NEW PERSONAL BEST</div>`
      : '';

    // Time milestone unlock overlay (shows for first new milestone earned today)
    let timeMilestoneOverlay = '';
    if (todayTimeMilestones.length > 0) {
      const tm = todayTimeMilestones[0];
      timeMilestoneOverlay = `
        <div id="time-milestone-overlay" class="time-milestone-overlay">
          <div class="tmo-inner">
            <div class="tmo-label">MILESTONE UNLOCKED</div>
            <div class="tmo-badge">${escapeHtml(tm.badge)}</div>
            <div class="tmo-quote">"${escapeHtml(tm.text)}"</div>
            <div class="tmo-cite">— ${escapeHtml(tm.speaker)}</div>
            <div class="tmo-tap">tap to continue</div>
          </div>
        </div>`;
    }

    // Today vs yesterday trend
    let trendHtml = '';
    if (wakeStatsData && checkinMinutes != null && wakeStatsData.yesterday) {
      const diff = wakeStatsData.yesterday.checkin_minutes - checkinMinutes;
      if (diff >= TREND_THRESHOLD_MINUTES) {
        trendHtml = `<div class="trend-line trend-good">⬆️ ${diff} min earlier than yesterday</div>`;
      } else if (diff <= -TREND_THRESHOLD_MINUTES) {
        trendHtml = `<div class="trend-line trend-bad">⬇️ ${Math.abs(diff)} min later than yesterday</div>`;
      }
    }

    // This week vs last week trend
    let weekTrendHtml = '';
    if (wakeStatsData && wakeStatsData.thisWeekAvg != null && wakeStatsData.lastWeekAvg != null) {
      const diff = wakeStatsData.lastWeekAvg - wakeStatsData.thisWeekAvg;
      if (diff >= TREND_THRESHOLD_MINUTES) {
        weekTrendHtml = `<div class="trend-line trend-good">📈 ${diff} min earlier than last week avg</div>`;
      } else if (diff <= -TREND_THRESHOLD_MINUTES) {
        weekTrendHtml = `<div class="trend-line trend-bad">📉 ${Math.abs(diff)} min later than last week avg</div>`;
      }
    }

    // Stats grid
    let statsGrid = '';
    if (wakeStatsData) {
      const { avg7, avg30, avgAll, personalBest } = wakeStatsData;

      // Color each avg relative to its baseline (10-min threshold)
      function statClass(value, baseline) {
        if (value == null || baseline == null) return '';
        const diff = baseline - value; // positive = earlier = better
        if (diff >= TREND_THRESHOLD_MINUTES) return 'stat-value-good';
        if (diff <= -TREND_THRESHOLD_MINUTES) return 'stat-value-bad';
        return '';
      }
      const avg7Class  = statClass(avg7,  avg30);
      const avg30Class = statClass(avg30, avgAll);

      statsGrid = `
        <div class="wake-stats-grid">
          <div class="wake-stat-card">
            <div class="wake-stat-value ${avg7Class}">${avg7  != null ? minutesToTimeStr(avg7)  : '—'}</div>
            <div class="wake-stat-label">7-day avg</div>
          </div>
          <div class="wake-stat-card">
            <div class="wake-stat-value ${avg30Class}">${avg30 != null ? minutesToTimeStr(avg30) : '—'}</div>
            <div class="wake-stat-label">30-day avg</div>
          </div>
          <div class="wake-stat-card">
            <div class="wake-stat-value">${avgAll != null ? minutesToTimeStr(avgAll) : '—'}</div>
            <div class="wake-stat-label">all-time avg</div>
          </div>
          <div class="wake-stat-card">
            <div class="wake-stat-value stat-value-best">${personalBest ? minutesToTimeStr(personalBest.checkin_minutes) : '—'}</div>
            <div class="wake-stat-label">personal best</div>
          </div>
        </div>`;
    }

    bodyContent = `
      ${celebOverlay}
      ${timeMilestoneOverlay}
      ${pbBanner}
      <div class="screen center-screen">
        ${milestoneData ? `<div class="milestone-badge ${milestoneData.cssClass}-badge">${escapeHtml(milestoneData.badge)}</div>` : ''}
        <div class="streak-number ${milestoneClass}">🔥 ${streak}</div>
        <div class="streak-label">DAY ${streak} COMPLETE</div>
        ${checkinTime ? `<div class="checkin-time-display">Today: ${escapeHtml(checkinTime)}</div>` : ''}
        ${trendHtml}
        ${weekTrendHtml}
        <div class="streak-stats">
          <div class="streak-stat">Current Streak: <strong>${streak}</strong> day${streak === 1 ? '' : 's'} 🔥</div>
          <div class="streak-stat">Best Streak: <strong>${bestStreak}</strong> day${bestStreak === 1 ? '' : 's'} 🏆</div>
          ${isNewRecord ? '<div class="new-record">✨ New streak record!</div>' : ''}
        </div>
        ${statsGrid}
        ${selfieUrl ? `<img src="${escapeHtml(selfieUrl)}" class="selfie-thumb" alt="Today's selfie">` : ''}
        <blockquote class="lotr-quote">
          <p>"${escapeHtml(successQuote.text)}"</p>
          <cite>— ${escapeHtml(successQuote.speaker)}</cite>
        </blockquote>
        <a href="/stats" class="stats-link">View your full stats →</a>
        <div class="locked-msg">✅ Checked in today. Come back tomorrow.</div>
      </div>`;

  } else if (screen === 'missed') {
    let missStatsHtml = '';
    if (missStatsData) {
      const { last30Misses, allTimeMisses, missPercent } = missStatsData;
      missStatsHtml = `
        <div class="miss-stats-grid">
          <div class="miss-stat-card">
            <div class="miss-stat-value">${last30Misses}</div>
            <div class="miss-stat-label">misses last 30 days</div>
          </div>
          <div class="miss-stat-card">
            <div class="miss-stat-value">${allTimeMisses}</div>
            <div class="miss-stat-label">all-time misses</div>
          </div>
          <div class="miss-stat-card">
            <div class="miss-stat-value">${missPercent}%</div>
            <div class="miss-stat-label">all-time miss rate</div>
          </div>
        </div>`;
    }
    bodyContent = `
      <div class="screen center-screen">
        <div class="streak-number broken">0</div>
        <div class="streak-label broken">STREAK BROKEN</div>
        <blockquote class="lotr-quote failure">
          <p>"${escapeHtml(failureQuote.text)}"</p>
          <cite>— ${escapeHtml(failureQuote.speaker)}</cite>
        </blockquote>
        ${missStatsHtml}
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
