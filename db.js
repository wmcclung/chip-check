const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Schema & migrations ───────────────────────────────────────────────────────

async function addColumnIfMissing(table, col, definition) {
  // Postgres 9.6+ supports ADD COLUMN IF NOT EXISTS
  await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${definition}`);
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS checkins (
      id                SERIAL PRIMARY KEY,
      date              TEXT UNIQUE,
      status            TEXT DEFAULT 'pending',
      selfie_url        TEXT,
      checked_in_at     TEXT,
      streak_at_checkin INTEGER,
      notes             TEXT,
      checkin_time      TEXT,
      checkin_minutes   INTEGER
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS time_milestones (
      id              SERIAL PRIMARY KEY,
      milestone_key   TEXT UNIQUE,
      achieved_at     TEXT,
      checkin_minutes INTEGER
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id                 SERIAL PRIMARY KEY,
      campaign_number    INTEGER,
      title              TEXT,
      started_at         TEXT,
      completed_at       TEXT,
      archived_at        TEXT,
      archive_reason     TEXT,
      quest_days_reached INTEGER,
      best_streak        INTEGER,
      avg_wake_minutes   INTEGER
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quest_state (
      id                  SERIAL PRIMARY KEY,
      campaign_id         INTEGER REFERENCES campaigns(id),
      quest_day           INTEGER DEFAULT 0,
      quest_day_fraction  NUMERIC DEFAULT 0,
      lifetime_quest_days INTEGER DEFAULT 0,
      consecutive_misses  INTEGER DEFAULT 0,
      pending_regroup     INTEGER DEFAULT 0,
      story_log           JSONB   DEFAULT '[]',
      last_updated        TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quest_artifacts (
      id               SERIAL PRIMARY KEY,
      artifact_id      TEXT,
      campaign_id      INTEGER,
      quest_day_found  INTEGER,
      found_at         TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS friends (
      id               SERIAL PRIMARY KEY,
      name             TEXT,
      phone            TEXT UNIQUE,
      active           INTEGER DEFAULT 1,
      joined_at        TEXT,
      notify_success   INTEGER DEFAULT 1,
      notify_missed    INTEGER DEFAULT 1,
      notify_mode      TEXT DEFAULT 'realtime',
      digest_time      TEXT DEFAULT NULL,
      timezone         TEXT DEFAULT 'America/Chicago',
      last_digest_sent TEXT DEFAULT NULL,
      notify_sms       INTEGER DEFAULT 1,
      notify_email     INTEGER DEFAULT 0,
      email            TEXT DEFAULT NULL
    )
  `);

  // Partial unique index — allows multiple NULLs, enforces uniqueness for real addresses
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_friends_email ON friends(email) WHERE email IS NOT NULL
  `);

  // Safe column migrations for checkins
  await addColumnIfMissing('checkins', 'checkin_time',    'TEXT');
  await addColumnIfMissing('checkins', 'checkin_minutes', 'INTEGER');
  await addColumnIfMissing('checkins', 'quote_text',      'TEXT');
  await addColumnIfMissing('checkins', 'quote_speaker',   'TEXT');

  // quest_day on time_milestones
  await addColumnIfMissing('time_milestones', 'quest_day', 'INTEGER');

  // New quest_state columns for variant rotation and artifact tracking
  await addColumnIfMissing('quest_state', 'last_variant_ids', "JSONB DEFAULT '[]'");
  await addColumnIfMissing('quest_state', 'artifacts_found',  "JSONB DEFAULT '[]'");

  // Safe column migrations for databases that may predate the notification columns
  await addColumnIfMissing('friends', 'notify_success',   'INTEGER DEFAULT 1');
  await addColumnIfMissing('friends', 'notify_missed',    'INTEGER DEFAULT 1');
  await addColumnIfMissing('friends', 'notify_mode',      "TEXT DEFAULT 'realtime'");
  await addColumnIfMissing('friends', 'digest_time',      'TEXT DEFAULT NULL');
  await addColumnIfMissing('friends', 'timezone',         "TEXT DEFAULT 'America/Chicago'");
  await addColumnIfMissing('friends', 'last_digest_sent', 'TEXT DEFAULT NULL');
  await addColumnIfMissing('friends', 'notify_sms',       'INTEGER DEFAULT 1');
  await addColumnIfMissing('friends', 'notify_email',     'INTEGER DEFAULT 0');
  await addColumnIfMissing('friends', 'email',            'TEXT DEFAULT NULL');

  // Seed default settings (do nothing if they already exist)
  const seeds = [
    ['checkin_open_hour',    process.env.CHECKIN_OPEN_HOUR    || '4'],
    ['checkin_deadline_hour', process.env.CHECKIN_DEADLINE_HOUR || '9'],
    ['primary_user_name',    process.env.PRIMARY_USER_NAME    || 'Jake'],
    ['admin_password',       process.env.ADMIN_PASSWORD       || 'changeme'],
    ['best_streak',          '0'],
    ['wake_goal_time',       '420'],   // 7:00 AM in minutes
    ['chip_phone',           ''],
    ['chip_email',           ''],
  ];
  for (const [key, value] of seeds) {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value]
    );
  }

  // Initialize campaign 1 if none exist yet
  const campaignCount = await pool.query('SELECT COUNT(*) FROM campaigns');
  if (parseInt(campaignCount.rows[0].count, 10) === 0) {
    const campaignRes = await pool.query(
      `INSERT INTO campaigns (campaign_number, title, started_at)
       VALUES (1, 'The Emberstone Chronicles', $1)
       RETURNING id`,
      [new Date().toISOString()]
    );
    await pool.query(
      `INSERT INTO quest_state
         (campaign_id, quest_day, quest_day_fraction, lifetime_quest_days,
          consecutive_misses, pending_regroup, story_log, last_updated)
       VALUES ($1, 0, 0, 0, 0, 0, '[]', $2)`,
      [campaignRes.rows[0].id, new Date().toISOString()]
    );
    console.log('[DB] Campaign 1 initialized');
  }

  // Seed quest day to 3 if it's still at 0
  // Chip had 3 real check-ins before the quest system launched (Apr 7, 8, 9)
  const qsSeed = await pool.query(
    'SELECT quest_day FROM quest_state ORDER BY id DESC LIMIT 1'
  );
  if (qsSeed.rows[0] && qsSeed.rows[0].quest_day === 0) {
    const realCheckins = await pool.query(
      `SELECT COUNT(*) FROM checkins
       WHERE status = 'success'
       AND date <= '2026-04-09'`
    );
    const realCount = parseInt(realCheckins.rows[0].count, 10);
    if (realCount >= 3) {
      await pool.query(
        `UPDATE quest_state SET
           quest_day = 3,
           lifetime_quest_days = 3,
           last_updated = $1
         WHERE id = (SELECT id FROM quest_state ORDER BY id DESC LIMIT 1)`,
        [new Date().toISOString()]
      );
      console.log('[DB] Quest day seeded to 3 — reflecting pre-launch check-ins');
    }
  }

  // Seed today's check-in for 2026-04-09 (safe to run multiple times)
  await pool.query(
    `INSERT INTO checkins (date, status, checked_in_at, checkin_time, checkin_minutes, quote_text, quote_speaker, selfie_url)
     VALUES ('2026-04-09', 'success', '2026-04-09T08:37:00', '8:37 AM', 517,
       'All we have to decide is what to do with the time that is given us.',
       'Gandalf',
       'https://res.cloudinary.com/dqny3plza/image/upload/v1775741864/morning-accountability/rdol3b8argi6n2qo1exc.jpg')
     ON CONFLICT (date) DO UPDATE SET
       checkin_time    = COALESCE(checkins.checkin_time,    EXCLUDED.checkin_time),
       checkin_minutes = COALESCE(checkins.checkin_minutes, EXCLUDED.checkin_minutes),
       quote_text      = COALESCE(checkins.quote_text,      EXCLUDED.quote_text),
       quote_speaker   = COALESCE(checkins.quote_speaker,   EXCLUDED.quote_speaker),
       selfie_url      = COALESCE(NULLIF(checkins.selfie_url, ''), EXCLUDED.selfie_url)`
  );

  console.log('[DB] Initialized');
}

// ── Settings helpers ──────────────────────────────────────────────────────────

async function getSetting(key) {
  const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0] ? result.rows[0].value : null;
}

async function setSetting(key, value) {
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    [key, String(value)]
  );
}

// ── Streak logic ──────────────────────────────────────────────────────────────

/**
 * Count consecutive days (most-recent first) with status 'success' or 'skipped'.
 * 'pending' days are skipped over (don't count, don't break).
 * 'missed' days break the streak.
 */
async function getCurrentStreak() {
  const result = await pool.query(
    "SELECT date, status FROM checkins ORDER BY date DESC"
  );
  const rows = result.rows;

  let streak = 0;
  for (const row of rows) {
    if (row.status === 'success') {
      streak++;
    } else if (row.status === 'skipped') {
      continue;
    } else if (row.status === 'missed') {
      break;
    } else {
      // pending — skip over
      continue;
    }
  }
  return streak;
}

// ── Checkin helpers ───────────────────────────────────────────────────────────

async function getTodayCheckin(dateStr) {
  const result = await pool.query('SELECT * FROM checkins WHERE date = $1', [dateStr]);
  return result.rows[0] || null;
}

async function getRecentCheckins(limit = 30) {
  const result = await pool.query(
    'SELECT * FROM checkins ORDER BY date DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

async function insertCheckin(dateStr, status) {
  await pool.query(
    'INSERT INTO checkins (date, status) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING',
    [dateStr, status]
  );
}

async function updateCheckin(dateStr, fields) {
  const keys = Object.keys(fields);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => fields[k]);
  values.push(dateStr);
  await pool.query(
    `UPDATE checkins SET ${setClause} WHERE date = $${keys.length + 1}`,
    values
  );
}

async function getLastResolvedCheckin() {
  const result = await pool.query(
    "SELECT date FROM checkins WHERE status IN ('success','missed','skipped') ORDER BY date DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

// ── Friends helpers ───────────────────────────────────────────────────────────

async function getActiveFriends() {
  const result = await pool.query('SELECT * FROM friends WHERE active = 1');
  return result.rows;
}

async function getAllFriends() {
  const result = await pool.query('SELECT * FROM friends ORDER BY joined_at DESC');
  return result.rows;
}

async function getDigestFriends() {
  const result = await pool.query(
    "SELECT * FROM friends WHERE active = 1 AND notify_mode = 'digest'"
  );
  return result.rows;
}

async function upsertFriend(name, phone, prefs = {}) {
  const {
    notify_success = 1,
    notify_missed  = 1,
    notify_mode    = 'realtime',
    digest_time    = null,
    timezone       = 'America/Chicago',
    notify_sms     = phone ? 1 : 0,
    notify_email   = 0,
    email          = null,
  } = prefs;

  // Look up existing record by phone first, then by email
  let existing = null;
  if (phone) {
    const r = await pool.query('SELECT * FROM friends WHERE phone = $1', [phone]);
    existing = r.rows[0] || null;
  }
  if (!existing && email) {
    const r = await pool.query('SELECT * FROM friends WHERE email = $1', [email]);
    existing = r.rows[0] || null;
  }

  if (existing) {
    await pool.query(
      `UPDATE friends SET active = 1, name = $1,
         phone = $2, email = $3,
         notify_success = $4, notify_missed = $5, notify_mode = $6,
         digest_time = $7, timezone = $8, notify_sms = $9, notify_email = $10
       WHERE id = $11`,
      [
        name,
        phone ?? existing.phone, email ?? existing.email,
        notify_success, notify_missed, notify_mode,
        digest_time, timezone, notify_sms, notify_email,
        existing.id,
      ]
    );
    const r = await pool.query('SELECT * FROM friends WHERE id = $1', [existing.id]);
    return r.rows[0];
  }

  const r = await pool.query(
    `INSERT INTO friends
       (name, phone, email, active, joined_at,
        notify_success, notify_missed, notify_mode,
        digest_time, timezone, notify_sms, notify_email)
     VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      name, phone, email, new Date().toISOString(),
      notify_success, notify_missed, notify_mode,
      digest_time, timezone, notify_sms, notify_email,
    ]
  );
  return r.rows[0];
}

