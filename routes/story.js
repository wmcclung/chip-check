'use strict';

const express = require('express');
const router  = express.Router();

const { getQuestState, getCurrentCampaign, getAllCampaigns, getQuestArtifacts } = require('../db');
const { ARTIFACTS } = require('../quest');

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function emberSvg(level) {
  const colors = ['#5a4a3a', '#8a6030', '#c8a96e', '#f0c060', '#ffffff'];
  const color  = colors[Math.max(0, Math.min(4, (level || 1) - 1))];
  return `<svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:4px">
    <path d="M7 1C7 1 11 5 11 9C11 11.761 9.209 14 7 14C4.791 14 3 11.761 3 9C3 5 7 1 7 1Z" fill="${color}" opacity="0.9"/>
    <path d="M7 8C7 8 9 10 9 11.5C9 12.328 8.104 13 7 13C5.896 13 5 12.328 5 11.5C5 10 7 8 7 8Z" fill="${color}" opacity="0.5"/>
  </svg>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function chapterDots(chapterNumber) {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    if (n < chapterNumber)  return '<span class="scd filled">●</span>';
    if (n === chapterNumber) return '<span class="scd current">●</span>';
    return '<span class="scd empty">○</span>';
  }).join('');
}

function toRoman(n) {
  const vals = [
    ['XII', 12], ['XI', 11], ['X', 10], ['IX', 9],
    ['VIII', 8], ['VII', 7], ['VI', 6], ['V', 5],
    ['IV', 4], ['III', 3], ['II', 2], ['I', 1],
  ];
  for (const [r, v] of vals) if (n >= v) return r;
  return String(n);
}

// ── GET /story ────────────────────────────────────────────────────────────────

router.get('/story', async (req, res) => {
  try {
    const qs       = await getQuestState();
    const campaign = await getCurrentCampaign();
    const allCamps = await getAllCampaigns();

    if (!qs || !campaign) {
      return res.send(storyPage({ entries: [], filter: 'all', sort: 'newest', mode: 'cards', campaign: null, allCamps: [] }));
    }

    const rawLog = Array.isArray(qs.story_log) ? qs.story_log : [];
    const filter = req.query.filter || 'all';
    const sort   = req.query.sort   || 'newest';
    const mode   = req.query.mode   || 'cards';

    let entries = rawLog.filter(e => {
      if (mode === 'story') return true; // story mode shows everything in order
      if (filter === 'milestones') return !!e.milestone_text;
      if (filter === 'pull')       return !!e.pull_appears;
      return true;
    });

    // Card mode respects the sort param; story mode always reads oldest-first.
    if (mode !== 'story' && sort === 'newest') {
      entries = [...entries].reverse();
    }

    // Artifact data for current campaign
    const artifactRows = await getQuestArtifacts(campaign.id);
    const foundArtifactIds = artifactRows.map(r => r.artifact_id);

    res.send(storyPage({ entries, filter, sort, mode, campaign, allCamps, qs, foundArtifactIds }));
  } catch (err) {
    console.error('[GET /story]', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ── Story mode renderer ───────────────────────────────────────────────────────

function storyModeHtml(entries) {
  if (entries.length === 0) {
    return '<p class="slog-empty">No chronicle entries yet.</p>';
  }

  // Group entries by chapter number, preserving chronological order within each group.
  const chapters = [];
  const chapterMap = new Map();
  for (const e of entries) {
    const num = e.chapter_number || 1;
    if (!chapterMap.has(num)) {
      const group = { number: num, title: e.chapter_title || '', location: e.location || '', entries: [] };
      chapters.push(group);
      chapterMap.set(num, group);
    }
    chapterMap.get(num).entries.push(e);
  }

  const chapterSections = chapters.map((ch, idx) => {
    const heading = `${toRoman(ch.number)}. ${escapeHtml(ch.title)}`;

    const entryBlocks = ch.entries.map(e => {
      // Specials (chronicle_begins, fellowship_regroups, etc.)
      let specialsHtml = '';
      if (Array.isArray(e.specials) && e.specials.length > 0) {
        specialsHtml = e.specials.map(s => {
          const paras = cleanText(s.text || '')
            .split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p class="sm-p">${escapeHtml(p.trim())}</p>`)
            .join('');
          return `<div class="sm-special">${paras}</div>`;
        }).join('');
      }

      // Daily narrative
      const narrativeParas = cleanText(e.daily_text || '')
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => `<p class="sm-p">${escapeHtml(p.trim())}</p>`)
        .join('');

      // Milestone — rendered as a pull-quote block
      let milestoneHtml = '';
      if (e.milestone_text) {
        const mParas = cleanText(e.milestone_text)
          .split('\n\n')
          .filter(p => p.trim())
          .map(p => `<p class="sm-milestone-p">${escapeHtml(p.trim())}</p>`)
          .join('');
        milestoneHtml = `<blockquote class="sm-milestone">${mParas}</blockquote>`;
      }

      return `<div class="sm-entry">${specialsHtml}${narrativeParas}${milestoneHtml}</div>`;
    }).join('\n');

    const divider = idx < chapters.length - 1
      ? '<hr class="sm-chapter-divider">'
      : '';

    return `
      <section class="sm-chapter">
        <h2 class="sm-chapter-heading">${heading}</h2>
        <p class="sm-location">${escapeHtml(ch.location)}</p>
        ${entryBlocks}
      </section>
      ${divider}`;
  }).join('\n');

  return chapterSections;
}

