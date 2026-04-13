'use strict';

const express = require('express');
const router  = express.Router();

const { getQuestState, getCurrentCampaign, getAllCampaigns, getQuestArtifacts } = require('../db');
const { ARTIFACTS } = require('../quest');

// ── Helpers ───────────────────────────────────────────────────────────────────

function emberSvg(level) {
  // level 1-5, rendered as a small inline SVG flame
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

// ── GET /story ────────────────────────────────────────────────────────────────

router.get('/story', async (req, res) => {
  try {
    const qs       = await getQuestState();
    const campaign = await getCurrentCampaign();
    const allCamps = await getAllCampaigns();

    if (!qs || !campaign) {
      return res.send(storyPage({ entries: [], filter: 'all', sort: 'newest', campaign: null, allCamps: [] }));
    }

    const rawLog = Array.isArray(qs.story_log) ? qs.story_log : [];
    const filter = req.query.filter || 'all';
    const sort   = req.query.sort   || 'newest';

    let entries = rawLog.filter(e => {
      if (filter === 'milestones') return !!e.milestone_text;
      if (filter === 'pull')       return !!e.pull_appears;
      return true;
    });

    if (sort === 'oldest') {
      entries = [...entries].reverse();
    }

    // Artifact data for current campaign
    const artifactRows = await getQuestArtifacts(campaign.id);
    const foundArtifactIds = artifactRows.map(r => r.artifact_id);

    res.send(storyPage({ entries, filter, sort, campaign, allCamps, qs, foundArtifactIds }));
  } catch (err) {
    console.error('[GET /story]', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// ── Page renderer ─────────────────────────────────────────────────────────────

function storyPage({ entries, filter, sort, campaign, allCamps, qs, foundArtifactIds = [] }) {
  const totalEntries = qs ? (Array.isArray(qs.story_log) ? qs.story_log.length : 0) : 0;

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

    const paragraphs = (e.daily_text || '').split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim().replace(/\n\s*/g, ' ')}</p>`)
      .join('');

    let specialsHtml = '';
    if (Array.isArray(e.specials) && e.specials.length > 0) {
      specialsHtml = e.specials.map(s => `
        <div class="slog-special">
          ${s.title ? `<div class="slog-special-title">${s.title}</div>` : ''}
          ${(s.text || '').split('\n\n').filter(p=>p.trim()).map(p=>`<p>${p.trim().replace(/\n\s*/g,' ')}</p>`).join('')}
        </div>`).join('');
    }

    let milestoneHtml = '';
    if (isMilestone) {
      const mParas = (e.milestone_text || '').split('\n\n')
        .filter(p => p.trim())
        .map(p => `<p>${p.trim().replace(/\n\s*/g, ' ')}</p>`)
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

  const entriesHtml = entries.length > 0
    ? entries.map(entryCard).join('\n')
    : '<p class="slog-empty">No entries yet.</p>';

  const filterBtn = (val, label) => `
    <a href="/story?filter=${val}&sort=${sort}" class="slog-filter-btn ${filter === val ? 'active' : ''}">${label}</a>`;
  const sortBtn = (val, label) => `
    <a href="/story?filter=${filter}&sort=${val}" class="slog-sort-btn ${sort === val ? 'active' : ''}">${label}</a>`;

  // Current campaign header
  const campNum   = campaign ? campaign.campaign_number : '—';
  const questDay  = qs ? qs.quest_day : 0;
  const chapterNow = Math.min(Math.ceil(questDay / 5), 12);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Emberstone Chronicles</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="story-page">
  <header class="story-header">
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

  <div class="story-controls">
    <div class="slog-filters">
      ${filterBtn('all', 'All entries')}
      ${filterBtn('milestones', 'Milestones only')}
      ${filterBtn('pull', 'The Pull')}
    </div>
    <div class="slog-sorts">
      ${sortBtn('newest', 'Newest first')}
      ${sortBtn('oldest', 'Read from beginning')}
    </div>
  </div>

  <div class="story-entries">
    ${entriesHtml}
  </div>

  ${allCamps.length > 1 ? `
  <section class="story-hall">
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

  <footer class="story-footer">
    <a href="/" class="story-back-link">← Back to check-in</a>
  </footer>
</div>
</body>
</html>`;
}

module.exports = router;