async function updateFriendPrefs(id, prefs) {
  const {
    notify_success,
    notify_missed,
    notify_mode,
    digest_time,
    timezone,
    notify_sms,
    notify_email,
    email,
  } = prefs;
  await pool.query(
    `UPDATE friends SET
       notify_success = $1, notify_missed = $2, notify_mode = $3,
       digest_time = $4, timezone = $5,
       notify_sms = $6, notify_email = $7, email = $8
     WHERE id = $9`,
    [
      notify_success, notify_missed, notify_mode,
      digest_time || null, timezone,
      notify_sms, notify_email, email || null,
      id,
    ]
  );
}

async function updateFriendDigestSent(id, dateStr) {
  await pool.query('UPDATE friends SET last_digest_sent = $1 WHERE id = $2', [dateStr, id]);
}

async function removeFriend(id) {
  await pool.query('UPDATE friends SET active = 0 WHERE id = $1', [id]);
}

async function getFriendById(id) {
  const result = await pool.query('SELECT * FROM friends WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// ── Miss stat helpers ─────────────────────────────────────────────────────────

async function getMissStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  const [totalRes, missRes, miss30Res] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM checkins WHERE status IN ('success','missed')"),
    pool.query("SELECT COUNT(*) FROM checkins WHERE status = 'missed'"),
    pool.query("SELECT COUNT(*) FROM checkins WHERE status = 'missed' AND date >= $1", [cutoff]),
  ]);

  const totalDays    = parseInt(totalRes.rows[0].count, 10);
  const allTimeMisses = parseInt(missRes.rows[0].count, 10);
  const last30Misses  = parseInt(miss30Res.rows[0].count, 10);
  const missPercent   = totalDays > 0 ? Math.round((allTimeMisses / totalDays) * 100) : 0;

  return { totalDays, allTimeMisses, last30Misses, missPercent };
}

