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
  getQuestState,
  getCurrentCampaign,
  updateQuestState,
  insertQuestArtifact,
} = require('../db');
const { getSuccessQuote, getFailureQuote, getMilestone, timeMilestones } = require('../quotes');
const {
  CAMPAIGN_1,
  ARTIFACTS,
  SPECIAL_NARRATIVES,
  getChapter,
  isMilestoneDay,
  getQuestAdvance,
  appendToLog,
  getPerformanceTier,
  getEmberLevel,
  pickVariant,
  renderText,
} = require('../quest');

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
    let questData           = null;

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

      // Quest state for success screen
      const qs       = await getQuestState();
      const campaign = await getCurrentCampaign();
      if (qs && campaign) {
        const qd      = qs.quest_day;
        const chapter = getChapter(Math.max(qd, 1), CAMPAIGN_1);
        const log     = Array.isArray(qs.story_log) ? qs.story_log : [];
        questData = {
          quest_day:           qd,
          lifetime_quest_days: qs.lifetime_quest_days,
          campaign_number:     campaign.campaign_number,
          campaign_title:      campaign.title,
          chapter_number:      chapter ? chapter.number   : null,
          chapter_title:       chapter ? chapter.title    : null,
          location:            chapter ? chapter.location : null,
          ember_level:         log.length > 0 ? (log[log.length - 1].ember_level || 3) : 3,
          progress_pct:        Math.min(100, Math.round((qd / CAMPAIGN_1.total_days) * 100)),
          total_days:          CAMPAIGN_1.total_days,
          last_log_entry:      log.length > 0 ? log[log.length - 1] : null,
          story_log:           log,
          consecutive_misses:  qs.consecutive_misses,
          artifacts_found:     Array.isArray(qs.artifacts_found) ? qs.artifacts_found : [],
        };
      }
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
      questData,
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

    // ── Quest advance ─────────────────────────────────────────────────────────
    let questResult = null;
    try {
      const qs       = await getQuestState();
      const campaign = await getCurrentCampaign();

      if (qs && campaign) {
        const prevFraction  = parseFloat(qs.quest_day_fraction) || 0;
        const advance       = getQuestAdvance(checkinMinutes);
        const rawFraction   = prevFraction + (advance % 1);
        const fullAdvance   = Math.floor(advance) + Math.floor(rawFraction);
        const newFraction   = rawFraction % 1;
        const newQuestDay   = Math.min(qs.quest_day + fullAdvance, CAMPAIGN_1.total_days);
        const newLifetime   = qs.lifetime_quest_days + fullAdvance;

        const chapter = getChapter(Math.max(newQuestDay, 1), CAMPAIGN_1);

        // Performance tier using yesterday's check-in minutes
        const prevRows       = wakeRows.filter(r => r.date !== dateStr);
        const prevMinutes    = prevRows[0] ? prevRows[0].checkin_minutes : checkinMinutes;
        const tier           = getPerformanceTier(checkinMinutes, prevMinutes);
        const emberLevel     = getEmberLevel(checkinMinutes);

        // Variant rotation — avoid last 3 used IDs
        const recentIds      = Array.isArray(qs.last_variant_ids) ? qs.last_variant_ids : [];
        const variantObj     = pickVariant(chapter, tier, recentIds);

        // Build template data
        const now     = new Date();
        const ctDate  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
        const months  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const days    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const templateData = {
          checkinTime: checkinTimeStr,
          month:       months[ctDate.getMonth()],
          dayOfWeek:   days[ctDate.getDay()],
          streak:      streak,
          questDay:    newQuestDay,
        };
        const dailyText  = renderText(variantObj.text, templateData);
        const pullAppears = variantObj.pull_appears || false;

        // Update variant ID rotation
        const newRecentIds = [...recentIds, variantObj.id].slice(-10);

        // Milestone
        const milestone = isMilestoneDay(newQuestDay)
          ? { text: chapter.milestone, chapter_title: chapter.title }
          : null;

        // Personal best check
        const prevBestMinForQuest = prevRows.length > 0
          ? prevRows.reduce((b, r) => Math.min(b, r.checkin_minutes), Infinity)
          : Infinity;
        const isQuestPersonalBest = isFinite(prevBestMinForQuest) && checkinMinutes < prevBestMinForQuest;

        // Special narratives
        const specials = [];
        if (qs.pending_regroup) {
          specials.push(SPECIAL_NARRATIVES.fellowship_regroups);
        }
        if (newQuestDay === 5 && campaign.campaign_number === 1) {
          specials.push(SPECIAL_NARRATIVES.chronicle_begins);
        }
        if (isQuestPersonalBest) {
          specials.push({
            ...SPECIAL_NARRATIVES.personal_best,
            text: renderText(SPECIAL_NARRATIVES.personal_best.text, templateData),
          });
        }
        if (checkinMinutes < 420) {
          specials.push({
            ...SPECIAL_NARRATIVES.before_7am,
            text: renderText(SPECIAL_NARRATIVES.before_7am.text, templateData),
          });
        }

        // Artifact awards
        const artifactsFound  = Array.isArray(qs.artifacts_found) ? [...qs.artifacts_found] : [];
        const artifactsAwarded = [];
        if (chapter.artifact_awarded && !artifactsFound.includes(chapter.artifact_awarded)) {
          artifactsFound.push(chapter.artifact_awarded);
          artifactsAwarded.push(ARTIFACTS[chapter.artifact_awarded]);
          await insertQuestArtifact(chapter.artifact_awarded, campaign.id, newQuestDay);
        }

        const newLog = appendToLog(qs.story_log, {
          date:           dateStr,
          quest_day:      newQuestDay,
          chapter_number: chapter.number,
          chapter_title:  chapter.title,
          location:       chapter.location,
          daily_text:     dailyText,
          milestone_text: milestone ? milestone.text : null,
          specials:       specials,
          pull_appears:   pullAppears,
          artifact_found: artifactsAwarded.length > 0 ? artifactsAwarded[0].id : null,
          ember_level:    emberLevel,
          variant_id:     variantObj.id,
          tier:           tier,
        });

        await updateQuestState({
          quest_day:           newQuestDay,
          quest_day_fraction:  newFraction,
          lifetime_quest_days: newLifetime,
          consecutive_misses:  0,
          pending_regroup:     0,
          last_variant_ids:    newRecentIds,
          artifacts_found:     artifactsFound,
          story_log:           newLog,
          last_updated:        dateStr,
        });

        // Update quest_day on time_milestones earned today
        if (newMilestones.length > 0) {
          for (const tm of newMilestones) {
            await require('../db').pool.query(
              'UPDATE time_milestones SET quest_day = $1 WHERE milestone_key = $2',
              [newQuestDay, tm.key]
            );
          }
        }

        questResult = {
          quest_day:           newQuestDay,
          lifetime_quest_days: newLifetime,
          chapter_number:      chapter.number,
          chapter_title:       chapter.title,
          location:            chapter.location,
          daily_text:          dailyText,
          pull_appears:        pullAppears,
          ember_level:         emberLevel,
          tier:                tier,
          variant_id:          variantObj.id,
          milestone,
          specials,
          artifacts_awarded:   artifactsAwarded,
          campaign_title:      campaign.title,
          progress_pct:        Math.min(100, Math.round((newQuestDay / CAMPAIGN_1.total_days) * 100)),
          total_days:          CAMPAIGN_1.total_days,
        };

        // Handle campaign completion at day 60
        if (newQuestDay >= CAMPAIGN_1.total_days) {
          const { archiveCampaign, createNewCampaign } = require('../db');
          const avgWake = wakeRows.length > 0
            ? Math.round(wakeRows.reduce((s, r) => s + r.checkin_minutes, 0) / wakeRows.length)
            : null;
          await archiveCampaign(campaign.id, 'completed', {
            questDaysReached: newQuestDay,
            bestStreak:       streak,
            avgWakeMinutes:   avgWake,
          });
          await createNewCampaign(campaign.campaign_number + 1);
        }
      }
    } catch (questErr) {
      console.error('[POST /checkin] Quest advance error (non-fatal):', questErr.message);
    }

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
      quest:         questResult,
    }).catch(() => {});

    res.json({
      success:       true,
      streak,
      checkinTime:   checkinTimeStr,
      newMilestones: newMilestones.map(m => ({ key: m.key, badge: m.badge, text: m.text, speaker: m.speaker })),
      quote:         `"${quote.text}" — ${quote.speaker}`,
      quest:         questResult,
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
    questData,
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
        ${buildQuestSection(questData, streak)}
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

// ── Quest helpers ─────────────────────────────────────────────────────────────

function buildFlameSvg(streak, isMissed) {
  if (isMissed) {
    // grey ember
    return `<svg class="flame-svg flame-fallen" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 38c-7 0-11-4.5-11-10 0-4 2-7 4-9-1 3 0 5 2 6-1-5 2-9 5-13 0 5 3 7 4 10 1-2 1-4 0-6 3 3 5 7 5 12 0 5.5-4 10-9 10z" fill="#3a3a3a"/>
    </svg>`;
  }
  let cls, fill, inner;
  if (streak < 5)       { cls = 'flame-flicker'; fill = '#6b5a3a'; inner = null; }
  else if (streak < 10) { cls = 'flame-medium';  fill = '#c8841e'; inner = null; }
  else if (streak < 20) { cls = 'flame-tall';    fill = '#c8a96e'; inner = null; }
  else if (streak < 30) { cls = 'flame-blaze';   fill = '#e8b84b'; inner = null; }
  else                  { cls = 'flame-inferno'; fill = '#f0c060'; inner = '#fff8ee'; }

  return `<svg class="flame-svg ${cls}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 38c-7 0-11-4.5-11-10 0-4 2-7 4-9-1 3 0 5 2 6-1-5 2-9 5-13 0 5 3 7 4 10 1-2 1-4 0-6 3 3 5 7 5 12 0 5.5-4 10-9 10z" fill="${fill}"/>
    ${inner ? `<path d="M16 34c-3.5 0-5.5-2-5.5-5 0-2 1-3.5 2-4.5-.5 1.5 0 2.5 1 3-.5-2.5 1-4.5 2.5-6.5 0 2.5 1.5 3.5 2 5 .5-1 .5-2 0-3 1.5 1.5 2.5 3.5 2.5 6 0 2.8-2 5-4.5 5z" fill="${inner}"/>` : ''}
  </svg>`;
}

function buildRoadProgress(questDay) {
  const currentChapter = questDay > 0 ? Math.min(Math.ceil(questDay / 5), 12) : 0;
  let dots = '';
  for (let i = 1; i <= 12; i++) {
    let cls;
    if (i < currentChapter)      cls = 'qw-complete';
    else if (i === currentChapter) cls = 'qw-active';
    else                          cls = 'qw-future';
    dots += `<span class="qw ${cls}" title="Ch. ${i}"></span>`;
    if (i < 12) dots += `<span class="qw-line ${i < currentChapter ? 'qw-line-done' : ''}"></span>`;
  }
  return `<div class="quest-road-visual">${dots}</div>`;
}

function buildSpecialsHtml(specials) {
  if (!specials || specials.length === 0) return '';
  return specials.map(s => {
    const paragraphs = s.text
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="quest-special-p">${escapeHtml(p.trim())}</p>`)
      .join('');
    const labelMap = {
      chronicle_begins:    '⚔️ The Chronicle Begins',
      fellowship_regroups: '⚔️ The Fellowship Regroups',
      personal_best:       '🏆 Personal Best',
      bonus_early:         '⚡ Before 7 AM',
    };
    return `<div class="quest-special quest-special-${s.type}">
      <div class="quest-special-label">${labelMap[s.type] || '⚔️'}</div>
      ${paragraphs}
    </div>`;
  }).join('');
}

function buildMilestoneHtml(milestone) {
  if (!milestone) return '';
  const paragraphs = milestone.text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p class="quest-milestone-p">${escapeHtml(p.trim())}</p>`)
    .join('');
  return `
    <div class="quest-milestone-card">
      <div class="quest-milestone-label">✦ Milestone Reached ✦</div>
      ${paragraphs}
      <blockquote class="quest-milestone-quote">"${escapeHtml(milestone.quote)}"</blockquote>
    </div>`;
}

// ── Quest section builder ─────────────────────────────────────────────────────

function buildQuestSection(qd, streak) {
  if (!qd) return '';

  const questDay = qd.quest_day;

  // Day 0: no quest content yet
  if (questDay === 0) return '';

  // Days 1–4: teaser with brightening ember
  if (questDay < 5) {
    const daysLeft  = 5 - questDay;
    const brightPct = questDay * 20; // 20% → 80%
    return `
      <div class="quest-teaser">
        <div class="quest-teaser-flame" style="opacity:${brightPct / 100}">${buildFlameSvg(streak || 0, false)}</div>
        <div class="quest-teaser-text">The chronicle stirs...</div>
        <div class="quest-teaser-count">${daysLeft} morning${daysLeft === 1 ? '' : 's'} until the story begins.</div>
      </div>`;
  }

  // Day 5+: full quest section
  const entry = qd.last_log_entry;
  if (!entry) return '';

  const narrativeHtml = entry.text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p class="quest-narrative-p">${escapeHtml(p.trim())}</p>`)
    .join('');

  const specials  = entry.specials  || [];
  const milestone = entry.milestone || null;

  // Build story log modal content
  const logEntries = (qd.story_log || []).slice().reverse(); // newest first
  const logRows = logEntries.map(e => `
    <div class="slog-entry slog-${e.type || 'standard'}">
      <div class="slog-meta">
        <span class="slog-date">${escapeHtml(e.date || '')}</span>
        <span class="slog-qday">Day ${e.quest_day || 0}</span>
        <span class="slog-chapter">${escapeHtml(e.chapter || '')}</span>
      </div>
      <div class="slog-text">${escapeHtml(e.text || '')}</div>
    </div>`).join('');

  return `
    <div class="quest-section">
      <div class="quest-header-row">
        <div class="quest-flame-wrap">${buildFlameSvg(streak || 0, false)}</div>
        <div class="quest-header-info">
          <div class="quest-campaign-title">⚔️ ${escapeHtml(qd.campaign_title || 'The Emberstone Chronicles')}</div>
          <div class="quest-day-label">Quest Day ${questDay}</div>
        </div>
      </div>

      ${buildRoadProgress(questDay)}

      <div class="quest-chapter-row">
        <span class="quest-chapter-num">Ch. ${qd.chapter_number}</span>
        <span class="quest-chapter-title">${escapeHtml(qd.chapter_title || '')}</span>
        <span class="quest-location">📍 ${escapeHtml(qd.location || '')}</span>
      </div>

      <div class="quest-body">
        ${buildSpecialsHtml(specials)}
        <div class="quest-narrative">${narrativeHtml}</div>
        ${buildMilestoneHtml(milestone)}
      </div>

      <button class="quest-log-btn" id="quest-log-btn">Read your journey →</button>
    </div>

    <!-- Story log modal -->
    <div id="quest-log-modal" class="quest-modal hidden">
      <div class="quest-modal-inner">
        <div class="quest-modal-header">
          <span class="quest-modal-title">⚔️ The Chronicle</span>
          <button class="quest-modal-close" id="quest-log-close">✕</button>
        </div>
        <div class="quest-modal-body">
          ${logRows || '<p class="slog-empty">No entries yet.</p>'}
        </div>
      </div>
    </div>`;
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
