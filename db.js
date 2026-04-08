const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'db.sqlite'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    date              TEXT UNIQUE,
    status            TEXT DEFAULT 'pending',
    selfie_url        TEXT,
    checked_in_at     TEXT,
    streak_at_checkin INTEGER,
    notes             TEXT
  );

  CREATE TABLE IF NOT EXISTS friends (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT,
    phone     TEXT UNIQUE,
    active    INTEGER DEFAULT 1,
    joined_at TEXT
  );
`);

// ── Migrate friends table: add notification preference columns ─────────────────

function addColumnIfMissing(table, col, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find(c => c.name === col)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`).run();
  }
}

addColumnIfMissing('friends', 'notify_success',   'INTEGER DEFAULT 1');
addColumnIfMissing('friends', 'notify_missed',    'INTEGER DEFAULT 1');
addColumnIfMissing('friends', 'notify_mode',      "TEXT DEFAULT 'realtime'");
addColumnIfMissing('friends', 'digest_time',      'TEXT DEFAULT NULL');
addColumnIfMissing('friends', 'timezone',         "TEXT DEFAULT 'America/Chicago'");
addColumnIfMissing('friends', 'last_digest_sent', 'TEXT DEFAULT NULL');
addColumnIfMissing('friends', 'notify_sms',       'INTEGER DEFAULT 1');
addColumnIfMissing('friends', 'notify_email',     'INTEGER DEFAULT 0');
addColumnIfMissing('friends', 'email',            'TEXT DEFAULT NULL');

// Partial unique index on email — allows multiple NULLs but enforces uniqueness for real addresses
db.prepare(
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_friends_email ON friends(email) WHERE email IS NOT NULL'
).run();

// Seed settings on first run
const seedSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);
seedSetting.run('checkin_open_hour', process.env.CHECKIN_OPEN_HOUR || '4');
seedSetting.run('checkin_deadline_hour', process.env.CHECKIN_DEADLINE_HOUR || '9');
seedSetting.run('primary_user_name', process.env.PRIMARY_USER_NAME || 'Jake');
seedSetting.run('admin_password', process.env.ADMIN_PASSWORD || 'changeme');
seedSetting.run('best_streak', '0');

// ── Settings helpers ──────────────────────────────────────────────────────────

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

// ── Streak logic ──────────────────────────────────────────────────────────────

/**
 * Count consecutive days (most-recent first) with status 'success' or 'skipped'.
 * 'pending' days are skipped over (don't count, don't break).
 * 'missed' days break the streak.
 */
function getCurrentStreak() {
  const rows = db
    .prepare("SELECT date, status FROM checkins ORDER BY date DESC")
    .all();

  let streak = 0;
  for (const row of rows) {
    if (row.status === 'success') {
      streak++;
    } else if (row.status === 'skipped') {
      // skipped days don't add to streak but don't break it either
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

function getTodayCheckin(dateStr) {
  return db.prepare('SELECT * FROM checkins WHERE date = ?').get(dateStr);
}

function getRecentCheckins(limit = 30) {
  return db
    .prepare('SELECT * FROM checkins ORDER BY date DESC LIMIT ?')
    .all(limit);
}

function insertCheckin(dateStr, status) {
  db.prepare(
    'INSERT OR IGNORE INTO checkins (date, status) VALUES (?, ?)'
  ).run(dateStr, status);
}

function updateCheckin(dateStr, fields) {
  const keys = Object.keys(fields);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);
  values.push(dateStr);
  db.prepare(`UPDATE checkins SET ${setClause} WHERE date = ?`).run(...values);
}

// ── Friends helpers ───────────────────────────────────────────────────────────

function getActiveFriends() {
  return db.prepare('SELECT * FROM friends WHERE active = 1').all();
}

function getAllFriends() {
  return db.prepare('SELECT * FROM friends ORDER BY joined_at DESC').all();
}

function upsertFriend(name, phone, prefs = {}) {
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
  if (phone) existing = db.prepare('SELECT * FROM friends WHERE phone = ?').get(phone);
  if (!existing && email) existing = db.prepare('SELECT * FROM friends WHERE email = ?').get(email);

  if (existing) {
    db.prepare(
      `UPDATE friends SET active = 1, name = ?,
        phone = ?, email = ?,
        notify_success = ?, notify_missed = ?, notify_mode = ?,
        digest_time = ?, timezone = ?, notify_sms = ?, notify_email = ?
       WHERE id = ?`
    ).run(
      name,
      phone ?? existing.phone, email ?? existing.email,
      notify_success, notify_missed, notify_mode,
      digest_time, timezone, notify_sms, notify_email,
      existing.id
    );
    return db.prepare('SELECT * FROM friends WHERE id = ?').get(existing.id);
  }

  const info = db.prepare(
    `INSERT INTO friends
       (name, phone, email, active, joined_at,
        notify_success, notify_missed, notify_mode,
        digest_time, timezone, notify_sms, notify_email)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    name, phone, email, new Date().toISOString(),
    notify_success, notify_missed, notify_mode,
    digest_time, timezone, notify_sms, notify_email
  );
  return db.prepare('SELECT * FROM friends WHERE id = ?').get(info.lastInsertRowid);
}

function updateFriendPrefs(id, prefs) {
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
  db.prepare(
    `UPDATE friends SET
       notify_success = ?, notify_missed = ?, notify_mode = ?,
       digest_time = ?, timezone = ?,
       notify_sms = ?, notify_email = ?, email = ?
     WHERE id = ?`
  ).run(
    notify_success, notify_missed, notify_mode,
    digest_time || null, timezone,
    notify_sms, notify_email, email || null,
    id
  );
}

function removeFriend(id) {
  db.prepare('UPDATE friends SET active = 0 WHERE id = ?').run(id);
}

function getFriendById(id) {
  return db.prepare('SELECT * FROM friends WHERE id = ?').get(id);
}

module.exports = {
  db,
  getSetting,
  setSetting,
  getCurrentStreak,
  getTodayCheckin,
  getRecentCheckins,
  insertCheckin,
  updateCheckin,
  getActiveFriends,
  getAllFriends,
  upsertFriend,
  updateFriendPrefs,
  removeFriend,
  getFriendById,
};
