const { Resend } = require('resend');
const { DateTime } = require('luxon');
const { getSuccessQuote, getFailureQuote } = require('./quotes');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL;

// ── HTML email shell ──────────────────────────────────────────────────────────

function emailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body,table,td,p,a { -webkit-text-size-adjust:100%; box-sizing:border-box; }
  body { margin:0; padding:0; background:#0a0a0f; font-family:Georgia,'Times New Roman',serif; color:#f0e8d8; }
  .outer { background:#0a0a0f; padding:32px 16px; }
  .container { max-width:520px; margin:0 auto; }
  .brand { font-family:'Arial Black',Impact,sans-serif; font-size:0.9rem; letter-spacing:0.25em; color:#8a6e3e; margin-bottom:28px; }
  h1 { font-family:'Arial Black',Impact,sans-serif; font-size:1.5rem; color:#c8a96e; letter-spacing:0.08em; margin:0 0 24px; line-height:1.2; }
  p { margin:0 0 16px; line-height:1.6; color:#f0e8d8; }
  .selfie { display:block; width:100%; max-width:400px; margin:0 auto 28px; border-radius:4px; border:2px solid #8a6e3e; }
  .streak-block { text-align:center; margin:24px 0; }
  .streak-num { font-family:'Arial Black',Impact,sans-serif; font-size:3.5rem; color:#c8a96e; line-height:1; }
  .streak-label { color:#8a6e3e; font-size:0.8rem; letter-spacing:0.2em; text-transform:uppercase; margin-top:6px; }
  .quote-block { border-left:3px solid #8a6e3e; padding:12px 18px; margin:24px 0; background:rgba(200,169,110,0.05); border-radius:0 4px 4px 0; }
  .quote-text { font-style:italic; color:#c8a96e; margin:0 0 8px; }
  .quote-cite { font-size:0.82rem; color:#8a6e3e; font-style:normal; }
  .shame-box { background:rgba(139,0,0,0.2); border:1px solid #8b0000; padding:16px 20px; border-radius:4px; margin:24px 0; }
  .shame-box p { color:#f0e8d8; margin:0; }
  .checkin-time-email { font-size:1.1rem; color:#c8a96e; margin:0 0 16px; }
  .milestone-unlock-box { background:rgba(200,169,110,0.08); border:1px solid rgba(200,169,110,0.35); border-radius:6px; padding:16px 20px; margin:24px 0; }
  .milestone-unlock-label { font-family:'Arial Black',Impact,sans-serif; font-size:0.72rem; letter-spacing:0.2em; color:#8a6e3e; text-transform:uppercase; margin-bottom:8px; }
  .milestone-unlock-badge { font-family:'Arial Black',Impact,sans-serif; font-size:1.1rem; color:#c8a96e; letter-spacing:0.06em; }
  .stats-snapshot { width:100%; border-collapse:collapse; margin:20px 0; }
  .stat-cell { text-align:center; padding:10px 4px; border:1px solid rgba(200,169,110,0.15); }
  .stat-val { font-family:'Arial Black',Impact,sans-serif; font-size:1rem; color:#c8a96e; }
  .stat-lbl { font-size:0.68rem; color:#8a6e3e; text-transform:uppercase; letter-spacing:0.08em; margin-top:4px; }
  .footer { color:#5a5a6e; font-size:11px; margin-top:36px; border-top:1px solid #1e1e2a; padding-top:16px; line-height:1.7; }
</style>
</head>
<body>
<div class="outer">
  <div class="container">
    <div class="brand">⚔️ CHIP CHECK</div>
    ${bodyHtml}
    <div class="footer">
      You're receiving this because you opted in at Chip Check.<br>
      To unsubscribe, reply to this email or contact the admin.
    </div>
  </div>
</div>
</body>
</html>`;
}

async function send(to, subject, html) {
  console.log('[EMAIL] Attempting send to:', to);
  console.log('[EMAIL] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
  console.log('[EMAIL] RESEND_FROM_EMAIL set:', !!process.env.RESEND_FROM_EMAIL);
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error('[EMAIL] Send failed to', to, ':', error.message || JSON.stringify(error));
      throw new Error(error.message || JSON.stringify(error));
    }
    console.log('[EMAIL] Sent successfully to', to, 'ID:', data.id);
    return data;
  } catch (err) {
    console.error('[EMAIL] Send failed to', to, ':', err.message);
    throw err;
  }
}

// ── Single-friend senders ─────────────────────────────────────────────────────

async function sendSuccessEmail(friend, name, selfieUrl, streak, extras = {}) {
  if (!friend.email) return;
  const { checkinTime, wakeStats, newMilestones = [], quote: storedQuote } = extras;
  const quote = storedQuote || getSuccessQuote(streak);

  // ── Milestone unlock section ──────────────────────────────────────────────
  let milestoneSection = '';
  if (newMilestones.length > 0) {
    const tm = newMilestones[0];
    milestoneSection = `
      <div class="milestone-unlock-box">
        <div class="milestone-unlock-label">🏅 MILESTONE UNLOCKED</div>
        <div class="milestone-unlock-badge">${tm.badge}</div>
        <div class="quote-block" style="margin-top:0.75rem">
          <p class="quote-text">"${tm.text}"</p>
          <p class="quote-cite">— ${tm.speaker}</p>
        </div>
      </div>`;
  }

  // ── Wake stats snapshot ───────────────────────────────────────────────────
  let statsSection = '';
  if (wakeStats) {
    const { avg7, avg30, avgAll, personalBest } = wakeStats;
    const fmt = (m) => {
      if (m == null) return '—';
      const h = Math.floor(m / 60), min = m % 60;
      const ap = h < 12 ? 'AM' : 'PM';
      const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${dh}:${String(min).padStart(2, '0')} ${ap}`;
    };
    statsSection = `
      <table class="stats-snapshot" cellpadding="0" cellspacing="0">
        <tr>
          <td class="stat-cell"><div class="stat-val">${fmt(avg7)}</div><div class="stat-lbl">7-day avg</div></td>
          <td class="stat-cell"><div class="stat-val">${fmt(avg30)}</div><div class="stat-lbl">30-day avg</div></td>
          <td class="stat-cell"><div class="stat-val">${fmt(avgAll)}</div><div class="stat-lbl">all-time avg</div></td>
          <td class="stat-cell"><div class="stat-val">${personalBest ? fmt(personalBest.checkin_minutes) : '—'}</div><div class="stat-lbl">personal best</div></td>
        </tr>
      </table>`;
  }

  const html = emailHtml(`
    <h1>✅ ${name} checked in!</h1>
    ${checkinTime ? `<p class="checkin-time-email">Today: <strong>${checkinTime}</strong></p>` : ''}
    ${selfieUrl ? `<img class="selfie" src="${selfieUrl}" alt="Today's selfie">` : ''}
    <div class="streak-block">
      <div class="streak-num">🔥 ${streak}</div>
      <div class="streak-label">day streak</div>
    </div>
    ${milestoneSection}
    ${statsSection}
    <div class="quote-block">
      <p class="quote-text">"${quote.text}"</p>
      <p class="quote-cite">— ${quote.speaker}</p>
    </div>
  `);
  try {
    await send(friend.email, `✅ ${name} checked in! Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥`, html);
  } catch (err) {
    console.error(`[EMAIL] Failed to send success to ${friend.email}:`, err.message);
  }
}

async function sendMissedEmail(friend, name) {
  if (!friend.email) return;
  const quote = getFailureQuote();
  const html = emailHtml(`
    <h1>❌ ${name} missed his check-in today.</h1>
    <div class="shame-box"><p>Streak reset to 0. Shame him accordingly.</p></div>
    <div class="quote-block">
      <p class="quote-text">"${quote.text}"</p>
      <p class="quote-cite">— ${quote.speaker}</p>
    </div>
  `);
  try {
    await send(friend.email, `❌ ${name} missed his check-in today`, html);
  } catch (err) {
    console.error(`[EMAIL] Failed to send missed to ${friend.email}:`, err.message);
  }
}

async function sendTestEmail(friend, name) {
  if (!friend.email) return;
  const html = emailHtml(`
    <h1>👋 You're opted in!</h1>
    <p>This is a test email from Chip Check. You'll receive updates when ${name} checks in.</p>
  `);
  try {
    await send(friend.email, '👋 Test email from Chip Check', html);
  } catch (err) {
    console.error(`[EMAIL] Failed to send test to ${friend.email}:`, err.message);
  }
}

async function sendDigestEmail(friend, name, todayCheckin, deadlineHour) {
  if (!friend.email || friend.notify_email === 0) return;
  const ctNow = DateTime.now().setZone('America/Chicago');
  const windowOpen = ctNow.hour < deadlineHour;
  const status = todayCheckin ? todayCheckin.status : null;

  if (!status || status === 'pending') {
    if (windowOpen) {
      const deadlineLabel = deadlineHour <= 12 ? `${deadlineHour} AM` : `${deadlineHour - 12} PM`;
      const html = emailHtml(`
        <h1>⏳ ${name} hasn't checked in yet.</h1>
        <p>Deadline is ${deadlineLabel} CT. No news yet — check back soon.</p>
      `);
      try {
        await send(friend.email, `⏳ ${name} hasn't checked in yet — deadline ${deadlineLabel} CT`, html);
      } catch (err) {
        console.error(`[EMAIL] Failed to send digest to ${friend.email}:`, err.message);
      }
    } else if (friend.notify_missed !== 0) {
      await sendMissedEmail(friend, name);
    }
    return;
  }

  if (status === 'success' && friend.notify_success !== 0) {
    const extras = todayCheckin.quote_text
      ? { quote: { text: todayCheckin.quote_text, speaker: todayCheckin.quote_speaker } }
      : {};
    await sendSuccessEmail(friend, name, todayCheckin.selfie_url, todayCheckin.streak_at_checkin || 0, extras);
    return;
  }

  if (status === 'missed' && friend.notify_missed !== 0) {
    await sendMissedEmail(friend, name);
    return;
  }
  // skipped or notify prefs don't apply — send nothing
}

// ── Broadcast helpers ─────────────────────────────────────────────────────────

async function broadcastSuccessEmail(friends, name, selfieUrl, streak, extras = {}) {
  const targets = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_success !== 0);
  for (const friend of targets) {
    await sendSuccessEmail(friend, name, selfieUrl, streak, extras);
  }
}

async function broadcastShameEmail(friends, name) {
  const targets = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_missed !== 0);
  for (const friend of targets) {
    await sendMissedEmail(friend, name);
  }
}

module.exports = {
  sendSuccessEmail,
  sendMissedEmail,
  sendTestEmail,
  sendDigestEmail,
  broadcastSuccessEmail,
  broadcastShameEmail,
};
