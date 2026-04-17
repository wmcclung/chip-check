'use strict';

const express  = require('express');
const router   = express.Router();
const { getSetting } = require('../db');
const {
  CAMPAIGN_1,
  ARTIFACTS,
  DECISION_ECHOES,
} = require('../quest');
const ADV = require('../adventureDays');
const { RIVIAN_ENTRIES, RIVIAN_DAYS } = require('../rivianEntries');

// ── Auth ──────────────────────────────────────────────────────────────────────

function requireArchiveAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ── Data setup ────────────────────────────────────────────────────────────────

const ADVENTURE_DAYS_SET = new Set([7, 12, 13, 18, 22, 24, 27, 32, 34, 39, 42, 52, 57]);

const scheduledByDay = {};
for (const ch of CAMPAIGN_1.chapters) {
  for (const s of (ch.scheduled || [])) {
    scheduledByDay[s.quest_day] = scheduledByDay[s.quest_day] || [];
    scheduledByDay[s.quest_day].push(s);
  }
}

// Returns all tier keys present in a DAY object
function getAdvVariantKey(dayNum, tier) {
  switch (dayNum) {
    case 7:  return tier;
    case 12:
      if (tier === 'blazing' || tier === 'great') return 'blazing_great';
      if (tier === 'good') return 'good_with_tip';
      return 'struggle';
    case 13:
      return `has_riddle_${tier}`;
    case 18:
      return `${tier}_with_letter`;
    case 22: return tier;
    case 24:
      return `knows_${tier}`;
    case 27:
      return tier === 'struggle' ? 'struggle' : 'blazing_great_good';
    case 32: return tier;
    case 34:
      return tier === 'struggle' ? 'bird_not_encountered' : 'bird_encountered';
    case 39:
      return tier === 'struggle' ? 'struggle' : 'blazing_great_good';
    case 42:
      if (tier === 'struggle') return 'struggle';
      if (tier === 'blazing' || tier === 'great') return 'knows_maren';
      return 'knows_senna_not_maren';
    case 52:
      if (tier === 'blazing') return 'knows_roan';
      return 'doesnt_know_other';
    case 57:
      return (tier === 'blazing' || tier === 'great') ? 'blazing_great' : 'good_struggle';
    default: return tier;
  }
}

