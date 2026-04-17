'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// ADVENTURE DAY SELECTOR — Logic Reference File
// ─────────────────────────────────────────────────────────────────────────────
//
// This file defines the complete selection logic for all 15 adventure days.
// For each quest day, given the current state flags and today's tier,
// it returns:
//   - variant_key: which text to show from adventureDays.js
//   - flags_to_set: which state flags to write after this day fires
//   - score_key: which SCORING key to log for chapter completion
//
// TIERS: blazing | great | good | struggle
//   blazing  = before 7:00am  (minutes < 420)
//   great    = 7:00 - 7:45    (minutes < 465)
//   good     = 7:46 - 8:30    (minutes < 510)
//   struggle = 8:31+          (minutes >= 510)
//
// STATE FLAGS (read from adventure_flags in quest_state):
//   has_letter       boolean
//   mira_tip         boolean
//   fogmere_riddle   boolean
//   archive_tier_18  string: 'blazing' | 'great' | 'good' | 'struggle'
//   knows_senna      boolean
//   knows_roan       boolean
//   knows_maren      boolean
//   bird_encountered boolean
//
// USAGE:
//   const result = selectAdventureDay(questDay, tier, flags);
//   result.variant_key  → key into DAY_X object in adventureDays.js
//   result.flags_to_set → { flagName: value } to merge into adventure_flags
//   result.score_key    → key into SCORING in questScoring.js
// ─────────────────────────────────────────────────────────────────────────────

function selectAdventureDay(questDay, tier, flags) {
  switch (questDay) {
    case 7:  return selectDay7(tier, flags);
    case 12: return selectDay12(tier, flags);
    case 13: return selectDay13(tier, flags);
    case 18: return selectDay18(tier, flags);
    case 22: return selectDay22(tier, flags);
    case 24: return selectDay24(tier, flags);
    case 27: return selectDay27(tier, flags);
    case 32: return selectDay32(tier, flags);
    case 34: return selectDay34(tier, flags);
    case 39: return selectDay39(tier, flags);
    case 42: return selectDay42(tier, flags);
    case 52: return selectDay52(tier, flags);
    case 57: return selectDay57(tier, flags);
    default: return null;
  }
}

// ── Day 7 — Mira — The Amber Road ────────────────────────────────────────────
// Sets: has_letter, mira_tip (blazing/great only)

function selectDay7(tier, flags) {
  if (tier === 'blazing' || tier === 'great') {
    return {
      variant_key:  tier === 'blazing' ? 'blazing' : 'great',
      flags_to_set: { has_letter: true, mira_tip: true },
      score_key:    'mira_full_encounter',
    };
  }
  if (tier === 'good') {
    return {
      variant_key:  'good',
      flags_to_set: {},
      score_key:    'mira_near_miss',
    };
  }
  // struggle
  return {
    variant_key:  'struggle',
    flags_to_set: {},
    score_key:    null,
  };
}

// ── Day 12 — The Murk-Crawler — The Fogmere ──────────────────────────────────
// Sets: fogmere_riddle (blazing/great/good_with_tip)
// Special: struggle + has mira_tip = floors to good_with_tip

function selectDay12(tier, flags) {
  const hasTip = flags.mira_tip === true;

  // Mira tip saves struggle — floors to good_with_tip
  if (tier === 'struggle' && hasTip) {
    return {
      variant_key:  'good_with_tip',
      flags_to_set: { fogmere_riddle: true },
      score_key:    'murk_crawler_tip_save',
    };
  }

  if (tier === 'blazing' || tier === 'great') {
    return {
      variant_key:  'blazing_great',
      flags_to_set: { fogmere_riddle: true },
      score_key:    'murk_crawler_with_lore',
    };
  }

  if (tier === 'good') {
    if (hasTip) {
      return {
        variant_key:  'good_with_tip',
        flags_to_set: { fogmere_riddle: true },
        score_key:    'murk_crawler_tip_save',
      };
    }
    return {
      variant_key:  'good_no_tip',
      flags_to_set: {},
      score_key:    null,
    };
  }

  // struggle without tip
  return {
    variant_key:  'struggle',
    flags_to_set: {},
    score_key:    null,
  };
}

// ── Day 13 — The Heron — Fogmere Answer ──────────────────────────────────────
// Reads: fogmere_riddle
// Sets: nothing