// ── Page renderer ─────────────────────────────────────────────────────────────

function storyPage({ entries, filter, sort, mode = 'cards', campaign, allCamps, qs, foundArtifactIds = [] }) {
  const totalEntries = qs ? (Array.isArray(qs.story_log) ? qs.story_log.length : 0) : 0;
  const isStoryMode  = mode === 'story';

  function entryCard(e) {
    const isMilestone = !!e.milestone_text;
    const hasPull     = !!e.pull_appears;
    const hasArtifact = !!e.artifact_found;
    const chNum       = e.chapter_number || 1;
    const tier        = e.tier || '';
    const isSuccess   = tier !== 'missed';

    const tierClass = {
      improving: 'tier-improving',
      good:      'tier-good',
      standard:  'tier-standard',
      struggle:  'tier-struggle',
      missed:    'tier-missed',
    }[tier] || '';

    const paragraphs = cleanText(e.daily_text || '').split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('');

    let specialsHtml = '';
    if (Array.isArray(e.specials) && e.specials.length > 0) {
      specialsHtml = e.specials.map(s => `
        <div class="slog-special">
          ${s.title ? `<div class="slog-special-title">${s.title}</div>` : ''}
          ${cleanText(s.text || '').split('\n\n').filter(p=>p.trim()).map(p=>`<p>${p.trim()}</p>`).join('')}
        </div>`).join('');
    }

    let milestoneHtml = '';
    if (isMilestone) {
      const mParas = cleanText(e.milestone_text || '').split('\n\n')
        .filter(p => p.trim())
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
      milestoneHtml = `
        <div class="slog-milestone-section">
          <div class="slog-milestone-label">✦ Chapter Milestone ✦</div>
          ${mParas}
        </div>`;
    }

    return `
      <article class="slog-card ${isMilestone ? 'slog-card-milestone' : ''} ${tierClass}">
        <header class="slog-card-header">
          <div class="slog-meta">
            <span class="slog-date">${formatDate(e.date)}</span>
            <span class="slog-qdot">·</span>
            <span class="slog-qday">Quest Day ${e.quest_day || '?'}</span>
          </div>
          <div class="slog-chapter-info">
            <span class="slog-chapter-name">${e.chapter_title || ''}</span>
            ${e.location ? `<span class="slog-location">📍 ${e.location}</span>` : ''}
          </div>
          <div class="slog-indicators">
            ${isSuccess ? `${emberSvg(e.ember_level || 1)}<span class="slog-ember-label">Ember ${e.ember_level || 1}</span>` : '<span class="slog-missed-label">❌ Missed</span>'}
            ${hasPull   ? '<span class="slog-pull-dot" title="The Pull appeared">⬤</span>' : ''}
            ${hasArtifact ? '<span class="slog-artifact-dot" title="Artifact found">◈</span>' : ''}
          </div>
        </header>
        <div class="slog-body">
          ${specialsHtml}
          <div class="slog-narrative">${paragraphs}</div>
          ${milestoneHtml}
        </div>
        <div class="slog-dots">${chapterDots(chNum)}</div>
      </article>`;
  }

  // ── Filter / sort / mode controls ────────────────────────────────────────────

  const filterBtn = (val, label) => {
    const active = !isStoryMode && filter === val;
    return `<a href="/story?filter=${val}&sort=${sort}" class="slog-filter-btn ${active ? 'active' : ''}">${label}</a>`;
  };
  const sortBtn = (val, label) => {
    if (isStoryMode) return '';
    return `<a href="/story?filter=${filter}&sort=${val}" class="slog-sort-btn ${sort === val ? 'active' : ''}">${label}</a>`;
  };
  const storyModeHref = isStoryMode
    ? `/story?filter=${filter}&sort=${sort}`
    : `/story?mode=story`;
  const storyModeBtn = `<a href="${storyModeHref}" class="slog-filter-btn slog-story-mode-btn ${isStoryMode ? 'active' : ''}">Story Mode</a>`;

  // ── Main content area ─────────────────────────────────────────────────────────

  let mainContent;
  if (isStoryMode) {
    mainContent = `
      <div class="sm-document">
        <h1 class="sm-title">The Emberstone Chronicles</h1>
        <p class="sm-subtitle">From Downers Grove to Ashen Peak</p>
        <hr class="sm-top-divider">
        ${storyModeHtml(entries)}
      </div>`;
  } else {
    const entriesHtml = entries.length > 0
      ? entries.map(entryCard).join('\n')
      : '<p class="slog-empty">No entries yet.</p>';
    mainContent = `<div class="story-entries">${entriesHtml}</div>`;
  }

  // ── Campaign header values ────────────────────────────────────────────────────

  const campNum    = campaign ? campaign.campaign_number : '—';
  const questDay   = qs ? qs.quest_day : 0;
  const chapterNow = Math.min(Math.ceil(questDay / 5), 12);

  // ── Print button (story mode only) ───────────────────────────────────────────

  const printBtn = isStoryMode
    ? `<button class="sm-print-btn no-print" onclick="window.print()">Print / Save as PDF</button>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Emberstone Chronicles</title>
<link rel="stylesheet" href="/style.css">
<style>
/* ── Story Mode styles ────────────────────────────────────────────────── */
.sm-document {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}
.sm-title {
  font-family: 'Arial Black', Impact, sans-serif;
  font-size: 1.9rem;
  color: #c8a96e;
  text-align: center;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}
.sm-subtitle {
  text-align: center;
  color: #8a6e3e;
  font-size: 0.95rem;
  font-style: italic;
  letter-spacing: 0.04em;
  margin: 0 0 28px;
}
.sm-top-divider {
  border: none;
  border-top: 1px solid #8a6e3e;
  margin: 0 0 40px;
}
.sm-chapter {
  margin-bottom: 12px;
}
.sm-chapter-heading {
  font-family: 'Arial Black', Impact, sans-serif;
  font-size: 1.15rem;
  color: #c8a96e;
  letter-spacing: 0.06em;
  margin: 48px 0 4px;
}
.sm-location {
  font-size: 0.78rem;
  color: #8a6e3e;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin: 0 0 20px;
}
.sm-entry {
  margin-bottom: 0;
}
.sm-p {
  color: #e8dcc8;
  font-size: 1rem;
  line-height: 1.85;
  margin: 0 0 1.1em;
}
.sm-special {
  margin-bottom: 1.2em;
}
.sm-special .sm-p {
  color: #a89060;
  font-style: italic;
}
.sm-milestone {
  border-left: 2px solid #8a6e3e;
  margin: 1.6em 0 1.6em 20px;
  padding: 4px 0 4px 20px;
}
.sm-milestone-p {
  color: #c8a96e;
  font-size: 0.97rem;
  line-height: 1.8;
  margin: 0 0 0.9em;
  font-style: italic;
}
.sm-chapter-divider {
  border: none;
  border-top: 1px solid rgba(138, 110, 62, 0.3);
  margin: 40px 0 0;
}
.sm-print-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  background: rgba(200,169,110,0.12);
  border: 1px solid rgba(200,169,110,0.35);
  color: #c8a96e;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Arial Black', Impact, sans-serif;
  text-transform: uppercase;
  z-index: 100;
}
.sm-print-btn:hover {
  background: rgba(200,169,110,0.22);
}
.slog-story-mode-btn {
  border-style: dashed;
}
/* ── Print stylesheet ─────────────────────────────────────────────────── */
@media print {
  .no-print,
  .story-header,
  .story-controls,
  .story-footer,
  .story-hall,
  .story-brand {
    display: none !important;
  }
  body, html {
    background: #fff !important;
    color: #111 !important;
  }
  .sm-document {
    max-width: 100%;
    padding: 0;
  }
  .sm-title {
    color: #222 !important;
    font-size: 1.6rem;
  }
  .sm-subtitle {
    color: #555 !important;
  }
  .sm-top-divider,
  .sm-chapter-divider {
    border-top-color: #999 !important;
  }
  .sm-chapter-heading {
    color: #222 !important;
    page-break-after: avoid;
  }
  .sm-location {
    color: #666 !important;
  }
  .sm-p {
    color: #111 !important;
  }
  .sm-special .sm-p {
    color: #444 !important;
  }
  .sm-milestone {
    border-left-color: #999 !important;
  }
  .sm-milestone-p {
    color: #333 !important;
  }
  .story-page {
    background: #fff !important;
  }
}
</style>
</head>
<body>
<div class="story-page">
  ${printBtn}
  <header class="story-header ${isStoryMode ? 'no-print' : ''}">
    <div class="story-brand">⚔️ CHIP CHECK</div>
    <h1 class="story-title">The Emberstone Chronicles</h1>
    ${campaign ? `
    <div class="story-campaign-info">
      <span class="story-camp-label">Campaign ${campNum}</span>
      <span class="story-camp-dot">·</span>
      <span class="story-quest-day">Quest Day ${questDay}</span>
      <span class="story-camp-dot">·</span>
      <span class="story-entry-count">${totalEntries} chronicle ${totalEntries === 1 ? 'entry' : 'entries'}</span>
    </div>
    <div class="story-chapter-progress">
      ${chapterDots(chapterNow)}
    </div>` : ''}
  </header>

  <div class="story-controls no-print">
    <div class="slog-filters">
      ${filterBtn('all', 'All entries')}
      ${filterBtn('milestones', 'Milestones only')}
      ${filterBtn('pull', 'The Pull')}
      ${storyModeBtn}
    </div>
    <div class="slog-sorts">
      ${sortBtn('newest', 'Newest first')}
      ${sortBtn('oldest', 'Read from beginning')}
    </div>
  </div>

  ${mainContent}

  ${allCamps.length > 1 ? `
  <section class="story-hall no-print">
    <h2 class="story-hall-title">Hall of Campaigns</h2>
    <table class="story-hall-table">
      <thead>
        <tr><th>#</th><th>Campaign</th><th>Days</th><th>Streak</th><th>Outcome</th></tr>
      </thead>
      <tbody>
        ${allCamps.map(c => `
        <tr class="${!c.archived_at ? 'hall-active' : ''}">
          <td>${c.campaign_number}</td>
          <td>${c.title}</td>
          <td>${c.quest_days_reached != null ? c.quest_days_reached : (c.archived_at ? '—' : questDay)}</td>
          <td>${c.best_streak != null ? c.best_streak : '—'}</td>
          <td>${!c.archived_at ? '<span class="hall-active-badge">Active</span>' : (c.archive_reason === 'completed' ? '🏆 Completed' : '💀 Fallen')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </section>` : ''}

  <footer class="story-footer no-print">
    <a href="/" class="story-back-link">← Back to check-in</a>
  </footer>
</div>
</body>
</html>`;
}

module.exports = router;
