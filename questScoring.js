'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// QUEST SCORING — Complete Reference File
// ─────────────────────────────────────────────────────────────────────────────
//
// Every trackable moment in the campaign with its point value.
// Used to compute chapter completion cards and the day 60 grade screen.
//
// TIERS:
//   Major (3pts)      — full encounter, rare, requires early mornings
//   Significant (2pts) — meaningful contact, requires showing up
//   Present (1pt)     — evidence of engagement, minimum threshold
//
// MAXIMUM POSSIBLE SCORE: 40 points
// ─────────────────────────────────────────────────────────────────────────────

const SCORING = {

  // ── Chapter 2 — The Amber Road ────────────────────────────────────────────

  mira_full_encounter: {
    points:      3,
    tier:        'major',
    day:         7,
    chapter:     2,
    label:       'Mira — full encounter',
    description: 'Met Mira at the waypost before she left. Received the letter and the Fogmere tip.',
    condition:   'day_7 variant = blazing or great',
    flag_set:    ['has_letter', 'mira_tip'],
  },

  mira_tip_only: {
    points:      0,
    tier:        null,
    day:         7,
    chapter:     2,
    label:       'Mira — tip received',
    description: 'Mira tip is bundled with full encounter. No partial credit.',
    condition:   'bundled with mira_full_encounter',
    flag_set:    [],
  },

  mira_letter_only: {
    points:      0,
    tier:        null,
    day:         7,
    chapter:     2,
    label:       'Mira — letter only',
    description: 'Letter is bundled with full encounter. No partial credit.',
    condition:   'bundled with mira_full_encounter',
    flag_set:    [],
  },

  mira_near_miss: {
    points:      1,
    tier:        'present',
    day:         7,
    chapter:     2,
    label:       'Mira — near miss',
    description: 'Saw Mira leaving. Group noted the missed encounter.',
    condition:   'day_7 variant = good',
    flag_set:    [],
  },

  // ── Chapter 3 — The Fogmere ───────────────────────────────────────────────

  murk_crawler_with_lore: {
    points:      3,
    tier:        'major',
    day:         12,
    chapter:     3,
    label:       'Murk-crawler — full encounter with lore',
    description: 'Followed the murk-crawler to the heron. Received lore about what the crawler is.',
    condition:   'day_12 variant = blazing_great',
    flag_set:    ['fogmere_riddle'],
  },

  murk_crawler_tip_save: {
    points:      2,
    tier:        'significant',
    day:         12,
    chapter:     3,
    label:       'Murk-crawler — followed on Mira\'s tip',
    description: 'Followed the murk-crawler because of Mira\'s tip. Reached the heron without lore.',
    condition:   'day_12 variant = good_with_tip',
    flag_set:    ['fogmere_riddle'],
  },

  riddle_solved: {
    points:      3,
    tier:        'major',
    day:         13,
    chapter:     3,
    label:       'Riddle — solved (Doubt)',
    description: 'Answered the heron\'s riddle correctly. The shortcut through the Fogmere opened.',
    condition:   'day_13 variant = has_riddle_blazing or has_riddle_great or no_riddle_blazing or no_riddle_great',
    flag_set:    [],
  },

  riddle_almost: {
    points:      1,
    tier:        'present',
    day:         13,
    chapter:     3,
    label:       'Riddle — almost answered',
    description: 'Got close to doubt. The heron waited. The shortcut stayed closed.',
    condition:   'day_13 variant = has_riddle_good or no_riddle_good',
    flag_set:    [],
  },

  // ── Chapter 4 — Thornwick ─────────────────────────────────────────────────

  archive_full: {
    points:      3,
    tier:        'major',
    day:         18,
    chapter:     4,
    label:       'Archive — full access (Elara + Roan + Senna)',
    description: 'Read Elara\'s account, Roan\'s entry, and found Senna in the field contacts.',
    condition:   'day_18 variant = blazing_with_letter or blazing_no_letter',
    flag_set:    ['knows_senna', 'knows_roan'],
  },

  archive_partial: {
    points:      2,
    tier:        'significant',
    day:         18,
    chapter:     4,
    label:       'Archive — partial access (Elara + Senna)',
    description: 'Read Elara\'s account and found Senna. Didn\'t reach Roan.',
    condition:   'day_18 variant = great_with_letter or great_no_letter',
    flag_set:    ['knows_senna'],
  },

  archive_senna_only: {
    points:      1,
    tier:        'present',
    day:         18,
    chapter:     4,
    label:       'Archive — Senna only',
    description: 'Found Senna in the field contacts. Brief window.',
    condition:   'day_18 variant = good_with_letter or good_no_letter',
    flag_set:    ['knows_senna'],
  },

  letter_delivered: {
    points:      2,
    tier:        'significant',
    day:         18,
    chapter:     4,
    label:       'Mira\'s letter — delivered to cartographers',
    description: 'Delivered Mira\'s letter. Learned about threshold mapping.',
    condition:   'has_letter = true AND day_18 fired',
    flag_set:    [],
  },

  // ── Chapter 5 — The Greywood ──────────────────────────────────────────────

  hollow_full: {
    points:      2,
    tier:        'significant',
    day:         22,
    chapter:     5,
    label:       'The hollow — full investigation',
    description: 'Identified the wayfinder symbol, fire ring age, and bearing.',
    condition:   'day_22 variant = blazing',
    flag_set:    [],
  },

  hollow_partial: {
    points:      1,
    tier:        'present',
    day:         22,
    chapter:     5,
    label:       'The hollow — symbol noted',
    description: 'Found the hollow, noted the symbol. Bearing missed.',
    condition:   'day_22 variant = great or good',
    flag_set:    [],
  },

  senna_full_account: {
    points:      3,
    tier:        'major',
    day:         24,
    chapter:     5,
    label:       'Senna — full encounter with Maren lore',
    description: 'Recognized Senna. Learned about Maren, the cairn, her father\'s survey marker.',
    condition:   'day_24 variant = knows_blazing or doesnt_know_blazing',
    flag_set:    ['knows_maren'],
  },

  senna_partial: {
    points:      2,
    tier:        'significant',
    day:         24,
    chapter:     5,
    label:       'Senna — encounter with Ridge direction',
    description: 'Met Senna. Received Ridge direction. Partial lore.',
    condition:   'day_24 variant = knows_great or doesnt_know_great',
    flag_set:    [],
  },

  senna_symbol_only: {
    points:      1,
    tier:        'present',
    day:         24,
    chapter:     5,
    label:       'Senna — symbol left on tree',
    description: 'Senna left the symbol. Ridge direction received indirectly.',
    condition:   'day_24 variant = knows_good or doesnt_know_good',
    flag_set:    [],
  },

  // ── Chapter 6 — The Hollow Pass ───────────────────────────────────────────

  aldric_true_answer: {
    points:      3,
    tier:        'major',
    day:         27,
    chapter:     6,
    label:       'Aldric — true answer, stone received',
    description: 'Said the true thing on the bridge. Aldric stepped aside immediately. Stone from the canyon floor.',
    condition:   'day_27 variant = blazing_great_good',
    flag_set:    [],
  },

  aldric_edge_answer: {
    points:      1,
    tier:        'present',
    day:         27,
    chapter:     6,
    label:       'Aldric — edge of true, crossed without stone',
    description: 'Said something at the edge of true. Aldric stepped aside. No stone.',
    condition:   'day_27 variant = struggle',
    flag_set:    [],
  },

  // ── Chapter 7 — The Sanctuary ─────────────────────────────────────────────

  bird_on_hand: {
    points:      3,
    tier:        'major',
    day:         32,
    chapter:     7,
    label:       'Cedar waxwing — landed on hand',
    description: 'Was at the eastern fire early enough. The waxwing landed on his hand.',
    condition:   'day_32 variant = blazing or great or good',
    flag_set:    ['bird_encountered'],
  },

  halvard_full: {
    points:      3,
    tier:        'major',
    day:         34,
    chapter:     7,
    label:       'Halvard — full encounter, one thing said',
    description: 'Bird encounter earned the full Halvard moment. Carried the fire leaving.',
    condition:   'day_34 variant = bird_encountered',
    flag_set:    [],
  },

  halvard_sent_off: {
    points:      1,
    tier:        'present',
    day:         34,
    chapter:     7,
    label:       'Halvard — wished well on the road',
    description: 'Halvard wished him well. The road will give back what the Sanctuary couldn\'t.',
    condition:   'day_34 variant = bird_not_encountered',
    flag_set:    [],
  },

  // ── Chapter 8 — The Ashfields ─────────────────────────────────────────────

  grey_mare_embrace: {
    points:      3,
    tier:        'major',
    day:         39,
    chapter:     8,
    label:       'Grey mare — embraced',
    description: 'Walked alongside the mare. Put his arms around her neck. He broke, into blossom.',
    condition:   'day_39 variant = blazing_great_good',
    flag_set:    [],
  },

  grey_mare_watched: {
    points:      1,
    tier:        'present',
    day:         39,
    chapter:     8,
    label:       'Grey mare — watched from afar',
    description: 'Saw the mare but couldn\'t close the distance. She walked away.',
    condition:   'day_39 variant = struggle',
    flag_set:    [],
  },

  // ── Chapter 9 — The Ridge ─────────────────────────────────────────────────

  cairn_maren: {
    points:      3,
    tier:        'major',
    day:         42,
    chapter:     9,
    label:       'Cairn — Maren understood, name added',
    description: 'Found the doubled name and knew whose it was. Added his name below Maren\'s.',
    condition:   'day_42 variant = knows_maren',
    flag_set:    [],
  },

  cairn_thread: {
    points:      2,
    tier:        'significant',
    day:         42,
    chapter:     9,
    label:       'Cairn — thread felt, name added',
    description: 'Found the doubled name. Thread connected but incomplete. Added his name.',
    condition:   'day_42 variant = knows_senna_not_maren',
    flag_set:    [],
  },

  cairn_mystery: {
    points:      1,
    tier:        'present',
    day:         42,
    chapter:     9,
    label:       'Cairn — mystery noticed, name added',
    description: 'Found the doubled name. No context. Added his name.',
    condition:   'day_42 variant = doesnt_know_senna',
    flag_set:    [],
  },

  cairn_missed: {
    points:      0,
    tier:        null,
    day:         42,
    chapter:     9,
    label:       'Cairn — name not added',
    description: 'Walked past. Didn\'t know the convention. Name not in the stones.',
    condition:   'day_42 variant = struggle',
    flag_set:    [],
  },

  // ── Chapter 11 — The Valley Below the Peak ────────────────────────────────

  roan_recognized: {
    points:      3,
    tier:        'major',
    day:         52,
    chapter:     11,
    label:       'Roan — recognized, full account',
    description: 'Said her name on the path. Learned about Petra. Got the exact summit distance.',
    condition:   'day_52 variant = knows_roan',
    flag_set:    [],
  },

  waking_fire_heard: {
    points:      2,
    tier:        'significant',
    day:         52,
    chapter:     11,
    label:       'Waking Fire — sound heard in the Valley',
    description: 'Heard the fire\'s reach before the traveler described it.',
    condition:   'day_52 variant = knows_roan OR doesnt_know_blazing',
    flag_set:    [],
  },

  roan_stranger: {
    points:      1,
    tier:        'present',
    day:         52,
    chapter:     11,
    label:       'Roan — met as stranger, direction received',
    description: 'Met the returning traveler. Learned about the sound. Summit distance vague.',
    condition:   'day_52 variant = doesnt_know_blazing or doesnt_know_other',
    flag_set:    [],
  },

  // ── Chapter 12 — Ashen Peak Slope ────────────────────────────────────────

  waking_fire_edge_full: {
    points:      3,
    tier:        'major',
    day:         57,
    chapter:     12,
    label:       'Waking Fire\'s edge — full lore, stone pressed to chest',
    description: 'Felt the warm ash before seeing it. Stone blazed. Learned what the Emberstone is.',
    condition:   'day_57 variant = blazing_great',
    flag_set:    [],
  },

  waking_fire_edge_felt: {
    points:      1,
    tier:        'present',
    day:         57,
    chapter:     12,
    label:       'Waking Fire\'s edge — felt but not understood',
    description: 'Stood in the warm circle. Stone brightened. Didn\'t know what it meant.',
    condition:   'day_57 variant = good_struggle',
    flag_set:    [],
  },

};