// ── Wake-time stat helpers ────────────────────────────────────────────────────

/**
 * Returns all successful checkins that have checkin_minutes, ordered newest first.
 * Used to compute averages, personal best, and trend.
 */
async function getWakeStats() {
  const result = await pool.query(
    `SELECT date, checkin_time, checkin_minutes
     FROM checkins
     WHERE status = 'success' AND checkin_minutes IS NOT NULL
     ORDER BY date DESC`
  );
  return result.rows;
}

// ── Time milestone helpers ────────────────────────────────────────────────────

async function getTimeMilestones() {
  const result = await pool.query('SELECT * FROM time_milestones ORDER BY achieved_at ASC');
  return result.rows;
}

async function hasTimeMilestone(key) {
  const result = await pool.query('SELECT 1 FROM time_milestones WHERE milestone_key = $1', [key]);
  return result.rows.length > 0;
}

async function insertTimeMilestone(key, checkinMinutes) {
  await pool.query(
    `INSERT INTO time_milestones (milestone_key, achieved_at, checkin_minutes)
     VALUES ($1, $2, $3)
     ON CONFLICT (milestone_key) DO NOTHING`,
    [key, new Date().toISOString(), checkinMinutes]
  );
}

// ── Quest state helpers ───────────────────────────────────────────────────────

