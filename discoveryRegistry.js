'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY REGISTRY
// Complete catalog of every discoverable item in The Emberstone Chronicles.
// Items: 7 total (5 guaranteed + 2 missable)
// Lore:  8 total (all missable)
// Encounters: 13 total (all missable)
// Total: 28
// ─────────────────────────────────────────────────────────────────────────────

const DISCOVERY_CATALOG = {
  chapter_2: {
    items: {
      letter: {
        guaranteed: false,
        description: 'A sealed letter from Mira, carried two seasons, addressed to the cartographers of Thornwick.',
        missedText:  'Mira had a letter for the cartographers when she came to the waypost. She waited at the marker as long as she could. By the time the morning arrived, she had gone north with it still in her pack.',
      },
    },
    lore: {
      mira_tip: {
        guaranteed: false,
        description: "Mira's warning about the murk-crawler in the Fogmere: \"If it's moving toward the road, follow it.\"",
        missedText:  'Mira stayed at the waypost long enough to give a warning about the Fogmere. She knew about the murk-crawler — its direction, what it meant. She kept that knowledge when she left.',
      },
    },
    encounters: {
      mira_met: {
        guaranteed: false,
        description: 'Mira at the waypost on the Amber Road — carrying the letter, the tip, and the patience of someone who had been waiting for the right traveler.',
        missedText:  'The waypost marker had a fresh notch when the group arrived. The wood inside was still pale. The mug ring on the milestone stone. The flattened grass. Whoever it was, she had left within the hour.',
      },
    },
  },

  chapter_3: {
    lore: {
      fogmere_riddle_solved: {
        guaranteed: false,
        description: 'The heron\'s riddle answered: "Doubt — the thing that grows heavier the longer you carry it and vanishes the moment you set it down."',
        missedText:  "The grey heron asked its riddle in the clearing. The answer is doubt. The path through the Fogmere's worst section would have opened if the answer had been said clearly.",
      },
    },
    encounters: {
      murk_crawler_followed: {
        guaranteed: false,
        description: "Following the murk-crawler through the densest section of the Fogmere — low to the ground, armored, navigating by the dryness at the fog's edge.",
        missedText:  'The murk-crawler was there — moving low, heading toward the road, exactly as Mira described. It led straight to the heron\'s clearing. Nobody followed it.',
      },
      heron_reached: {
        guaranteed: false,
        description: "Reaching the grey heron's clearing deep in the Fogmere, where the fog makes an exception for things that have been somewhere long enough.",
        missedText:  "The grey heron stood in a clearing the fog doesn't quite fill, waiting with the patience of something that has other clearings to stand in. The murk-crawler would have led there. It always goes southeast.",
      },
    },
  },

  chapter_4: {
    items: {
      compass: {
        guaranteed: true,
        description: "A cartographer's compass, awarded after twenty mornings on the road — the kind that reads thresholds as well as directions.",
        missedText:  null,
      },
    },
    lore: {
      archive_elara: {
        guaranteed: false,
        description: "Elara's archive entry, Campaign 7,441 — extraordinary threshold descriptions in the middle campaigns, the last entry ending: 'account continues in the summit archive.' There is a summit archive.",
        missedText:  "Elara's entry was in the fourth volume from the left, third shelf — filed under campaign number 7,441. Her entries are considered reference documents. Her last entry points to a summit archive nobody has mentioned.",
      },
      archive_roan: {
        guaranteed: false,
        description: "Roan's archive entry, Campaign 9,847 — wake times logged to the minute, a brightness scale she invented. Entry stops mid-sentence on day 47. Her daughter Petra came back for the ledger.",
        missedText:  "Roan's entry was in the archive: Campaign 9,847. Wake times to the minute. The scale she invented for stone brightness, annotated in the margin. Entry stops mid-sentence on day 47. A cartographer's note: 'further than expected.' And below that: 'P. came back for the ledger. Asked us to keep it. We kept it.'",
      },
      archive_senna: {
        guaranteed: false,
        description: "Senna's field contacts entry — advance surveyor, Greywood and eastern approaches. Three hands. 'Don't follow her unless she wants to be followed.' One personal note: her father's first survey marker, still standing.",
        missedText:  "The field contacts ledger at the back of the archive had Senna's entry. Sparse details. Three different hands. Advance surveyor, Greywood and eastern approaches. The note about her father's survey marker. Don't follow her unless she wants to be followed.",
      },
      cartographer_lore: {
        guaranteed: false,
        description: "What the cartographers actually map: thresholds — 'the exact points where the road changes the person walking it.' Not places. Thresholds. Chip had already crossed four without knowing.",
        missedText:  "The compact cartographer explained what the archive is for. Not places — thresholds. The exact points where the road changes the person walking it. The Fogmere edge. The spot in the Pass. The place on the Ashfields where the Pull runs out. Chip had crossed four of their documented points without noticing.",
      },
    },
    encounters: {
      survey_party_met: {
        guaranteed: false,
        description: "Meeting the compact cartographer in Thornwick — receiving Mira's letter or explaining the threshold work, the data point of Chip's journey entering the archive.",
        missedText:  "The archive was closed when the morning arrived. The junior cartographer at the door explained the hours without unkindness. The threshold records and the field contacts ledger stayed on their shelves.",
      },
    },
  },

  chapter_5: {
    encounters: {
      hollow_investigated: {
        guaranteed: false,
        description: "The ancient hollow in the Greywood — wayfinder symbol repeated seven times in a spiral, recent fire ring, the bearing that would matter two days later.",
        missedText:  "The hollow was at the base of one of the oldest trees in the Greywood. Kevin noticed it. The wayfinder symbol on the interior wall, pressed deliberately. The bearing pointed slightly north of southeast. Someone moving ahead of them on a parallel line.",
      },
      senna_met: {
        guaranteed: false,
        description: "Senna on the Greywood path — advance surveyor for the cartographers, the hollow was hers, the cairn on the Ridge, her mother's name there twice.",
        missedText:  "Senna crossed the path in the Greywood. She left the word 'Ridge' — either spoken directly, pressed into a tree at the crossing, or passed secondhand. The cairn on the Ridge's highest accessible point has a name in it twice.",
      },
    },
  },

  chapter_6: {
    items: {
      hollow_stone: {
        guaranteed: true,
        description: "A smooth stone from the Hollow Pass canyon floor — warm and weathered, from the place where the river has been cutting the same stone for a million years.",
        missedText:  null,
      },
      aldric_stone: {
        guaranteed: false,
        description: "The stone Aldric dropped in the pack at the Hollow Pass — retrieved from the canyon floor, given to someone who spoke honest and kept walking.",
        missedText:  "Aldric reached into his coat and took out a stone from the canyon floor — smooth, warm, weathered — and dropped it in the pack. He did this for travelers who gave him the honest answer. The bridge was crossed without it.",
      },
    },
    encounters: {
      aldric_full: {
        guaranteed: false,
        description: "The full encounter with Aldric at the Hollow Pass — the canyon pulling at the ropes, the question about what was left behind, the answer that kept walking.",
        missedText:  "Aldric has kept the Hollow Pass bridge since before most roads existed. He asks every traveler what they left behind. Most give the safe answer. The ones who don't get the stone.",
      },
    },
  },

  chapter_7: {
    items: {
      halvard_word: {
        guaranteed: true,
        description: "Halvard's one thing — what it does is get carried, alongside everything else in the pack, into the road ahead.",
        missedText:  null,
      },
    },
    encounters: {
      bird_encountered: {
        guaranteed: false,
        description: "The cedar waxwing at the eastern fire — lighter than expected, the weight of it. Less than a morning you almost missed.",
        missedText:  "Halvard asked one thing: sit at the eastern fire before dawn. The cedar waxwing came anyway — it always comes. It looked at the flame for eleven minutes. Then it looked at the empty stone ring where someone should have been.",
      },
    },
  },

  chapter_8: {
    encounters: {
      grey_mare: {
        guaranteed: false,
        description: "The grey mare in the Ashfields — no saddle, no brand, the grey parting for her. Seen without agenda. The moment when the streak and the ledger and the road were nowhere.",
        missedText:  "A wild mare was in the Ashfields — pale, unhurried, the grey parting for her the way it parts for things that belong to themselves. She moved at a distance she had decided on and maintained without effort.",
      },
    },
  },

  chapter_9: {
    lore: {
      knows_maren: {
        guaranteed: false,
        description: "Maren's name at the Ridge cairn — twice, thirty years apart, same hand. Senna went back and added it after she finished her own campaign. 'I wanted the Ridge to know she got there eventually. Through me.'",
        missedText:  "The cairn at the Ridge had a name twice — Maren, same hand, thirty years apart. Someone came back to add their own name again after decades. The doubled name sits in the base stones with a meaning moving through the world.",
      },
    },
    encounters: {
      cairn_found: {
        guaranteed: false,
        description: "The cairn at the Ridge's highest accessible point — names stacked by many hands over more than a century. Kevin added his. Chip added his below Maren's second entry.",
        missedText:  "The cairn at the Ridge's highest accessible point. Stones stacked by many hands over more than a century. Add your name when you pass. Remove no one else's.",
      },
    },
  },

  chapter_10: {
    items: {
      flask: {
        guaranteed: true,
        description: "A flask from the Valley Below the Peak — carried for the final approach, the last flat ground, the Waking Fire's reach.",
        missedText:  null,
      },
    },
    encounters: {
      forgetting_crossed: {
        guaranteed: false,
        description: "Recognizing Elara's threshold marker near the Forgetting — the specific symbol in the cartographers' reference documents, crossed without knowing.",
        missedText:  "Elara's threshold entries are reference documents in the Thornwick archive. She marked specific points where the road changes the traveler — including one near the Forgetting. Someone who read her entries would recognize the marker when they crossed it.",
      },
    },
  },

  chapter_11: {
    lore: {
      knows_roan: {
        guaranteed: false,
        description: "Roan's full story: she came back three years ago, started over, finished. Petra kept the ledger so someone would have the whole account. The entry that stopped mid-sentence continued.",
        missedText:  "Roan's archive entry stopped mid-sentence on day 47. She came back three years ago. Finished. Her daughter Petra kept the ledger. Someone who read the archive would know her name when she came down the Valley.",
      },
    },
    encounters: {
      last_flat_ground: {
        guaranteed: false,
        description: "The last flat ground before the Peak — Roan coming down with the lightness of someone who has set something down, the sound of the Waking Fire low in the Valley's still air.",
        missedText:  "In the Valley Below the Peak there is a traveler coming down — small pack, the lightness of someone whose hard part is behind them. On a still morning before the Valley wakes up, something low in the air that has been burning longer than the mountain.",
      },
    },
  },

  chapter_12: {
    items: {
      ash_mark: {
        guaranteed: true,
        description: "The Waking Fire's mark on the Emberstone — pressed to chest on the Ashen Peak slope, something recognized something, the warm circle on the slope pulsing once.",
        missedText:  null,
      },
    },
    encounters: {
      waking_fire_felt: {
        guaranteed: false,
        description: "Feeling the Waking Fire on the Ashen Peak slope — heat that has no business being there, the stone alive the way a coal is alive, sixty mornings held completely.",
        missedText:  "The slope of Ashen Peak holds heat it has no business holding. The Emberstone brightens when you enter the circle. The first people who came to this mountain pressed their stones against the Waking Fire. A few came back with different stones.",
      },
    },
  },
};

