const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');
const { getSuccessQuote, getFailureQuote } = require('./quotes');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = () => process.env.GMAIL_USER;

function sendWithTimeout(mailOptions, timeoutMs = 10000) {
  return Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email send timed out after ' + timeoutMs + 'ms')), timeoutMs)
    ),
  ]);
}

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
  console.log('[EMAIL] GMAIL_USER set:', !!process.env.GMAIL_USER);
  console.log('[EMAIL] GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD);
  try {
    const result = await sendWithTimeout({ from: FROM(), to, subject, html });
    console.log('[EMAIL] Sent successfully to', to, 'MessageId:', result.messageId);
    return result;
  } catch (err) {
    console.error('[EMAIL] Send failed to', to, ':', err.message);
    throw err;
  }
}

// ── Single-friend senders ─────────────────────────────────────────────────────

async function sendSuccessEmail(friend, name, selfieUrl, streak) {
  if (!friend.email) return;
  const quote = getSuccessQuote(streak);
  const html = emailHtml(`
    <h1>✅ ${name} checked in!</h1>
    ${selfieUrl ? `<img class="selfie" src="${selfieUrl}" alt="Today's selfie">` : ''}
    <div class="streak-block">
      <div class="streak-num">🔥 ${streak}</div>
      <div class="streak-label">day streak</div>
    </div>
    <div class="quote-block">
      <p class="quote-text">"${quote.text}"</p>
      <p class="quote-cite">— ${quote.speaker}</p>
    </div>
  `);
  try {
    await send(friend.email, `✅ ${name} checked in! Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥`, html);
  } catch (err) {
    console.error(`[Email] Failed to send success to ${friend.email}:`, err.message);
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
    console.error(`[Email] Failed to send missed to ${friend.email}:`, err.message);
  }
}

async function sendTestEmail(friend, name) {
  if (!friend.email) return;
  const html = emailHtml(`
    <h1>👋 You're opted in!</h1>
    <p>This is a test email from Chip Check. You'll receive updates when ${name} checks in.</p>
  `);
  return send(friend.email, '👋 Test email from Chip Check', html);
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
        console.error(`[Email] Failed to send digest to ${friend.email}:`, err.message);
      }
    } else if (friend.notify_missed !== 0) {
      await sendMissedEmail(friend, name);
    }
    return;
  }

  if (status === 'success' && friend.notify_success !== 0) {
    await sendSuccessEmail(friend, name, todayCheckin.selfie_url, todayCheckin.streak_at_checkin || 0);
    return;
  }

  if (status === 'missed' && friend.notify_missed !== 0) {
    await sendMissedEmail(friend, name);
    return;
  }
  // skipped or notify prefs don't apply — send nothing
}

// ── Broadcast helpers ─────────────────────────────────────────────────────────

async function broadcastSuccessEmail(friends, name, selfieUrl, streak) {
  const targets = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_success !== 0);
  for (const friend of targets) {
    await sendSuccessEmail(friend, name, selfieUrl, streak);
  }
}

async function broadcastShameEmail(friends, name) {
  const targets = friends.filter(f => f.notify_email !== 0 && f.email && f.notify_missed !== 0);
  for (const friend of targets) {
    await sendMissedEmail(friend, name);
  }
}

module.exports = {
  transporter,
  sendSuccessEmail,
  sendMissedEmail,
  sendTestEmail,
  sendDigestEmail,
  broadcastSuccessEmail,
  broadcastShameEmail,
};