async function getQuestState() {
  const result = await pool.query('SELECT * FROM quest_state ORDER BY id DESC LIMIT 1');
  return result.rows[0] || null;
}

async function getCurrentCampaign() {
  const result = await pool.query(
    'SELECT * FROM campaigns WHERE archived_at IS NULL ORDER BY id DESC LIMIT 1'
  );
  return result.rows[0] || null;
}

async function updateQuestState(fields) {
  const qs = await pool.query('SELECT id FROM quest_state ORDER BY id DESC LIMIT 1');
  if (!qs.rows[0]) return;
  const id   = qs.rows[0].id;
  const keys = Object.keys(fields);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const JSONB_FIELDS = new Set(['story_log', 'last_variant_ids', 'artifacts_found']);
  const values    = keys.map(k => {
    if (JSONB_FIELDS.has(k)) return JSON.stringify(fields[k]);
    return fields[k];
  });
  values.push(id);
  await pool.query(
    `UPDATE quest_state SET ${setClause} WHERE id = $${keys.length + 1}`,
    values
  );
}

async function archiveCampaign(campaignId, reason, stats = {}) {
  const { questDaysReached = 0, bestStreak = 0, avgWakeMinutes = null } = stats;
  await pool.query(
    `UPDATE campaigns SET
       archived_at = $1, archive_reason = $2,
       quest_days_reached = $3, best_streak = $4, avg_wake_minutes = $5
     WHERE id = $6`,
    [new Date().toISOString(), reason, questDaysReached, bestStreak, avgWakeMinutes, campaignId]
  );
}