// ── Guaranteed items by milestone day ────────────────────────────────────────

const GUARANTEED_AT_MILESTONE = {
  20: [{ chapter: 'chapter_4',  category: 'items', item: 'compass'      }],
  30: [{ chapter: 'chapter_6',  category: 'items', item: 'hollow_stone' }],
  35: [{ chapter: 'chapter_7',  category: 'items', item: 'halvard_word' }],
  50: [{ chapter: 'chapter_10', category: 'items', item: 'flask'        }],
  60: [{ chapter: 'chapter_12', category: 'items', item: 'ash_mark'     }],
};

// ── Chapter titles (for display) ──────────────────────────────────────────────

const CHAPTER_TITLES = {
  2:  'The Amber Road',
  3:  'The Fogmere',
  4:  'Thornwick',
  5:  'The Greywood',
  6:  'The Hollow Pass',
  7:  'The Sanctuary',
  8:  'The Ashfields',
  9:  'The Ridge',
  10: 'The Valley Below the Peak',
  11: 'The Valley — Upper Reaches',
  12: 'Ashen Peak',
};

// ── Adventure day → discovery mapping ────────────────────────────────────────
//
// Each function receives (variantKey, tier, flags) and returns
// an array of [chapter, category, item] tuples to mark true.

const ADVENTURE_DAY_DISCOVERIES = {
  7: (variantKey, tier, flags) => {
    if (variantKey === 'blazing' || variantKey === 'great') {
      return [
        ['chapter_2', 'items',      'letter'  ],
        ['chapter_2', 'lore',       'mira_tip'],
        ['chapter_2', 'encounters', 'mira_met'],
      ];
    }
    if (variantKey === 'good') {
      return [['chapter_2', 'encounters', 'mira_met']]; // partial
    }
    return [];
  },

  12: (variantKey, tier, flags) => {
    if (variantKey === 'blazing_great' || variantKey === 'good_with_tip') {
      return [
        ['chapter_3', 'encounters', 'murk_crawler_followed'],
        ['chapter_3', 'encounters', 'heron_reached'        ],
      ];
    }
    return [];
  },

  13: (variantKey, tier, flags) => {
    if (['has_riddle_blazing', 'has_riddle_great', 'no_riddle_blazing', 'no_riddle_great'].includes(variantKey)) {
      return [['chapter_3', 'lore', 'fogmere_riddle_solved']];
    }
    return [];
  },

  18: (variantKey, tier, flags) => {
    const discoveries = [];
    if (tier === 'blazing' || tier === 'great') {
      discoveries.push(['chapter_4', 'lore', 'archive_elara']);
    }
    if (tier === 'blazing') {
      discoveries.push(['chapter_4', 'lore', 'archive_roan']);
    }
    if (tier !== 'struggle') {
      discoveries.push(['chapter_4', 'lore',       'archive_senna'    ]);
      discoveries.push(['chapter_4', 'lore',       'cartographer_lore']);
      discoveries.push(['chapter_4', 'encounters', 'survey_party_met' ]);
    }
    return discoveries;
  },

  22: (variantKey, tier, flags) => {
    if (variantKey !== 'struggle') {
      return [['chapter_5', 'encounters', 'hollow_investigated']];
    }
    return [];
  },

  24: (variantKey, tier, flags) => {
    // Spec: always if knows_senna, otherwise blazing/great/good (not struggle on doesnt_know track)
    const knowsSenna = flags.knows_senna === true;
    if (knowsSenna || (!variantKey.includes('struggle'))) {
      return [['chapter_5', 'encounters', 'senna_met']];
    }
    return [];
  },

  27: (variantKey, tier, flags) => {
    if (variantKey === 'blazing_great_good') {
      return [
        ['chapter_6', 'items',      'aldric_stone'],
        ['chapter_6', 'encounters', 'aldric_full' ],
      ];
    }
    return [];
  },

  32: (variantKey, tier, flags) => {
    if (variantKey !== 'struggle') {
      return [['chapter_7', 'encounters', 'bird_encountered']];
    }
    return [];
  },

  34: () => [], // halvard_word is guaranteed at day 35 milestone, not from day 34

  39: (variantKey, tier, flags) => {
    // grey_mare: all tiers count (struggle = partial but still discovered)
    return [['chapter_8', 'encounters', 'grey_mare']];
  },

  42: (variantKey, tier, flags) => {
    if (variantKey === 'struggle') return [];
    const discoveries = [['chapter_9', 'encounters', 'cairn_found']];
    // knows_maren payoff: only when the knows_maren variant fires (requires knows_maren flag)
    if (variantKey === 'knows_maren') {
      discoveries.push(['chapter_9', 'lore', 'knows_maren']);
    }
    return discoveries;
  },

  52: (variantKey, tier, flags) => {
    // last_flat_ground: always on knows_roan track; blazing/great/good on doesnt_know track
    const discovered = variantKey === 'knows_roan'
      || variantKey === 'doesnt_know_blazing'
      || (variantKey === 'doesnt_know_other' && tier !== 'struggle');
    const discoveries = [];
    if (discovered) discoveries.push(['chapter_11', 'encounters', 'last_flat_ground']);
    // knows_roan lore payoff fires when the recognition variant fires
    if (variantKey === 'knows_roan') {
      discoveries.push(['chapter_11', 'lore', 'knows_roan']);
    }
    return discoveries;
  },

  57: (variantKey, tier, flags) => {
    // waking_fire_felt: blazing/great = blazing_great variant; good = good_struggle + tier good
    const discovered = variantKey === 'blazing_great'
      || (variantKey === 'good_struggle' && tier !== 'struggle');
    if (discovered) return [['chapter_12', 'encounters', 'waking_fire_felt']];
    return [];
  },
};