function selectDay13(tier, flags) {
  const hasRiddle = flags.fogmere_riddle === true;

  if (hasRiddle) {
    if (tier === 'blazing') {
      return {
        variant_key:  'has_riddle_blazing',
        flags_to_set: {},
        score_key:    'riddle_solved',
      };
    }
    if (tier === 'great') {
      return {
        variant_key:  'has_riddle_great',
        flags_to_set: {},
        score_key:    'riddle_solved',
      };
    }
    if (tier === 'good') {
      return {
        variant_key:  'has_riddle_good',
        flags_to_set: {},
        score_key:    'riddle_almost',
      };
    }
    // struggle with riddle
    return {
      variant_key:  'has_riddle_struggle',
      flags_to_set: {},
      score_key:    null,
    };
  }

  // No riddle from day 12
  if (tier === 'blazing') {
    return {
      variant_key:  'no_riddle_blazing',
      flags_to_set: {},
      score_key:    'riddle_solved',
    };
  }
  if (tier === 'great') {
    return {
      variant_key:  'no_riddle_great',
      flags_to_set: {},
      score_key:    'riddle_solved',
    };
  }
  if (tier === 'good') {
    return {
      variant_key:  'no_riddle_good',
      flags_to_set: {},
      score_key:    'riddle_almost',
    };
  }
  // struggle, no riddle — both days struggled
  return {
    variant_key:  'no_riddle_struggle',
    flags_to_set: {},
    score_key:    null,
  };
}

// ── Day 18 — The Archive — Thornwick ─────────────────────────────────────────
// Reads: has_letter
// Sets: archive_tier_18, knows_senna, knows_roan

function selectDay18(tier, flags) {
  const hasLetter = flags.has_letter === true;
  const letterSuffix = hasLetter ? 'with_letter' : 'no_letter';

  if (tier === 'blazing') {
    return {
      variant_key:  `blazing_${letterSuffix}`,
      flags_to_set: {
        archive_tier_18: 'blazing',
        knows_senna:     true,
        knows_roan:      true,
      },
      score_key: hasLetter
        ? ['archive_full', 'letter_delivered']
        : ['archive_full'],
    };
  }

  if (tier === 'great') {
    return {
      variant_key:  `great_${letterSuffix}`,
      flags_to_set: {
        archive_tier_18: 'great',
        knows_senna:     true,
        knows_roan:      false,
      },
      score_key: hasLetter
        ? ['archive_partial', 'letter_delivered']
        : ['archive_partial'],
    };
  }

  if (tier === 'good') {
    return {
      variant_key:  `good_${letterSuffix}`,
      flags_to_set: {
        archive_tier_18: 'good',
        knows_senna:     true,
        knows_roan:      false,
      },
      score_key: hasLetter
        ? ['archive_senna_only', 'letter_delivered']
        : ['archive_senna_only'],
    };
  }

  // struggle
  return {
    variant_key:  `struggle_${letterSuffix}`,
    flags_to_set: {
      archive_tier_18: 'struggle',
      knows_senna:     false,
      knows_roan:      false,
    },
    score_key: hasLetter ? ['letter_delivered'] : null,
  };
}

// ── Day 22 — The Hollow — The Greywood ───────────────────────────────────────
// Standalone — no flags read or set

function selectDay22(tier, flags) {
  if (tier === 'blazing') {
    return {
      variant_key:  'blazing',
      flags_to_set: {},
      score_key:    'hollow_full',
    };
  }
  if (tier === 'great' || tier === 'good') {
    return {
      variant_key:  tier,
      flags_to_set: {},
      score_key:    'hollow_partial',
    };
  }
  return {
    variant_key:  'struggle',
    flags_to_set: {},
    score_key:    null,
  };
}

// ── Day 24 — Senna — The Greywood ────────────────────────────────────────────
// Reads: knows_senna
// Sets: knows_maren (blazing on knows-senna track only)

function selectDay24(tier, flags) {
  const knowsSenna = flags.knows_senna === true;
  const prefix = knowsSenna ? 'knows' : 'doesnt_know';

  if (tier === 'blazing') {
    return {
      variant_key:  `${prefix}_blazing`,
      flags_to_set: { knows_maren: true },
      score_key:    'senna_full_account',
    };
  }

  if (tier === 'great') {
    return {
      variant_key:  `${prefix}_great`,
      flags_to_set: knowsSenna ? { knows_maren: true } : {},
      score_key:    'senna_partial',
    };
  }

  if (tier === 'good') {
    return {
      variant_key:  `${prefix}_good`,
      flags_to_set: {},
      score_key:    'senna_symbol_only',
    };
  }

  // struggle
  return {
    variant_key:  `${prefix}_struggle`,
    flags_to_set: {},
    score_key:    null,
  };
}

// ── Day 27 — Aldric — The Hollow Pass ────────────────────────────────────────
// Standalone — no flags read or set

function selectDay27(tier, flags) {
  if (tier === 'blazing' || tier === 'great' || tier === 'good') {
    return {
      variant_key:  'blazing_great_good',
      flags_to_set: {},
      score_key:    'aldric_true_answer',
    };
  }
  return {
    variant_key:  'struggle',
    flags_to_set: {},
    score_key:    'aldric_edge_answer',
  };
}

