const twilio = require('twilio');
const { DateTime } = require('luxon');

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const FROM = () => process.env.TWILIO_PHONE_NUMBER;

/**
 * Send a plain SMS to a single phone number.
 */
async function sendSMS(to, body) {
  const client = getClient();
  return client.messages.create({ from: FROM(), to, body });
}

/**
 * Send an MMS with an image to a single phone number.
 */
async function sendMMS(to, body, mediaUrl) {
  const client = getClient();
  return client.messages.create({ from: FROM(), to, body, mediaUrl: [mediaUrl] });
}

/**
 * Broadcast a shame SMS to real-time friends who opted in to missed notifications.
 * Logs errors but does NOT throw — check-in flow must survive SMS failures.
 */
async function broadcastShame(friends, name) {
  const body = `❌ ${name} missed his check-in today. Streak reset to 0. Shame him accordingly.`;
  const targets = friends.filter(f => f.notify_mode === 'realtime' && f.notify_missed !== 0 && f.notify_sms !== 0 && f.phone);
  for (const friend of targets) {
    try {
      await sendSMS(friend.phone, body);
    } catch (err) {
      console.error(`[SMS] Failed to send shame to ${friend.phone}:`, err.message);
    }
  }
}

/**
 * Broadcast a success MMS (with selfie) to real-time friends who opted in to success notifications.
 * Logs errors but does NOT throw.
 */
async function broadcastSuccess(friends, name, streak, selfieUrl) {
  const body = `✅ ${name} checked in! Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥`;
  const targets = friends.filter(f => f.notify_mode === 'realtime' && f.notify_success !== 0 && f.notify_sms !== 0 && f.phone);
  for (const friend of targets) {
    try {
      if (selfieUrl) {
        await sendMMS(friend.phone, body, selfieUrl);
      } else {
        await sendSMS(friend.phone, body);
      }
    } catch (err) {
      console.error(`[SMS] Failed to send success to ${friend.phone}:`, err.message);
    }
  }
}

/**
 * Send a digest message to a single digest-mode friend.
 * todayCheckin: the checkin row for today (may be null/pending/success/missed/skipped).
 * deadlineHour: the configured deadline hour in CT (integer).
 */
async function sendDigest(friend, name, todayCheckin, deadlineHour) {
  if (!friend.phone || friend.notify_sms === 0) return;
  try {
    const ctNow = DateTime.now().setZone('America/Chicago');
    const windowOpen = ctNow.hour < deadlineHour;

    const status = todayCheckin ? todayCheckin.status : null;

    if (!status || status === 'pending') {
      if (windowOpen) {
        // Still time to check in — always send this regardless of notify prefs
        const deadlineLabel = deadlineHour <= 12
          ? `${deadlineHour} AM`
          : `${deadlineHour - 12} PM`;
        await sendSMS(friend.phone, `⏳ ${name} hasn't checked in yet. Deadline is ${deadlineLabel} CT.`);
      } else {
        // Past deadline but row not yet marked missed; treat as missed
        if (friend.notify_missed !== 0) {
          await sendSMS(friend.phone, `❌ ${name} missed his check-in today. Streak reset to 0. Shame him accordingly.`);
        }
      }
      return;
    }

    if (status === 'success' && friend.notify_success !== 0) {
      const streak = todayCheckin.streak_at_checkin || 0;
      const body = `✅ ${name} checked in! Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥`;
      if (todayCheckin.selfie_url) {
        await sendMMS(friend.phone, body, todayCheckin.selfie_url);
      } else {
        await sendSMS(friend.phone, body);
      }
      return;
    }

    if (status === 'missed' && friend.notify_missed !== 0) {
      await sendSMS(friend.phone, `❌ ${name} missed his check-in today. Streak reset to 0. Shame him accordingly.`);
      return;
    }

    // skipped, or notify prefs don't apply — send nothing
  } catch (err) {
    console.error(`[SMS] Failed to send digest to ${friend.phone}:`, err.message);
  }
}

/**
 * Send a test SMS to a single friend.
 */
async function sendTestSMS(phone) {
  return sendSMS(phone, '👋 Test message from Morning Accountability App. You\'re opted in!');
}

module.exports = { sendSMS, sendMMS, broadcastShame, broadcastSuccess, sendDigest, sendTestSMS };