// ── Core functions ────────────────────────────────────────────────────────────

function getInitialDiscoveryLog() {
  const log = {};
  for (const [chapter, cats] of Object.entries(DISCOVERY_CATALOG)) {
    log[chapter] = {};
    for (const [category, items] of Object.entries(cats)) {
      log[chapter][category] = {};
      for (const item of Object.keys(items)) {
        log[chapter][category][item] = false;
      }
    }
  }
  return log;
}

// Compute which discoveries fire for a given adventure day result.
// Returns array of [chapter, category, item] tuples.
function computeAdventureDayDiscoveries(questDay, variantKey, tier, flags) {
  const fn = ADVENTURE_DAY_DISCOVERIES[questDay];
  if (!fn) return [];
  return fn(variantKey, tier, flags || {});
}

// Set discoveries in a discovery log (mutates and returns the log).
function applyDiscoveries(discoveryLog, discoveries) {
  for (const [chapter, category, item] of discoveries) {
    if (!discoveryLog[chapter]) discoveryLog[chapter] = {};
    if (!discoveryLog[chapter][category]) discoveryLog[chapter][category] = {};
    discoveryLog[chapter][category][item] = true;
  }
  return discoveryLog;
}

// Seed guaranteed items when a milestone day fires.
function seedGuaranteedItems(discoveryLog, milestoneDay) {
  const items = GUARANTEED_AT_MILESTONE[milestoneDay] || [];
  for (const { chapter, category, item } of items) {
    if (!discoveryLog[chapter]) discoveryLog[chapter] = {};
    if (!discoveryLog[chapter][category]) discoveryLog[chapter][category] = {};
    discoveryLog[chapter][category][item] = true;
  }
  return discoveryLog;
}

