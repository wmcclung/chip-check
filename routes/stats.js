const express = require('express');
const router  = express.Router();

const {
  getSetting,
  getCurrentStreak,
  getRecentCheckins,
  getWakeStats,
  getTimeMilestones,
  getMissStats,
  getQuestState,
  getCurrentCampaign,
  getAllCampaigns,
} = require('../db');
const { CAMPAIGN_1 } = require('../quest');
const { timeMilestones } = require('../quotes');

const TREND_THRESHOLD_MINUTES = 10;

// ── Shared utilities ──────────────────────────────────────────────────────────

function minutesToTimeStr(minutes) {
  const h    = Math.floor(minutes / 60);
  const m    = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

function avgMinutes(rows) {
  if (!rows.length) return null;
  return Math.round(rows.reduce((s, r) => s + r.checkin_minutes, 0) / rows.length);
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

// ── GET /stats ────────────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const name         = await getSetting('primary_user_name') || 'Chip';
    const streak       = await getCurrentStreak();
    const bestStreak   = parseInt(await getSetting('best_streak') || '0', 10);
    const wakeGoalRaw  = await getSetting('wake_goal_time');
    const wakeGoalMin  = parseInt(wakeGoalRaw || '420', 10); // default 7:00 AM

    const wakeRows     = await getWakeStats();          // successful + has minutes, newest first
    const allCheckins  = await getRecentCheckins(90);   // last 90 days for completion %
    const earnedKeys   = new Set((await getTimeMilestones()).map(m => m.milestone_key));
    const missStats    = await getMissStats();
    const questState   = await getQuestState();
    const questCampaign = await getCurrentCampaign();
    const allCampaigns  = await getAllCampaigns();

    // ── Aggregate stats ───────────────────────────────────────────────────────
    const avg7   = avgMinutes(wakeRows.slice(0, 7));
    const avg30  = avgMinutes(wakeRows.slice(0, 30));
    const avgAll = avgMinutes(wakeRows);

    const personalBest = wakeRows.length
      ? wakeRows.reduce((best, r) => r.checkin_minutes < best.checkin_minutes ? r : best)
      : null;

    const thisWeekAvg = avgMinutes(wakeRows.slice(0, 7));
    const lastWeekAvg = avgMinutes(wakeRows.slice(7, 14));

    let weekTrendHtml = '<span class="trend-neutral">—</span>';
    if (thisWeekAvg != null && lastWeekAvg != null) {
      const diff = lastWeekAvg - thisWeekAvg;
      if (diff >= TREND_THRESHOLD_MINUTES) {
        weekTrendHtml = `<span class="trend-good">↑ ${diff} min earlier than last week</span>`;
      } else if (diff <= -TREND_THRESHOLD_MINUTES) {
        weekTrendHtml = `<span class="trend-bad">↓ ${Math.abs(diff)} min later than last week</span>`;
      } else {
        weekTrendHtml = `<span class="trend-neutral">→ About the same as last week</span>`;
      }
    }

    // ── Completion stats ──────────────────────────────────────────────────────
    const weekdays     = allCheckins.filter(c => c.status !== 'skipped').length;
    const successes    = allCheckins.filter(c => c.status === 'success').length;
    const completionPct = weekdays > 0 ? Math.round((successes / weekdays) * 100) : 0;

    // ── Chart data: last 30 days ──────────────────────────────────────────────
    // Build a date map for the last 30 calendar days
    const chartRows = [];
    const now = new Date();
    const ctNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const checkinByDate = {};
    for (const row of wakeRows) checkinByDate[row.date] = row.checkin_minutes;
    for (const row of allCheckins) {
      if (!(row.date in checkinByDate) && row.status === 'missed') {
        checkinByDate[row.date] = null; // mark missed
      }
    }

    // Collect last 30 calendar days
    const deadlineHour = parseInt(await getSetting('checkin_deadline_hour') || '9', 10);
    const missedMinutes = deadlineHour * 60; // treat missed as deadline time for chart
    for (let i = 29; i >= 0; i--) {
      const d = new Date(ctNow);
      d.setDate(d.getDate() - i);
      const dateStr = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-');
      const mins = checkinByDate[dateStr];
      chartRows.push({
        date:    dateStr,
        minutes: mins !== undefined ? mins : null,
        missed:  mins === null,
      });
    }

    const chartLabels  = JSON.stringify(chartRows.map(r => r.date.slice(5))); // MM-DD
    const chartData    = JSON.stringify(chartRows.map(r => r.minutes !== null && r.minutes !== undefined ? r.minutes : null));
    const missedPoints = JSON.stringify(chartRows.map(r => r.missed ? missedMinutes : null));

    // ── Recent 14 days table ──────────────────────────────────────────────────
    const recent14 = allCheckins.slice(0, 14);
    let recentRows = '';
    for (let i = 0; i < recent14.length; i++) {
      const row  = recent14[i];
      const next = recent14[i + 1]; // older row
      let rowClass = '';
      if (row.status === 'success' && row.checkin_minutes != null) {
        if (next && next.checkin_minutes != null) {
          const diff = next.checkin_minutes - row.checkin_minutes;
          if (diff >= TREND_THRESHOLD_MINUTES) rowClass = 'row-improving';
          else if (diff <= -TREND_THRESHOLD_MINUTES) rowClass = 'row-slipping';
        }
      }
      const timeDisplay = row.checkin_time || (row.status === 'success' ? '—' : '');
      const statusIcon  = row.status === 'success' ? '✅' : row.status === 'missed' ? '❌' : row.status === 'skipped' ? '⏭' : '⏳';
      recentRows += `
        <tr class="${rowClass}">
          <td>${escapeHtml(row.date)}</td>
          <td>${timeDisplay ? escapeHtml(timeDisplay) : '<span class="muted">—</span>'}</td>
          <td>${statusIcon} ${escapeHtml(row.status)}</td>
          <td>${row.streak_at_checkin != null ? row.streak_at_checkin : '—'}</td>
        </tr>`;
    }

    // ── Time milestone badges ─────────────────────────────────────────────────
    let badgeGrid = '';
    for (const tm of timeMilestones) {
      const earned = earnedKeys.has(tm.key);
      badgeGrid += `
        <div class="tm-badge ${earned ? 'tm-earned' : 'tm-locked'}">
          <div class="tm-icon">${earned ? tm.badge.split(' ')[0] : '🔒'}</div>
          <div class="tm-label">${escapeHtml(tm.label)}</div>
          ${earned ? `<div class="tm-badge-text">${escapeHtml(tm.badge)}</div>` : ''}
        </div>`;
    }

    res.send(renderStatsPage({
      name, streak, bestStreak, wakeGoalMin,
      avg7, avg30, avgAll,
      personalBest, weekTrendHtml,
      thisWeekAvg, lastWeekAvg,
      weekdays, successes, completionPct,
      chartLabels, chartData, missedPoints,
      wakeGoalMin, recentRows, badgeGrid,
      missStats,
      questState, questCampaign, allCampaigns,
    }));
  } catch (err) {
    console.error('[GET /stats]', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ── HTML renderer ─────────────────────────────────────────────────────────────

function renderStatsPage(d) {
  const {
    name, streak, bestStreak,
    avg7, avg30, avgAll, personalBest,
    weekTrendHtml, thisWeekAvg, lastWeekAvg,
    weekdays, successes, completionPct,
    chartLabels, chartData, missedPoints,
    wakeGoalMin, recentRows, badgeGrid,
    missStats,
    questState, questCampaign, allCampaigns,
  } = d;

  // Y axis: invert so earlier (smaller minutes) is higher
  // Chart range: 5:30 AM (330) to 10:00 AM (600)
  const yMin = 330;
  const yMax = 600;

  // ── Quest section HTML ────────────────────────────────────────────────────
  let questHtml = '';
  if (questState && questCampaign) {
    const qd             = questState.quest_day;
    const totalDays      = CAMPAIGN_1.total_days;
    const currentChapter = qd > 0 ? Math.min(Math.ceil(qd / 5), 12) : 0;

    // Road waypoints
    let roadDots = '';
    for (let i = 1; i <= 12; i++) {
      let cls = i < currentChapter ? 'sqw-complete' : i === currentChapter ? 'sqw-active' : 'sqw-future';
      roadDots += `<span class="sqw ${cls}" title="Ch. ${i}: ${escapeHtml(CAMPAIGN_1.chapters[i-1].title)}"></span>`;
      if (i < 12) roadDots += `<span class="sqw-line ${i < currentChapter ? 'sqw-line-done' : ''}"></span>`;
    }

    // Chapter map shields
    let chapterMap = '';
    for (const ch of CAMPAIGN_1.chapters) {
      const done    = ch.number < currentChapter;
      const active  = ch.number === currentChapter;
      const cls     = done ? 'cmap-done' : active ? 'cmap-active' : 'cmap-future';
      chapterMap += `
        <div class="cmap-item ${cls}" title="Ch. ${ch.number}: ${escapeHtml(ch.title)}">
          <div class="cmap-shield">${done ? '🛡️' : active ? '⚔️' : '○'}</div>
          <div class="cmap-label">Ch. ${ch.number}</div>
          <div class="cmap-name">${escapeHtml(ch.title)}</div>
        </div>`;
    }

    // Story log
    const logEntries = Array.isArray(questState.story_log) ? [...questState.story_log].reverse() : [];
    const logRows = logEntries.map(e => {
      const varCls = `slog-${e.type || 'standard'}`;
      return `
        <div class="slog-entry ${varCls}">
          <div class="slog-meta">
            <span class="slog-date">${escapeHtml(e.date || '')}</span>
            <span class="slog-qday">Day ${e.quest_day || 0}</span>
            <span class="slog-chapter">${escapeHtml(e.chapter || '')}</span>
          </div>
          <div class="slog-text">${escapeHtml(e.text || '')}</div>
        </div>`;
    }).join('') || '<p class="slog-empty">No entries yet.</p>';

    // Hall of Campaigns
    let hallRows = '';
    for (const c of (allCampaigns || [])) {
      const isActive  = !c.archived_at;
      const statusCls = isActive ? 'hall-active' : c.archive_reason === 'completed' ? 'hall-complete' : 'hall-fallen';
      const statusLbl = isActive ? 'Active' : c.archive_reason === 'completed' ? 'Complete' : 'Fallen';
      hallRows += `
        <tr class="${statusCls}">
          <td>${c.campaign_number}</td>
          <td>${escapeHtml(c.title || '')}</td>
          <td>${isActive ? qd : (c.quest_days_reached || '—')}</td>
          <td>${c.best_streak || '—'}</td>
          <td>${c.avg_wake_minutes ? minutesToTimeStr(c.avg_wake_minutes) : '—'}</td>
          <td>${statusLbl}</td>
        </tr>`;
    }

    questHtml = `
      <!-- Quest: The Chronicle section -->
      <div class="stats-card">
        <h2 class="stats-section-title">⚔️ The Chronicle</h2>

        <!-- Campaign status -->
        <div class="quest-stat-campaign">
          <div class="quest-stat-campaign-title">${escapeHtml(questCampaign.title)} — Campaign ${questCampaign.campaign_number}</div>
          <div class="quest-stat-day">Quest Day ${qd} of ${totalDays}</div>
          <div class="quest-road-visual stats-road">${roadDots}</div>
          <div class="quest-stat-lifetime">Lifetime quest days (all campaigns): <strong>${questState.lifetime_quest_days}</strong></div>
        </div>

        <!-- Chapter map -->
        <h3 class="quest-sub-title">Chapter Map</h3>
        <div class="cmap-grid">${chapterMap}</div>

        <!-- Story log -->
        <h3 class="quest-sub-title">The Story Log</h3>
        <div class="slog-panel">${logRows}</div>

        <!-- Hall of Campaigns -->
        <h3 class="quest-sub-title">Hall of Campaigns</h3>
        <div class="table-scroll">
          <table class="admin-table stats-table hall-table">
            <thead><tr><th>#</th><th>Title</th><th>Quest Days</th><th>Best Streak</th><th>Avg Wake</th><th>Status</th></tr></thead>
            <tbody>${hallRows}</tbody>
          </table>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)}'s Wake-Up Stats</title>
  <link rel="stylesheet" href="/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body class="stats-body">
  <div class="stats-container">

    <!-- Header -->
    <div class="stats-header">
      <div class="stats-title">⚔️ ${escapeHtml(name)}'s Stats</div>
      <a href="/" class="stats-back-link">← Back to check-in</a>
    </div>

    <!-- Streak summary -->
    <div class="stats-streak-row">
      <div class="stats-streak-card">
        <div class="stats-streak-num">${streak}</div>
        <div class="stats-streak-label">current streak</div>
      </div>
      <div class="stats-streak-card">
        <div class="stats-streak-num">${bestStreak}</div>
        <div class="stats-streak-label">best streak</div>
      </div>
      <div class="stats-streak-card">
        <div class="stats-streak-num">${completionPct}%</div>
        <div class="stats-streak-label">${successes}/${weekdays} days</div>
      </div>
    </div>

    <!-- Wake time stats -->
    <div class="stats-card">
      <h2 class="stats-section-title">⏰ Wake-Up Time</h2>
      <div class="stats-kpi-grid">
        <div class="stats-kpi">
          <div class="stats-kpi-value">${personalBest ? minutesToTimeStr(personalBest.checkin_minutes) : '—'}</div>
          <div class="stats-kpi-label">Personal Best</div>
          ${personalBest ? `<div class="stats-kpi-sub">${escapeHtml(personalBest.date)}</div>` : ''}
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-value">${avgAll != null ? minutesToTimeStr(avgAll) : '—'}</div>
          <div class="stats-kpi-label">All-Time Avg</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-value">${avg30 != null ? minutesToTimeStr(avg30) : '—'}</div>
          <div class="stats-kpi-label">30-Day Avg</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-value">${avg7 != null ? minutesToTimeStr(avg7) : '—'}</div>
          <div class="stats-kpi-label">7-Day Avg</div>
        </div>
      </div>
      <div class="stats-week-compare">
        <span class="stats-compare-label">This week vs last week:</span>
        <span class="stats-compare-vals">
          ${thisWeekAvg != null ? minutesToTimeStr(thisWeekAvg) : '—'}
          <span class="muted"> vs </span>
          ${lastWeekAvg != null ? minutesToTimeStr(lastWeekAvg) : '—'}
        </span>
        <span class="stats-trend">${weekTrendHtml}</span>
      </div>
    </div>

    <!-- Line chart -->
    <div class="stats-card">
      <h2 class="stats-section-title">📈 Last 30 Days</h2>
      <div class="chart-wrapper">
        <canvas id="wakeChart"></canvas>
      </div>
    </div>

    <!-- Milestone badges -->
    <div class="stats-card">
      <h2 class="stats-section-title">🏅 Time Milestones</h2>
      <div class="tm-badge-grid">${badgeGrid}</div>
    </div>

    <!-- Miss stats -->
    <div class="stats-card">
      <h2 class="stats-section-title">❌ Missed Days</h2>
      <div class="stats-kpi-grid stats-miss-grid">
        <div class="stats-kpi">
          <div class="stats-kpi-value stats-miss-value">${missStats.last30Misses}</div>
          <div class="stats-kpi-label">Misses (last 30 days)</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-value stats-miss-value">${missStats.allTimeMisses}</div>
          <div class="stats-kpi-label">All-Time Misses</div>
        </div>
        <div class="stats-kpi">
          <div class="stats-kpi-value stats-miss-value">${missStats.missPercent}%</div>
          <div class="stats-kpi-label">All-Time Miss Rate</div>
        </div>
      </div>
    </div>

    <!-- Recent 14 days -->
    <div class="stats-card">
      <h2 class="stats-section-title">📅 Recent Check-ins</h2>
      <div class="table-scroll">
        <table class="admin-table stats-table">
          <thead>
            <tr><th>Date</th><th>Time</th><th>Status</th><th>Streak</th></tr>
          </thead>
          <tbody>${recentRows}</tbody>
        </table>
      </div>
    </div>

    ${questHtml}

  </div>

  <script>
    const ctx = document.getElementById('wakeChart').getContext('2d');
    const labels      = ${chartLabels};
    const wakeData    = ${chartData};
    const missedData  = ${missedPoints};
    const goalMinutes = ${wakeGoalMin};

    // Custom Y-axis tick formatter: minutes → time string
    function minsToTime(v) {
      const h = Math.floor(v / 60);
      const m = v % 60;
      const ap = h < 12 ? 'AM' : 'PM';
      const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return dh + ':' + String(m).padStart(2, '0') + ' ' + ap;
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Wake time',
            data: wakeData,
            borderColor: '#c8a96e',
            backgroundColor: 'rgba(200,169,110,0.08)',
            pointBackgroundColor: '#c8a96e',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            spanGaps: true,
          },
          {
            label: 'Missed (deadline)',
            data: missedData,
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#8b0000',
            pointRadius: 5,
            pointStyle: 'crossRot',
            showLine: false,
          },
          {
            label: 'Goal (' + minsToTime(goalMinutes) + ')',
            data: labels.map(() => goalMinutes),
            borderColor: 'rgba(139,0,0,0.5)',
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            reverse: true,
            min: ${yMin},
            max: ${yMax},
            ticks: {
              color: '#8a6e3e',
              callback: minsToTime,
              stepSize: 30,
            },
            grid: { color: 'rgba(138,110,62,0.15)' },
          },
          x: {
            ticks: { color: '#8a6e3e', maxRotation: 45, minRotation: 0 },
            grid: { color: 'rgba(138,110,62,0.1)' },
          },
        },
        plugins: {
          legend: {
            labels: { color: '#c8a96e', boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                if (ctx.dataset.label === 'Missed (deadline)' && ctx.parsed.y != null) return 'Missed';
                if (ctx.parsed.y == null) return null;
                return ctx.dataset.label + ': ' + minsToTime(ctx.parsed.y);
              },
            },
          },
        },
      },
    });
  </script>
</body>
</html>`;
}

module.exports = router;
