'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// WHAT YOU MISSED — Post-Campaign Review Summaries
// ─────────────────────────────────────────────────────────────────────────────
//
// Shown after day 60 on the review screen.
// Only moments Chip did NOT receive are shown.
// Framed as the road showing what it held — not failure, record.
//
// Each entry has:
//   key         — matches SCORING key
//   chapter     — chapter number
//   day         — quest day it occurred
//   title       — short display label
//   what_was_there  — what the road was holding
//   what_happened   — the full text of what would have occurred
//   unlocked_by     — plain english condition that would have opened it
// ─────────────────────────────────────────────────────────────────────────────

const MISSED = {

  // ── Chapter 2 — The Amber Road ────────────────────────────────────────────

  mira_full_encounter: {
    key:             'mira_full_encounter',
    chapter:         2,
    day:             7,
    title:           'Mira at the waypost',
    what_was_there:  `A merchant named Mira had been waiting at the Amber Road waypost marker for two seasons. She was carrying a sealed letter for the cartographers in Thornwick and specific intelligence about the Fogmere — what moves in the grey on the second day, and what it means if it's moving toward the road. She gave both to travelers she trusted. She had been waiting for the right one.`,
    what_happened:   `She would have given Chip the letter and the Fogmere tip both. The letter would have opened the full archive scene in Thornwick. The tip would have saved the murk-crawler encounter from getting lost in the fog. She was at the waypost. She was there.`,
    unlocked_by:     'Arriving at the waypost before Mira left — blazing or great morning on day 7.',
  },

  mira_near_miss: {
    key:             'mira_near_miss',
    chapter:         2,
    day:             7,
    title:           'Mira — almost',
    what_was_there:  `Mira was still visible at the bend in the road when the morning caught up. Close enough to call out. She turned when the group called. She assessed the distance and kept going.`,
    what_happened:   `She would have paused. Given nothing — but paused. The near miss would have been felt rather than just evidence on a waypost. Kevin would have said: we almost had something there.`,
    unlocked_by:     'Good morning on day 7 — close but not early enough for the full encounter.',
  },

  // ── Chapter 3 — The Fogmere ───────────────────────────────────────────────

  murk_crawler_with_lore: {
    key:             'murk_crawler_with_lore',
    chapter:         3,
    day:             12,
    title:           'The murk-crawler — full encounter',
    what_was_there:  `The murk-crawler moves through the Fogmere by sensing the specific dryness at its edge. It has been making this crossing since before the road existed. On the second day in the Fogmere it crossed the path heading southeast — toward the exit, toward a clearing, toward a grey heron that had been standing in that clearing for longer than anyone has been keeping records of herons.`,
    what_happened:   `Following the murk-crawler to the heron was the difference between the shortcut and the long way. Chip would have learned what the crawler is — an environmental consultant recognizing something he could name — and the lore of it would have made the riddle easier to receive when the heron asked it. Mira's tip, if he had it, would have made this automatic. Without it, the instinct to follow had to come from somewhere else.`,
    unlocked_by:     'Blazing or great morning on day 12, or any tier if Mira\'s tip was received on day 7.',
  },

  riddle_solved: {
    key:             'riddle_solved',
    chapter:         3,
    day:             13,
    title:           'The heron\'s riddle — answered',
    what_was_there:  `The grey heron stood in a clearing the fog makes an exception for. It had been standing there for a very long time. The riddle it carries has been asked since before the cartographers started mapping the Fogmere's edge.

I have no mouth but I speak to those who stop.
I have no eyes but I see who is lost.
I grow heavier the longer you carry me
and vanish the moment you set me down.

The answer is doubt. The heron steps aside when it hears the word. Behind where it stood: the shortest path out of the Fogmere's worst section, lit by something that isn't the Emberstone.`,
    what_happened:   `The path would have opened. The group would have moved through it without speaking. Kevin would have asked how long Chip knew. Chip would have said: since the murk-crawler. Will would have documented it with the specific restraint of someone who knows the entry is the most important one in this chapter.`,
    unlocked_by:     'Answering doubt to the heron on day 13 — requires blazing or great morning, with or without the riddle from day 12.',
  },

  // ── Chapter 4 — Thornwick ─────────────────────────────────────────────────

  archive_full: {
    key:             'archive_full',
    chapter:         4,
    day:             18,
    title:           'The Thornwick archive — full access',
    what_was_there:  `The Thornwick archive opens before the village does. Inside: campaign 7,441 — Elara, youngest of four, left at nineteen, whose entries became reference documents and whose account ends with a cartographer's note: continues in the summit archive. Campaign 9,847 — Roan, a surveyor with two children, whose entry stops mid-sentence on day 47, whose daughter Petra came back for the ledger afterward. The field contacts section at the back: Senna, advance surveyor, don't follow her unless she wants to be followed, and one personal note about her father's survey marker still standing.`,
    what_happened:   `Chip would have had Roan's name before she appeared in the Valley on day 52. He would have known Senna from the archive before she stepped onto the path on day 24. He would have learned about Elara's account continuing at the summit — there is a summit archive, nobody else mentioned it. He would have sat with all three of them in a room full of ledgers before the road gave him any of them in person.`,
    unlocked_by:     'Blazing morning on day 18 — arriving before the archive filled.',
  },

  archive_partial: {
    key:             'archive_partial',
    chapter:         4,
    day:             18,
    title:           'The Thornwick archive — Roan\'s entry',
    what_was_there:  `Campaign 9,847. Roan. Wake times logged to the minute. Stone brightness rated on a scale she invented herself. A surveyor before the children, who started again after. The entry stops mid-sentence on day 47: the stone this morning was the clearest it has been since — Cartographer's margin note: further than expected. A second note, added later: P. came back for the ledger. Asked us to keep it. We kept it.`,
    what_happened:   `When Roan appeared in the Valley on day 52 heading down from the summit, Chip would have said her name before she introduced herself. The recognition would have changed the conversation entirely. Petra's name would have traveled from the Thornwick archive all the way to the Valley Below the Peak.`,
    unlocked_by:     'Blazing morning on day 18 — enough time to reach the campaign records after finding Senna.',
  },

  letter_delivered: {
    key:             'letter_delivered',
    chapter:         4,
    day:             18,
    title:           'Mira\'s letter — delivered',
    what_was_there:  `Mira had been carrying a sealed letter for two seasons. She gave it to Chip on the Amber Road to carry to the cartographers in Thornwick. The compact cartographer with ink-stained fingers read it twice before looking up. She found another one. That's three in that region now.`,
    what_happened:   `The cartographer would have explained the threshold work — what the cartographers actually map, not places but the exact points where the road changes the person walking it. He would have noted that Chip had already crossed four of their documented thresholds without knowing. Mira waited two seasons for the right traveler. The letter was meant to travel with the pack.`,
    unlocked_by:     'Receiving the letter from Mira on day 7 (blazing or great) and arriving at Thornwick on day 18.',
  },

  // ── Chapter 5 — The Greywood ──────────────────────────────────────────────

  hollow_full: {
    key:             'hollow_full',
    chapter:         5,
    day:             22,
    title:           'The hollow — full investigation',
    what_was_there:  `At the base of one of the oldest trees in the Greywood: a space the tree grew around over centuries. Inside, a fire ring twelve to eighteen hours old, and a symbol pressed seven times in a spiral into the curved wall. Wayfinder mark — the notation advance surveyors use to mark their routes for cartographers who follow. The spiral's terminus pointed slightly north of southeast. Someone moving ahead of them, faster, on a better line.`,
    what_happened:   `Chip would have identified the symbol from the Thornwick field contacts section — connecting it to Senna before she appeared. He would have noted the bearing. On day 24 when she stepped onto the path the recognition would have been complete: the hollow, the symbol, the bearing, all pointing at the person now standing in front of him.`,
    unlocked_by:     'Blazing morning on day 22 — finding the hollow before the group, having enough time to read the ash and identify the symbol.',
  },

  senna_full_account: {
    key:             'senna_full_account',
    chapter:         5,
    day:             24,
    title:           'Senna — full account, Maren',
    what_was_there:  `Senna stepped onto the path. She surveys the Greywood for the cartographers, among other places. She moves faster than the surveys. She has been watching the group's pace through the trees since before day 22. She chose to be seen — which for Senna is a deliberate act.

She told Chip about the cairn on the Ridge. About Maren — her mother, who stopped on the Ridge on her first campaign. About going back thirty years later and adding her mother's name again. I wanted the Ridge to know she got there eventually. Through me. She talked about her father's survey marker, still standing where he left it. Some things should stay where they were left.`,
    what_happened:   `The cairn on day 42 would have landed differently. Finding Maren's name twice in the base stones and knowing whose it was — knowing Senna had carried her mother to the summit through thirty years of her own campaigns — is a different thing from finding a mystery in the stones. Chip would have added his name below Maren's second entry.`,
    unlocked_by:     'Knowing Senna from the archive (blazing/great/good day 18) AND blazing or great morning on day 24.',
  },

  // ── Chapter 6 — The Hollow Pass ───────────────────────────────────────────

  aldric_true_answer: {
    key:             'aldric_true_answer',
    chapter:         6,
    day:             27,
    title:           'Aldric — the true answer',
    what_was_there:  `Aldric has been at the bridge for thousands of years. The toll is one answer to one question: you look like you left something behind, what was that. The answer that steps aside immediately is the one that costs something to say — specific, honest, the thing the traveler didn't know they were going to say until they said it.

I stopped believing I would be a different person. I left that behind.

Aldric stepped aside. He pressed a stone from the canyon floor into Chip's hand — smooth, warm, weathered. Give it back when you're done. There's a place it belongs.`,
    what_happened:   `The stone would have traveled in the pack from the Hollow Pass to the summit. There's a place it belongs — Aldric said that without explaining where. The Waking Fire's reach at the top of Ashen Peak is where fragments return. The stone from the canyon floor is one of them. It belongs at the Waking Fire, pressed there the way the first people pressed their stones, completing a circuit that started when Aldric cut it from the canyon wall.`,
    unlocked_by:     'Blazing, great, or good morning on day 27 — answering Aldric\'s question with the true thing.',
  },

  // ── Chapter 7 — The Sanctuary ─────────────────────────────────────────────

  bird_on_hand: {
    key:             'bird_on_hand',
    chapter:         7,
    day:             32,
    title:           'The cedar waxwing — on his hand',
    what_was_there:  `The cedar waxwing has been coming to the eastern fire at the Sanctuary for nine years. It arrives before dawn — before the light gets going — and sits at the stone ring and looks at the flame. An environmental consultant knows the cedar waxwing. A bird that moves in flocks, that passes berries from beak to beak down a line. A bird that shows up every year without fail not because migration compels it but because it does.

It looked at the flame for eleven minutes. Then it looked at Chip. It jumped from the stone ring onto his hand. Less than he expected, the weight of it. Lighter than a morning you almost missed.`,
    what_happened:   `Chip sat with what he was holding. Not the bird — something the bird had shown him about showing up before dawn not because you have to but because you still do. Because the doing of it is the whole point. Because that is how the door stays easy. When Halvard said his one thing the next day, Chip had the bird to put under the words. The bird was the ground.`,
    unlocked_by:     'Blazing, great, or good morning on day 32 — being at the eastern fire when the waxwing arrived.',
  },

  halvard_full: {
    key:             'halvard_full',
    chapter:         7,
    day:             34,
    title:           'Halvard — one thing said',
    what_was_there:  `Halvard had one thing to say. He said it once. What it does is get carried — in the pack alongside the compass and the hollow stone, into the road ahead, there when the road needs it. It will not be written here. Some things lose something essential in the writing.

He was still carrying the fire when he crossed the line between the Sanctuary's warmth and the road's cold.`,
    what_happened:   `The Valley Below the Peak on day 55: what Halvard said at the Sanctuary became useful in a way it hadn't been useful before. That's where the milestone places it — the Valley is where it becomes clear why he said it when he did, and not earlier, when it would have seemed like advice rather than recognition. The road gives the context. The Sanctuary gives the thing.`,
    unlocked_by:     'The cedar waxwing encounter on day 32 — being at the eastern fire before dawn.',
  },

  // ── Chapter 8 — The Ashfields ─────────────────────────────────────────────

  grey_mare_embrace: {
    key:             'grey_mare_embrace',
    chapter:         8,
    day:             39,
    title:           'The grey mare',
    what_was_there:  `She came out of the grey the way grace comes — without apology, never earned. A wild mare moving through the Ashfields at the pace of something that has never doubted its direction. No saddle. No brand. No evidence of where she came or what she was moving toward. The grey parted for her. It only parts for things that belong to themselves completely.

She turned her head — full dark eyes, the specific attention of a creature that has decided to see you. Seen without agenda. Without a mold it wanted you to exist in. Fully. Without wanting anything in return.`,
    what_happened:   `He put his arms around her neck. The grey fell. The Ashfields, nowhere. The streak and the ledger and the Pull and the road and the days behind and the distance still to go — nothing. Two sets of prints stopped to have a moment together. Her breath came even and slow. The mane was rough against his face. She smelled like rain. And in that moment he broke, into blossom.

Kevin said: that was a blessing. Aye papi, added Brent. Will wrote it down and circled it.`,
    unlocked_by:     'Blazing, great, or good morning on day 39 — being present enough that the mare didn\'t walk away.',
  },

  // ── Chapter 9 — The Ridge ─────────────────────────────────────────────────

  cairn_maren: {
    key:             'cairn_maren',
    chapter:         9,
    day:             42,
    title:           'The cairn — Maren',
    what_was_there:  `At the Ridge's highest accessible point: a cairn with names in the base stones. Near the base: Maren. Twice. Same hand. Thirty years apart. The first time she stopped here on her first campaign. The second time her daughter Senna came back and added her name after finishing her own campaign. I wanted the Ridge to know she got there eventually. Through me.`,
    what_happened:   `Chip would have added his name below Maren's second entry — below the name that came back, below the thirty years, below the daughter who carried her mother to the summit. The Ridge holds the names of the ones who stopped here and the names of the ones who didn't stop and makes no distinction between them in the keeping. His name would be in the stones.`,
    unlocked_by:     'Senna\'s full account on day 24 (knows_maren flag) AND present at the cairn on day 42.',
  },

  cairn_name_added: {
    key:             'cairn_mystery',
    chapter:         9,
    day:             42,
    title:           'The cairn — name added',
    what_was_there:  `The convention at the Ridge cairn: add your name when you pass. Remove no one else's. The doubled name — Maren, thirty years apart — was there whether or not Chip knew whose it was. The stones hold what the stones hold.`,
    what_happened:   `Chip's name would be in the base stones of the Ridge cairn. Everyone else added theirs. Kevin added his quietly near the bottom without explaining when he was here before. The cairn holds the record of everyone who made it this far and stopped to say so. Chip's name is not in it.`,
    unlocked_by:     'Being present at the cairn — any tier except struggle on day 42.',
  },

  // ── Chapter 11 — The Valley Below the Peak ────────────────────────────────

  roan_recognized: {
    key:             'roan_recognized',
    chapter:         11,
    day:             52,
    title:           'Roan — recognized on the path',
    what_was_there:  `She was coming down when the morning opened. Small pack. The specific lightness of someone who has set something down after carrying it for a long time. Campaign 9,847. She stopped at day 47 mid-sentence and came back three years ago and finished. Her daughter Petra kept the ledger. P. came back for the ledger. Asked us to keep it. We kept it.

She was four days past the summit, heading home.`,
    what_happened:   `Chip said her name before she introduced herself. Thornwick, he said. The archive. Campaign 9,847. She told him about Petra — that she asked her not to keep the ledger but Petra kept it anyway. She said someone should have the whole account even if I couldn't finish writing it. She told him he was four days out. Petra will want to know about this, she said. That someone read the ledger. That it traveled.`,
    unlocked_by:     'Blazing morning on day 18 — reading Roan\'s entry in the full archive.',
  },

  waking_fire_heard: {
    key:             'waking_fire_heard',
    chapter:         11,
    day:             52,
    title:           'The Waking Fire — heard in the Valley',
    what_was_there:  `The Waking Fire's reach extends into the Valley on still mornings. Low. Felt more than heard. The specific frequency of something that has been burning longer than the road existed. You have to be standing still before the day gets loud. Most people miss it.`,
    what_happened:   `Chip heard it before the traveler came around the bend. He stood still and let it move through him and didn't know what it was until she described it. You're four days out, she said. The fact that you heard it here means something. It doesn't reach this far for everyone.`,
    unlocked_by:     'Blazing morning on day 52 — standing still before the day got loud.',
  },

  // ── Chapter 12 — Ashen Peak Slope ────────────────────────────────────────

  waking_fire_edge_full: {
    key:             'waking_fire_edge_full',
    chapter:         12,
    day:             57,
    title:           'The Waking Fire\'s edge — the Emberstone\'s lore',
    what_was_there:  `At a specific point on the slope the ash is warm beneath the boots before the eyes find any reason for it to be. The outer reach of the Waking Fire. The first people who came to this mountain pressed their stones against the Waking Fire and most came back with the same stones they arrived with. A few did not. The fire kept something in the ones it chose — not heat, not light, the quality underneath both. The thing that makes a person get up before the argument has finished forming. The Emberstone is one of those.

It has been passed forward since then like a question nobody has stopped asking.`,
    what_happened:   `Chip felt it rise through his boots before he saw it. He crouched and pressed his palm flat to the ash. The Emberstone left the pack on its own terms. In his hand it was alive the way a coal is alive — not burning, becoming. He pressed it to his chest. Below his hand something recognized something. The warm circle pulsed once — the mountain acknowledging what was coming home to it. Kevin put his hand on Chip's shoulder and left it there for a moment. Brent slapped his ass and they all started walking.`,
    unlocked_by:     'Blazing or great morning on day 57 — feeling the warm ash before the group noticed it.',
  },

};

module.exports = { MISSED };