// Compute chapter counter snapshot for a given chapter number.
// Returns { items, lore, encounters } — only categories with items in that chapter.
// Each present category: { earned: N, possible: M }.
function getChapterCounters(discoveryLog, chapterNum) {
  const chapterKey = `chapter_${chapterNum}`;
  const catalogChapter = DISCOVERY_CATALOG[chapterKey];
  if (!catalogChapter) return null;

  const result = {};
  const logChapter = (discoveryLog && discoveryLog[chapterKey]) || {};

  for (const [category, items] of Object.entries(catalogChapter)) {
    const itemKeys = Object.keys(items);
    if (itemKeys.length === 0) continue;
    const logCat = logChapter[category] || {};
    const earned   = itemKeys.filter(k => logCat[k] === true).length;
    const possible = itemKeys.length;
    result[category] = { earned, possible };
  }

  return result;
}

// Get campaign totals from a discovery log.
function getCampaignTotals(discoveryLog) {
  let items = 0, lore = 0, encounters = 0;
  let itemsPossible = 0, lorePossible = 0, encountersPossible = 0;
  let fullChapters = 0;

  for (const [chapterKey, catalogChapter] of Object.entries(DISCOVERY_CATALOG)) {
    const logChapter = (discoveryLog && discoveryLog[chapterKey]) || {};
    let chapterFull = true;

    for (const [category, catItems] of Object.entries(catalogChapter)) {
      const logCat = logChapter[category] || {};
      for (const itemKey of Object.keys(catItems)) {
        const earned = logCat[itemKey] === true;
        if (category === 'items')      { itemsPossible++;      if (earned) items++; else chapterFull = false; }
        if (category === 'lore')       { lorePossible++;       if (earned) lore++; else chapterFull = false; }
        if (category === 'encounters') { encountersPossible++; if (earned) encounters++; else chapterFull = false; }
      }
    }
    if (chapterFull && Object.keys(catalogChapter).length > 0) fullChapters++;
  }

  // Build per-chapter breakdown
  const chapters = Object.entries(DISCOVERY_CATALOG).map(([chapterKey, catalogChapter]) => {
    const chapterNum = parseInt(chapterKey.split('_')[1], 10);
    const logChapter = (discoveryLog && discoveryLog[chapterKey]) || {};
    const countCat = (cat) => {
      const catItems = catalogChapter[cat] || {};
      const logCat   = logChapter[cat] || {};
      const found    = Object.keys(catItems).filter(k => logCat[k] === true).length;
      return { found, total: Object.keys(catItems).length };
    };
    return {
      number:     chapterNum,
      items:      countCat('items'),
      lore:       countCat('lore'),
      encounters: countCat('encounters'),
    };
  });

  return {
    overall:   { found: items + lore + encounters, total: itemsPossible + lorePossible + encountersPossible },
    items:     { found: items,      total: itemsPossible },
    lore:      { found: lore,       total: lorePossible },
    encounters:{ found: encounters, total: encountersPossible },
    fullChapters,
    chapters,
  };
}

