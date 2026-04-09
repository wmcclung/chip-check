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
};