// ── Day 32 — The Eastern Fire — The Sanctuary ─────────────────────────────────
// Sets: bird_encountered

function selectDay32(tier, flags) {
  if (tier === 'blazing' || tier === 'great' || tier === 'good') {
    return {
      variant_key:  tier,
      flags_to_set: { bird_encountered: true },
      score_key:    'bird_on_hand',
    };
  }
  return {
    variant_key:  'struggle',
    flags_to_set: { bird_encountered: false },
    score_key:    null,
  };
}

// ── Day 34 — Halvard's One Thing — The Sanctuary ──────────────────────────────
// Reads: bird_encountered
// Sets: nothing
// Note: This is also the Chapter 7 decision day

function selectDay34(tier, flags) {
  const birdEncountered = flags.bird_encountered === true;

  if (birdEncountered) {
    return {
      variant_key:  'bird_encountered',
      flags_to_set: {},
      score_key:    'halvard_full',
    };
  }
  return {
    variant_key:  'bird_not_encountered',
    flags_to_set: {},
    score_key:    'halvard_sent_off',
  };
}

// ── Day 39 — The Grey Mare — The Ashfields ────────────────────────────────────
// Standalone — no flags read or set

function selectDay39(tier, flags) {
  if (tier === 'blazing' || tier === 'great' || tier === 'good') {
    return {
      variant_key:  'blazing_great_good',
      flags_to_set: {},
      score_key:    'grey_mare_embrace',
    };
  }
  return {
    variant_key:  'struggle',
    flags_to_set: {},
    score_key:    'grey_mare_watched',
  };
}

// ── Day 42 — The Cairn — The Ridge ────────────────────────────────────────────
// Reads: knows_maren, knows_senna
// Sets: nothing

function selectDay42(tier, flags) {
  // Struggle — walked past regardless of knowledge state
  if (tier === 'struggle') {
    return {
      variant_key:  'struggle',
      flags_to_set: {},
      score_key:    'cairn_missed',
    };
  }

  // Present (blazing/great/good) — knowledge determines which version
  if (flags.knows_maren === true) {
    return {
      variant_key:  'knows_maren',
      flags_to_set: {},
      score_key:    'cairn_maren',
    };
  }

  if (flags.knows_senna === true) {
    return {
      variant_key:  'knows_senna_not_maren',
      flags_to_set: {},
      score_key:    'cairn_thread',
    };
  }

  return {
    variant_key:  'doesnt_know_senna',
    flags_to_set: {},
    score_key:    'cairn_mystery',
  };
}

// ── Day 52 — Roan — The Valley Below the Peak ─────────────────────────────────
// Reads: knows_roan
// Sets: nothing

function selectDay52(tier, flags) {
  const knowsRoan = flags.knows_roan === true;

  if (knowsRoan) {
    return {
      variant_key:  'knows_roan',
      flags_to_set: {},
      score_key:    ['roan_recognized', 'waking_fire_heard'],
    };
  }

  if (tier === 'blazing') {
    return {
      variant_key:  'doesnt_know_blazing',
      flags_to_set: {},
      score_key:    ['waking_fire_heard', 'roan_stranger'],
    };
  }

  return {
    variant_key:  'doesnt_know_other',
    flags_to_set: {},
    score_key:    'roan_stranger',
  };
}

// ── Day 57 — The Waking Fire's Edge — Ashen Peak Slope ───────────────────────
// Standalone — no flags read or set

function selectDay57(tier, flags) {
  if (tier === 'blazing' || tier === 'great') {
    return {
      variant_key:  'blazing_great',
      flags_to_set: {},
      score_key:    'waking_fire_edge_full',
    };
  }
  return {
    variant_key:  'good_struggle',
    flags_to_set: {},
    score_key:    'waking_fire_edge_felt',
  };
}

// ── Adventure day list ────────────────────────────────────────────────────────

const ADVENTURE_DAYS = [7, 12, 13, 18, 22, 24, 27, 32, 34, 39, 42, 52, 57];

function isAdventureDay(questDay) {
  return ADVENTURE_DAYS.includes(questDay);
}

// ── Tier calculation ──────────────────────────────────────────────────────────
// minutes = minutes since midnight at time of checkin

function getTier(minutes) {
  if (minutes < 420) return 'blazing';  // before 7:00am
  if (minutes < 465) return 'great';    // 7:00 - 7:44
  if (minutes < 510) return 'good';     // 7:45 - 8:29
  return 'struggle';                     // 8:30+
}

module.exports = {
  selectAdventureDay,
  isAdventureDay,
  getTier,
  ADVENTURE_DAYS,
};