// Build the full reveal data for day 60 end-of-campaign screen.
// Returns { carried: [...], missed: [...] } organized by chapter.
function buildRevealData(discoveryLog) {
  const carried = [];
  const missed  = [];

  for (const [chapterKey, catalogChapter] of Object.entries(DISCOVERY_CATALOG)) {
    const chapterNum  = parseInt(chapterKey.split('_')[1], 10);
    const chapterTitle = CHAPTER_TITLES[chapterNum] || `Chapter ${chapterNum}`;
    const logChapter  = (discoveryLog && discoveryLog[chapterKey]) || {};

    const chapterCarried = [];
    const chapterMissed  = [];

    for (const [category, catItems] of Object.entries(catalogChapter)) {
      for (const [itemKey, meta] of Object.entries(catItems)) {
        const logCat = logChapter[category] || {};
        const earned = logCat[itemKey] === true;
        const entry  = { chapter: chapterNum, chapterTitle, category, item: itemKey, meta };
        if (earned) chapterCarried.push(entry);
        else if (!meta.guaranteed) chapterMissed.push(entry);
      }
    }

    if (chapterCarried.length > 0) carried.push({ chapterNum, chapterTitle, entries: chapterCarried });
    if (chapterMissed.length  > 0) missed.push(  { chapterNum, chapterTitle, entries: chapterMissed  });
  }

  return { carried, missed };
}

// Format a chapter counter snapshot as a compact display string (for app screen).
// Returns null if no categories have content.
function formatChapterCounters(counters) {
  if (!counters) return null;
  const parts = [];
  if (counters.items)      parts.push(`Items ${counters.items.earned}/${counters.items.possible}`);
  if (counters.lore)       parts.push(`Lore ${counters.lore.earned}/${counters.lore.possible}`);
  if (counters.encounters) parts.push(`Encounters ${counters.encounters.earned}/${counters.encounters.possible}`);
  if (parts.length === 0) return null;
  const allFull = Object.values(counters).every(c => c.earned === c.possible);
  if (allFull) return 'full_discovery';
  return parts.join('  ');
}

module.exports = {
  DISCOVERY_CATALOG,
  GUARANTEED_AT_MILESTONE,
  CHAPTER_TITLES,
  ADVENTURE_DAY_DISCOVERIES,
  getInitialDiscoveryLog,
  computeAdventureDayDiscoveries,
  applyDiscoveries,
  seedGuaranteedItems,
  getChapterCounters,
  getCampaignTotals,
  buildRevealData,
  formatChapterCounters,
};