function getAdvText(dayNum, tier) {
  const dayObj = ADV[`DAY_${dayNum}`];
  if (!dayObj) return null;
  return dayObj[getAdvVariantKey(dayNum, tier)] || null;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function prose(text) {
  if (!text) return '';
  return `<p class="arc-prose">${escapeHtml(text).replace(/\n\n/g, '</p><p class="arc-prose">').replace(/\n/g, '<br>')}</p>`;
}

// ── GET /archive ──────────────────────────────────────────────────────────────

router.get('/archive', requireArchiveAuth, async (req, res) => {
  try {
    const tiers = ['blazing', 'great', 'good', 'struggle'];

    // Pre-render all 60 days
    let daysHtml = '';

    for (const ch of CAMPAIGN_1.chapters) {
      daysHtml += `
        <div class="arc-chapter-header" id="ch-${ch.number}">
          <span class="arc-ch-num">Chapter ${ch.number}</span>
          <span class="arc-ch-title">${escapeHtml(ch.title)}</span>
          <span class="arc-ch-loc">📍 ${escapeHtml(ch.location)}</span>
          <span class="arc-ch-days">Days ${ch.days[0]}–${ch.days[1]}</span>
        </div>`;

      for (let day = ch.days[0]; day <= ch.days[1]; day++) {
        const isMilestone = day % 5 === 0;
        const isAdventure = ADVENTURE_DAYS_SET.has(day);
        const rivianIdx   = RIVIAN_DAYS.indexOf(day);
        const scheduled   = scheduledByDay[day] || [];

        // Dot badges
        let badges = '';
        if (scheduled.length)        badges += `<span class="arc-badge arc-badge-sched">scheduled</span>`;
        if (isAdventure)             badges += `<span class="arc-badge arc-badge-adv">adventure</span>`;
        if (rivianIdx !== -1)        badges += `<span class="arc-badge arc-badge-rivian">rivian</span>`;
        if (isMilestone)             badges += `<span class="arc-badge arc-badge-mile">milestone</span>`;
        if (isMilestone && ch.decision) badges += `<span class="arc-badge arc-badge-dec">decision</span>`;

        let sections = '';

        // Scheduled
        for (const s of scheduled) {
          sections += `
            <div class="arc-section">
              <div class="arc-section-label">[ Scheduled ]</div>
              ${prose(s.text)}
            </div>`;
        }

        // Adventure — render all 4 tiers, hidden/shown via JS
        if (isAdventure) {
          sections += `<div class="arc-section">`;
          sections += `<div class="arc-section-label arc-adv-label">[ Adventure — <span class="arc-tier-name">Good</span> ]</div>`;
          for (const tier of tiers) {
            const text = getAdvText(day, tier);
            sections += `<div class="arc-adv-tier" data-tier="${tier}" style="display:${tier === 'good' ? 'block' : 'none'}">${prose(text || '(no text for this tier)')}</div>`;
          }
          sections += `</div>`;
        }

        // Rivian
        if (rivianIdx !== -1 && RIVIAN_ENTRIES[rivianIdx]) {
          sections += `
            <div class="arc-section">
              <div class="arc-section-label">[ Rivian ]</div>
              ${prose(RIVIAN_ENTRIES[rivianIdx])}
            </div>`;
        }

        // Milestone
        if (isMilestone && ch.milestone) {
          sections += `
            <div class="arc-section">
              <div class="arc-section-label">[ Chapter Complete — Day ${day} ]</div>
              ${prose(ch.milestone)}
            </div>`;
        }

        // Artifact
        if (isMilestone && ch.artifact_awarded && ARTIFACTS[ch.artifact_awarded]) {
          const art = ARTIFACTS[ch.artifact_awarded];
          sections += `
            <div class="arc-section">
              <div class="arc-section-label">[ Artifact ]</div>
              <div class="arc-artifact">
                <div class="arc-artifact-name">${escapeHtml(art.name)}</div>
                <p class="arc-artifact-desc">${escapeHtml(art.description)}</p>
              </div>
            </div>`;
        }

        // Decision
        if (isMilestone && ch.decision) {
          const { prompt, choices } = ch.decision;
          const choiceHtml = choices.map(c => `
            <div class="arc-choice">
              <div class="arc-choice-label">${escapeHtml(c.label)}</div>
              ${c.consequence ? `<div class="arc-choice-consequence">${escapeHtml(c.consequence)}</div>` : ''}
            </div>`).join('');
          sections += `
            <div class="arc-section">
              <div class="arc-section-label">[ Decision ]</div>
              <p class="arc-decision-prompt">${escapeHtml(prompt)}</p>
              <div class="arc-choices">${choiceHtml}</div>
            </div>`;
        }

        // Missed (collapsible)
        if (ch.missed) {
          sections += `
            <details class="arc-missed">
              <summary class="arc-section-label arc-missed-summary">[ What if Chip misses this day? ]</summary>
              <div class="arc-missed-body">${prose(ch.missed)}</div>
            </details>`;
        }

        daysHtml += `
          <div class="arc-day" id="day-${day}" data-day="${day}">
            <div class="arc-day-header">
              <span class="arc-day-num">Day ${day}</span>
              <div class="arc-badges">${badges}</div>
            </div>
            ${sections || '<p class="arc-empty">Standard narrative day — pick variant generates on check-in.</p>'}
          </div>`;
      }
    }

    res.send(renderArchivePage(daysHtml));
  } catch (err) {
    console.error('[GET /archive]', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ── HTML ──────────────────────────────────────────────────────────────────────

function renderArchivePage(daysHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Emberstone Chronicles — Archive</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    .arc-layout { display: flex; height: 100vh; background: #0a0a0f; color: #f0e8d8; overflow: hidden; }

    /* Sidebar */
    .arc-sidebar { width: 200px; flex-shrink: 0; background: #13131a; border-right: 1px solid #1e1e2e; overflow-y: auto; padding: 1rem 0; }
    .arc-sidebar-title { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: #c8a96e; padding: 0 1rem 0.75rem; font-weight: 700; }
    .arc-sidebar-ch { display: block; width: 100%; text-align: left; padding: 0.4rem 1rem; font-size: 0.78rem; color: #8a7a5a; background: none; border: none; cursor: pointer; line-height: 1.3; }
    .arc-sidebar-ch:hover { color: #c8a96e; background: rgba(200,169,110,0.06); }
    .arc-sidebar-ch .arc-sbc-num { font-weight: 700; color: #c8a96e; }
    .arc-sidebar-ch .arc-sbc-name { font-size: 0.7rem; color: #5a5060; }

    /* Main */
    .arc-main { flex: 1; overflow-y: auto; padding: 1.5rem 2rem; max-width: 800px; }
    .arc-top-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #1e1e2e; flex-wrap: wrap; }
    .arc-title { font-size: 1rem; font-weight: 700; color: #c8a96e; letter-spacing: 0.05em; }
    .arc-tier-selector { display: flex; gap: 0.4rem; margin-left: auto; }
    .arc-tier-btn { padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; border: 1px solid #3a3050; background: #1a1a2e; color: #8a7a6a; cursor: pointer; transition: all 0.15s; }
    .arc-tier-btn:hover { color: #c8a96e; border-color: #c8a96e; }
    .arc-tier-btn.active { background: #2a2030; color: #c8a96e; border-color: #c8a96e; }

    /* Chapter header */
    .arc-chapter-header { display: flex; align-items: baseline; gap: 0.75rem; padding: 1.5rem 0 0.5rem; border-top: 1px solid #1e1e2e; margin-top: 1rem; flex-wrap: wrap; }
    .arc-chapter-header:first-child { border-top: none; margin-top: 0; }
    .arc-ch-num { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: #c8a96e; font-weight: 700; }
    .arc-ch-title { font-size: 0.95rem; font-weight: 700; color: #e8d8b8; }
    .arc-ch-loc { font-size: 0.72rem; color: #5a5060; margin-left: auto; }
    .arc-ch-days { font-size: 0.65rem; color: #3a3050; }

    /* Day card */
    .arc-day { margin-bottom: 0.5rem; border: 1px solid #1a1a2a; border-radius: 6px; overflow: hidden; }
    .arc-day-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.9rem; background: #13131a; cursor: pointer; user-select: none; }
    .arc-day-header:hover { background: #1a1a28; }
    .arc-day-num { font-size: 0.75rem; font-weight: 700; color: #8a7a6a; min-width: 2.5rem; }
    .arc-badges { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .arc-badge { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.1rem 0.4rem; border-radius: 2px; }
    .arc-badge-sched  { background: rgba(59,130,246,0.2);  color: #93c5fd; }
    .arc-badge-adv    { background: rgba(251,146,60,0.2);  color: #fdba74; }
    .arc-badge-rivian { background: rgba(167,139,250,0.2); color: #c4b5fd; }
    .arc-badge-mile   { background: rgba(245,158,11,0.2);  color: #fcd34d; }
    .arc-badge-dec    { background: rgba(139,92,246,0.2);  color: #c4b5fd; }

    /* Day body */
    .arc-day-body { padding: 1rem 1.2rem; display: none; }
    .arc-day-body.open { display: block; }
    .arc-section { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #1a1a2a; }
    .arc-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .arc-section-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: #5a5060; font-weight: 700; margin-bottom: 0.6rem; font-family: sans-serif; }
    .arc-prose { font-family: Georgia, serif; font-size: 0.85rem; line-height: 1.75; color: #d8c8a8; margin: 0 0 0.75rem; white-space: pre-wrap; }
    .arc-prose:last-child { margin-bottom: 0; }
    .arc-empty { font-size: 0.78rem; color: #3a3050; font-style: italic; }

    /* Artifact */
    .arc-artifact { border: 1px solid rgba(200,169,110,0.2); border-radius: 4px; padding: 0.75rem 1rem; background: rgba(200,169,110,0.05); }
    .arc-artifact-name { font-size: 0.82rem; font-weight: 700; color: #c8a96e; margin-bottom: 0.4rem; }
    .arc-artifact-desc { font-family: Georgia, serif; font-size: 0.8rem; color: #b8a888; line-height: 1.6; margin: 0; }

    /* Decision */
    .arc-decision-prompt { font-family: Georgia, serif; font-size: 0.82rem; color: #a898b8; font-style: italic; margin-bottom: 0.75rem; }
    .arc-choices { display: flex; flex-direction: column; gap: 0.5rem; }
    .arc-choice { border: 1px solid #2a2040; border-radius: 4px; padding: 0.6rem 0.85rem; }
    .arc-choice-label { font-size: 0.8rem; font-weight: 600; color: #c8a96e; margin-bottom: 0.25rem; }
    .arc-choice-consequence { font-family: Georgia, serif; font-size: 0.75rem; color: #8a7a6a; line-height: 1.5; }

    /* Missed */
    .arc-missed { margin-top: 0.5rem; }
    .arc-missed-summary { cursor: pointer; list-style: none; }
    .arc-missed-summary::-webkit-details-marker { display: none; }
    .arc-missed-summary:hover { color: #8a7a6a; }
    .arc-missed-body { margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid #1a1a2a; }

    /* Adventure tier label */
    .arc-adv-label { display: flex; align-items: center; gap: 0.4rem; }
  </style>
</head>
<body style="margin:0;padding:0">
<div class="arc-layout">

  <!-- Sidebar -->
  <div class="arc-sidebar">
    <div class="arc-sidebar-title">The Emberstone Chronicles</div>
    ${CAMPAIGN_1.chapters.map(ch => `
      <button class="arc-sidebar-ch" onclick="jumpToChapter(${ch.number})">
        <div class="arc-sbc-num">Ch. ${ch.number} · Days ${ch.days[0]}–${ch.days[1]}</div>
        <div class="arc-sbc-name">${escapeHtml(ch.title)}</div>
      </button>`).join('')}
  </div>

  <!-- Main -->
  <div class="arc-main" id="arc-main">
    <div class="arc-top-bar">
      <div class="arc-title">⚔️ Chronicle Archive</div>
      <div style="font-size:0.72rem;color:#5a5060">Use arrow keys to navigate days · click day to expand</div>
      <div class="arc-tier-selector">
        <button class="arc-tier-btn" data-tier="blazing" onclick="setTier('blazing')">Blazing</button>
        <button class="arc-tier-btn" data-tier="great"   onclick="setTier('great')">Great</button>
        <button class="arc-tier-btn active" data-tier="good" onclick="setTier('good')">Good</button>
        <button class="arc-tier-btn" data-tier="struggle" onclick="setTier('struggle')">Struggle</button>
      </div>
    </div>

    ${daysHtml}
  </div>
</div>

<script>
  var currentTier = 'good';
  var currentDay  = 1;

  // Click day header to toggle open
  document.querySelectorAll('.arc-day-header').forEach(function(h) {
    h.addEventListener('click', function() {
      var body = h.nextElementSibling;
      if (!body) return;
      var isOpen = body.classList.contains('open');
      // Close all
      document.querySelectorAll('.arc-day-body.open').forEach(function(b) { b.classList.remove('open'); });
      if (!isOpen) {
        body.classList.add('open');
        currentDay = parseInt(h.closest('.arc-day').dataset.day, 10);
      }
    });
  });

  // Open day 1 by default
  var first = document.querySelector('.arc-day-body');
  if (first) first.classList.add('open');

  function setTier(tier) {
    currentTier = tier;
    document.querySelectorAll('.arc-tier-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tier === tier);
    });
    // Update all adventure tier blocks
    document.querySelectorAll('.arc-day').forEach(function(dayEl) {
      dayEl.querySelectorAll('.arc-adv-tier').forEach(function(t) {
        t.style.display = t.dataset.tier === tier ? 'block' : 'none';
      });
      var label = dayEl.querySelector('.arc-tier-name');
      if (label) label.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    });
  }

  function jumpToChapter(num) {
    var el = document.getElementById('ch-' + num);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Auto-open first day of chapter
    var firstDay = el && el.nextElementSibling;
    if (firstDay && firstDay.classList.contains('arc-day')) {
      document.querySelectorAll('.arc-day-body.open').forEach(function(b) { b.classList.remove('open'); });
      var body = firstDay.querySelector('.arc-day-body');
      if (body) body.classList.add('open');
      currentDay = parseInt(firstDay.dataset.day, 10);
    }
  }

  // Keyboard nav
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigateDay(1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigateDay(-1);
  });

  function navigateDay(delta) {
    var next = Math.max(1, Math.min(60, currentDay + delta));
    if (next === currentDay) return;
    currentDay = next;
    document.querySelectorAll('.arc-day-body.open').forEach(function(b) { b.classList.remove('open'); });
    var dayEl = document.getElementById('day-' + next);
    if (!dayEl) return;
    var body = dayEl.querySelector('.arc-day-body');
    if (body) body.classList.add('open');
    dayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
</script>
</body>
</html>`;
}

module.exports = router;