async function createNewCampaign(campaignNumber) {
  const campaignRes = await pool.query(
    `INSERT INTO campaigns (campaign_number, title, started_at)
     VALUES ($1, 'The Emberstone Chronicles', $2)
     RETURNING id`,
    [campaignNumber, new Date().toISOString()]
  );
  const newCampaignId = campaignRes.rows[0].id;
  // Reset quest_state but preserve lifetime_quest_days AND story_log (full chronicle)
  await pool.query(
    `UPDATE quest_state SET
       campaign_id        = $1,
       quest_day          = 0,
       quest_day_fraction = 0,
       consecutive_misses = 0,
       pending_regroup    = 1,
       last_updated       = $2
     WHERE id = (SELECT id FROM quest_state ORDER BY id DESC LIMIT 1)`,
    [newCampaignId, new Date().toISOString()]
  );
  return newCampaignId;
}

async function getArchivedCampaigns() {
  const result = await pool.query(
    'SELECT * FROM campaigns WHERE archived_at IS NOT NULL ORDER BY id DESC'
  );
  return result.rows;
}

async function getAllCampaigns() {
  const result = await pool.query('SELECT * FROM campaigns ORDER BY id ASC');
  return result.rows;
}

// ── Quest artifact helpers ─────────────────────────────────────────────────────

async function insertQuestArtifact(artifactId, campaignId, questDay) {
  await pool.query(
    `INSERT INTO quest_artifacts (artifact_id, campaign_id, quest_day_found, found_at)
     VALUES ($1, $2, $3, $4)`,
    [artifactId, campaignId, questDay, new Date().toISOString()]
  );
}

async function getQuestArtifacts(campaignId) {
  const result = await pool.query(
    'SELECT * FROM quest_artifacts WHERE campaign_id = $1 ORDER BY quest_day_found ASC',
    [campaignId]
  );
  return result.rows;
}

module.exports = {
  pool,
  init,
  getSetting,
  setSetting,
  getCurrentStreak,
  getTodayCheckin,
  getRecentCheckins,
  insertCheckin,
  updateCheckin,
  getLastResolvedCheckin,
  getActiveFriends,
  getAllFriends,
  getDigestFriends,
  upsertFriend,
  updateFriendPrefs,
  updateFriendDigestSent,
  removeFriend,
  getFriendById,
  getWakeStats,
  getMissStats,
  getTimeMilestones,
  hasTimeMilestone,
  insertTimeMilestone,
  getQuestState,
  getCurrentCampaign,
  updateQuestState,
  archiveCampaign,
  createNewCampaign,
  getArchivedCampaigns,
  getAllCampaigns,
  insertQuestArtifact,
  getQuestArtifacts,
};