// ── Maximum score calculation ─────────────────────────────────────────────────

// MAX_SCORE = sum of best possible score per day across all chapters
const MAX_SCORE = 38;

// ── Grade tiers ───────────────────────────────────────────────────────────────

const GRADE_TIERS = [
  { label: 'The Blazing Traveler',   min: 0.90, max: 1.00 },
  { label: 'The Present Traveler',   min: 0.70, max: 0.89 },
  { label: 'The Walking Traveler',   min: 0.50, max: 0.69 },
  { label: 'The Surviving Traveler', min: 0.00, max: 0.49 },
];

function getGradeTier(score) {
  const pct = score / MAX_SCORE;
  return GRADE_TIERS.find(t => pct >= t.min) || GRADE_TIERS[GRADE_TIERS.length - 1];
}

// ── Chapter completion map ────────────────────────────────────────────────────
// Which scoring keys belong to which chapter

const CHAPTER_SCORING = {
  2:  ['mira_full_encounter', 'mira_near_miss'],
  3:  ['murk_crawler_with_lore', 'murk_crawler_tip_save', 'riddle_solved', 'riddle_almost'],
  4:  ['archive_full', 'archive_partial', 'archive_senna_only', 'letter_delivered'],
  5:  ['hollow_full', 'hollow_partial', 'senna_full_account', 'senna_partial', 'senna_symbol_only'],
  6:  ['aldric_true_answer', 'aldric_edge_answer'],
  7:  ['bird_on_hand', 'halvard_full', 'halvard_sent_off'],
  8:  ['grey_mare_embrace', 'grey_mare_watched'],
  9:  ['cairn_maren', 'cairn_thread', 'cairn_mystery', 'cairn_missed'],
  11: ['roan_recognized', 'waking_fire_heard', 'roan_stranger'],
  12: ['waking_fire_edge_full', 'waking_fire_edge_felt'],
};

// Max points available per chapter
// Sums the best possible score for each day within the chapter
const CHAPTER_MAX = (() => {
  const daysBest = {};
  Object.values(SCORING).forEach(item => {
    if (!item.points) return;
    const key = item.chapter + '_' + item.day;
    if (!daysBest[key] || item.points > daysBest[key].points) {
      daysBest[key] = { chapter: item.chapter, points: item.points };
    }
  });
  const result = {};
  Object.values(daysBest).forEach(({ chapter, points }) => {
    result[chapter] = (result[chapter] || 0) + points;
  });
  return result;
})();

module.exports = {
  SCORING,
  MAX_SCORE,
  GRADE_TIERS,
  CHAPTER_SCORING,
  CHAPTER_MAX,
  getGradeTier,
};
