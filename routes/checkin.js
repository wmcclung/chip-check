const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const { uploadBuffer }     = require('../cloudinary');
const { broadcastSuccess } = require('../sms');
const { broadcastSuccessEmail } = require('../email');
const { fetchRivianStock } = require('../rivianService');
const { RIVIAN_DAYS, getNextRivianEntry, populateRivianEntry } = require('../rivianEntries');
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
  getDecisionLog,
  saveDecision,
  getRivianEntryIndex,
  setRivianEntryIndex,
} = require('../db');
const { getSuccessQuote, getFailureQuote, getMilestone, timeMilestones } = require('../quotes');
const {
  CAMPAIGN_1,
  ARTIFACTS,
  DECISION_ECHOES,
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
    let rivianText          = null;

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

      // Rivian text (stored at check-in time)
      rivianText = checkin ? (checkin.rivian_text || null) : null;

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

    // Decision gate: override 'pending' screen when a chapter decision is waiting
    let pendingDecisionData = null;
    if (screen === 'pending') {
      try {
        const qs = await getQuestState();
        if (qs && qs.quest_day >= 5) {
          const qd      = qs.quest_day;
          const chapter = getChapter(Math.max(qd, 1), CAMPAIGN_1); // current chapter (narrative + display)
          const decisionLog = await getDecisionLog();

          // On catch-up days (qd % 5 === 1, qd >= 6) the pending decision belongs to
          // the PREVIOUS chapter — the one whose milestone day was yesterday.
          // On milestone days (qd % 5 === 0) it belongs to the current chapter.
          let decisionChapter    = chapter;
          let decisionChapterKey = `c${chapter.number}`;
          if (qd % 5 === 1 && qd >= 6) {
            const prevChapterNum = Math.floor(qd / 5); // qd=6→1, qd=11→2, qd=16→3 …
            const prevCh = CAMPAIGN_1.chapters.find(c => c.number === prevChapterNum);
            if (prevCh && prevCh.decision) {
              decisionChapter    = prevCh;
              decisionChapterKey = `c${prevChapterNum}`;
            }
          }

          if (decisionChapter && decisionChapter.decision) {
            const isMilestone = isMilestoneDay(qd);
            const isCatchUp   = qd % 5 === 1 && qd >= 6;
            const pending = (isMilestone || isCatchUp) && !decisionLog[decisionChapterKey];

            if (pending) {
              screen = 'decision';

              // Narrative variant comes from the CURRENT chapter (where Chip is today).
              // Use open hour as proxy for today's time (not checked in yet).
              const decWakeRows  = await getWakeStats();
              const prevMinutes  = decWakeRows[0] ? decWakeRows[0].checkin_minutes : null;
              const decTier      = prevMinutes != null
                ? getPerformanceTier(openHour * 60, prevMinutes)
                : 'standard';
              const decRecentIds = Array.isArray(qs.last_variant_ids) ? qs.last_variant_ids : [];
              const decVariant   = pickVariant(chapter, decTier, decRecentIds);

              const decNow    = new Date();
              const decCtDate = new Date(decNow.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
              const decMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
              const decDays   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              const decTplData = {
                checkinTime:   '',
                month:         decMonths[decCtDate.getMonth()],
                dayOfWeek:     decDays[decCtDate.getDay()],
                streak,
                questDay:      qd,
                decisionEcho1: '',
                decisionEcho2: '',
                decisionEcho3: '',
              };

              const decDailyText = renderText(decVariant.text, decTplData);
              // Milestone text only on actual milestone days, from the current chapter.
              // Catch-up days never show it — the milestone rendered on the prior day's screen.
              const decMilestoneText = isMilestone
                ? renderText(chapter.milestone, decTplData)
                : null;

              const decCampaign = await getCurrentCampaign();

              pendingDecisionData = {
                chapterKey:     decisionChapterKey,
                chapterNumber:  chapter.number,         // current chapter for header display
                chapterTitle:   chapter.title,
                location:       chapter.location,
                questDay:       qd,
                isMilestone,
                milestoneText:  decMilestoneText,
                dailyText:      decDailyText,
                decisionPrompt: decisionChapter.decision.prompt,  // from the chapter whose decision is pending
                choices:        decisionChapter.decision.choices,
                campaignTitle:  decCampaign ? decCampaign.title : 'The Emberstone Chronicles',
              };
            }
          }
        }
      } catch (_) { /* don't crash check-in on decision errors */ }
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
      pendingDecisionData,
      rivianText,
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
        const recentIds = Array.isArray(qs.last_variant_ids) ? qs.last_variant_ids : [];

        // Build template data
        const now     = new Date();
        const ctDate  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
        const months  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const days    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const templateData = {
          checkinTime:    checkinTimeStr,
          month:          months[ctDate.getMonth()],
          dayOfWeek:      days[ctDate.getDay()],
          streak:         streak,
          questDay:       newQuestDay,
          decisionEcho1:  '',
          decisionEcho2:  '',
          decisionEcho3:  '',
        };

        // Fetch decision log once — used for echo resolution and email reporting
        let decisionLog = {};
        try { decisionLog = await getDecisionLog(); } catch (_) {}

        // Resolve decision echoes at day 60
        if (newQuestDay === 60) {
          templateData.decisionEcho1 = decisionLog.c9  ? (DECISION_ECHOES.c9[decisionLog.c9]   || '') : '';
          templateData.decisionEcho2 = decisionLog.c10 ? (DECISION_ECHOES.c10[decisionLog.c10] || '') : '';
          templateData.decisionEcho3 = decisionLog.c12 ? (DECISION_ECHOES.c12[decisionLog.c12] || '') : '';
        }

        // Scheduled entries — check every day covered by this advance so a 2-day
        // jump never silently skips an entry pinned to the intermediate day.
        const oldQuestDay  = qs.quest_day;
        const daysToCheck  = fullAdvance === 2
          ? [oldQuestDay + 1, oldQuestDay + 2]
          : [oldQuestDay + 1];

        const scheduledEntries = [];
        for (const day of daysToCheck) {
          const dayChapter = getChapter(Math.max(day, 1), CAMPAIGN_1);
          if (dayChapter && dayChapter.scheduled) {
            const entry = dayChapter.scheduled.find(s => s.quest_day === day);
            if (entry) scheduledEntries.push(entry);
          }
        }

        let dailyText, pullAppears, variantId, newRecentIds;
        if (scheduledEntries.length > 0) {
          // Concatenate all found entries in chronological order.
          dailyText   = scheduledEntries
            .map(e => renderText(e.text, templateData))
            .join('\n\n');
          pullAppears  = scheduledEntries.some(e => e.pull_appears);
          variantId    = scheduledEntries[scheduledEntries.length - 1].id;
          newRecentIds = [...recentIds, ...scheduledEntries.map(e => e.id)].slice(-10);
        } else {
          const variantObj = pickVariant(chapter, tier, recentIds);
          dailyText        = renderText(variantObj.text, templateData);
          pullAppears      = variantObj.pull_appears || false;
          variantId        = variantObj.id;
          newRecentIds     = [...recentIds, variantObj.id].slice(-10);
        }

        // Milestone — run through renderText so {{decision_echo_*}} slots resolve
        const milestone = isMilestoneDay(newQuestDay)
          ? { text: renderText(chapter.milestone, templateData), chapter_title: chapter.title }
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
          variant_id:     variantId,
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

        // Compute decision_made for email.
        // Primary case: any milestone day where the chapter decision was already recorded.
        // Special case: quest day 5 (chronicle_begins email) — surface the C1 decision
        //   consequence there if the decision was made before this check-in.
        let decisionMadeData = null;
        if (isMilestoneDay(newQuestDay) && chapter.decision) {
          const madeChoiceId = decisionLog[`c${chapter.number}`];
          if (madeChoiceId) {
            const choice = chapter.decision.choices.find(c => c.id === madeChoiceId);
            if (choice) {
              decisionMadeData = {
                prompt:       chapter.decision.prompt,
                choice_label: choice.label,
                consequence:  choice.consequence,
              };
            }
          }
        }
        if (!decisionMadeData && newQuestDay === 5) {
          const c1Chapter    = CAMPAIGN_1.chapters.find(c => c.number === 1);
          const c1ChoiceId   = decisionLog['c1'];
          if (c1Chapter && c1ChoiceId) {
            const choice = c1Chapter.decision.choices.find(c => c.id === c1ChoiceId);
            if (choice) {
              decisionMadeData = {
                prompt:       c1Chapter.decision.prompt,
                choice_label: choice.label,
                consequence:  choice.consequence,
              };
            }
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
          variant_id:          variantId,
          milestone,
          specials,
          artifacts_awarded:   artifactsAwarded,
          campaign_title:      campaign.title,
          progress_pct:        Math.min(100, Math.round((newQuestDay / CAMPAIGN_1.total_days) * 100)),
          total_days:          CAMPAIGN_1.total_days,
          decision_made:       decisionMadeData,
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

    // ── Rivian block ──────────────────────────────────────────────────────────
    let rivianText = null;
    if (questResult && RIVIAN_DAYS.includes(questResult.quest_day)) {
      try {
        const entryIndex   = await getRivianEntryIndex();
        const { entry, newIndex } = getNextRivianEntry(entryIndex);
        await setRivianEntryIndex(newIndex);   // advance regardless of stock success

        const stock = await fetchRivianStock();
        if (stock) {
          rivianText = populateRivianEntry(entry, {
            price:     stock.price,
            changePct: stock.changePct,
            questDay:  questResult.quest_day,
          });
          await updateCheckin(dateStr, { rivian_text: rivianText });
        }
      } catch (rivianErr) {
        console.error('[POST /checkin] Rivian block error (non-fatal):', rivianErr.message);
      }
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
      rivian:        rivianText,
    }).catch(() => {});

    res.json({
      success:       true,
      streak,
      checkinTime:   checkinTimeStr,
      newMilestones: newMilestones.map(m => ({ key: m.key, badge: m.badge, text: m.text, speaker: m.speaker })),
      quote:         `"${quote.text}" — ${quote.speaker}`,
      quest:         questResult,
      rivian:        rivianText,
    });
  } catch (err) {
    console.error('[POST /checkin]', err);
    res.status(500).json({ success: false, error: 'Server error. Check-in failed.' });
  }
});

// ── POST /decision ────────────────────────────────────────────────────────────

router.post('/decision', async (req, res) => {
  try {
    const { chapter_key, choice_id } = req.body;

    if (!chapter_key || !/^c(1[0-2]|[1-9])$/.test(chapter_key)) {
      return res.status(400).json({ success: false, error: 'Invalid chapter_key.' });
    }
    if (!choice_id || !String(choice_id).startsWith(chapter_key + '_')) {
      return res.status(400).json({ success: false, error: 'Invalid choice_id.' });
    }

    await saveDecision(String(chapter_key), String(choice_id));
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /decision]', err);
    res.status(500).json({ success: false, error: 'Server error.' });
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
    pendingDecisionData = null,
    rivianText          = null,
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
        ${buildFellowshipBlock(rivianText)}
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

  } else if (screen === 'decision' && pendingDecisionData) {
    const {
      chapterKey, chapterNumber, chapterTitle, location,
      questDay, isMilestone, milestoneText, dailyText,
      decisionPrompt, choices, campaignTitle,
    } = pendingDecisionData;

    const decNarrativeHtml = cleanText(dailyText || '')
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="quest-narrative-p">${escapeHtml(p.trim())}</p>`)
      .join('');

    const decMilestoneHtml = buildMilestoneHtml(milestoneText);

    const choiceCards = choices.map(c => `
      <button class="decision-card" data-choice="${escapeHtml(c.id)}" onclick="selectDecision(this)">
        <span class="decision-card-label">${escapeHtml(c.label)}</span>
      </button>`).join('');

    bodyContent = `
      <div class="decision-page" id="decision-screen" data-chapter-key="${escapeHtml(chapterKey)}">
        <div class="quest-section">
          <div class="quest-header-row">
            <div class="quest-flame-wrap">${buildFlameSvg(streak || 0, false)}</div>
            <div class="quest-header-info">
              <div class="quest-campaign-title">⚔️ ${escapeHtml(campaignTitle || 'The Emberstone Chronicles')}</div>
              <div class="quest-day-label">Quest Day ${questDay}</div>
            </div>
          </div>

          ${buildRoadProgress(questDay)}

          <div class="quest-chapter-row">
            <span class="quest-chapter-num">Ch. ${chapterNumber}</span>
            <span class="quest-chapter-title">${escapeHtml(chapterTitle || '')}</span>
            <span class="quest-location">📍 ${escapeHtml(location || '')}</span>
          </div>

          <div class="quest-body">
            ${decMilestoneHtml}
            <div class="quest-narrative">${decNarrativeHtml}</div>

            <hr class="decision-separator">

            <p class="decision-prompt">${escapeHtml(decisionPrompt)}</p>

            <div class="decision-choices">
              ${choiceCards}
            </div>

            <button class="decision-confirm-btn" id="decision-confirm-btn" disabled>CONFIRM CHOICE</button>
          </div>
        </div>
      </div>
      <script>
      (function() {
        var selectedChoice = null;
        var chKey = document.getElementById('decision-screen').getAttribute('data-chapter-key');
        window.selectDecision = function(el) {
          document.querySelectorAll('.decision-card').forEach(function(c) {
            c.classList.remove('decision-card--selected');
          });
          el.classList.add('decision-card--selected');
          selectedChoice = el.getAttribute('data-choice');
          document.getElementById('decision-confirm-btn').disabled = false;
        };
        document.getElementById('decision-confirm-btn').addEventListener('click', function() {
          if (!selectedChoice) return;
          var btn = this;
          btn.disabled = true;
          btn.textContent = 'Saving...';
          fetch('/decision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapter_key: chKey, choice_id: selectedChoice }),
          }).then(function(r) { return r.json(); }).then(function(d) {
            if (d.success) {
              location.href = '/';
            } else {
              btn.disabled = false;
              btn.textContent = 'CONFIRM CHOICE';
            }
          }).catch(function() {
            btn.disabled = false;
            btn.textContent = 'CONFIRM CHOICE';
          });
        });
      })();
      </script>`;
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
    const paragraphs = cleanText(s.text || '')
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
    return `<div class="quest-special quest-special-${s.id}">
      <div class="quest-special-label">${labelMap[s.id] || '⚔️'}</div>
      ${paragraphs}
    </div>`;
  }).join('');
}

function buildMilestoneHtml(milestoneText) {
  if (!milestoneText) return '';
  const paragraphs = cleanText(milestoneText)
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p class="quest-milestone-p">${escapeHtml(p.trim())}</p>`)
    .join('');
  return `
    <div class="quest-milestone-card">
      <div class="quest-milestone-label">✦ Milestone Reached ✦</div>
      ${paragraphs}
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

  const narrativeHtml = cleanText(entry.daily_text || '')
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p class="quest-narrative-p">${escapeHtml(p.trim())}</p>`)
    .join('');

  const specials       = entry.specials       || [];
  const milestoneText  = entry.milestone_text || null;

  // Build story log modal content
  const logEntries = (qd.story_log || []).slice().reverse(); // newest first
  const logRows = logEntries.map(e => `
    <div class="slog-entry slog-${e.tier || 'standard'}">
      <div class="slog-meta">
        <span class="slog-date">${escapeHtml(e.date || '')}</span>
        <span class="slog-qday">Day ${e.quest_day || 0}</span>
        <span class="slog-chapter">${escapeHtml(e.chapter_title || '')}</span>
      </div>
      <div class="slog-text">${escapeHtml(e.daily_text || '')}</div>
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
        ${buildMilestoneHtml(milestoneText)}
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

function buildFellowshipBlock(rivianText) {
  if (!rivianText) return '';
  const paragraphs = rivianText
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p class="fellowship-p">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `
    <div class="fellowship-block">
      <div class="fellowship-label">From the Fellowship</div>
      ${paragraphs}
    </div>`;
}

function isPreviousMilestoneUnresolved(questDay, decisionLog, chapterKey) {
  if (questDay % 5 !== 1 || questDay < 6) return false;
  return !decisionLog[chapterKey];
}

function cleanText(raw) {
  if (!raw) return '';
  return raw.split('\n').map(l => l.trim()).join('\n');
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
