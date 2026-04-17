'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// ADVENTURE DAYS — Complete Reference File
// ─────────────────────────────────────────────────────────────────────────────
//
// This file contains all narrative content for the 15 empty quest days.
// It is the single source of truth for adventure day text.
// Claude Code should use this file for content and never write narrative text.
//
// STATE FLAGS:
//   has_letter       — set day 7 blazing/great, read day 18
//   mira_tip         — set day 7 blazing/great, read day 12
//   fogmere_riddle   — set day 12 blazing/great/good+tip, read day 13
//   archive_tier_18  — set day 18 (blazing/great/good/struggle), read days 24/43/48
//   knows_senna      — set day 18 blazing/great/good, read day 24
//   knows_roan       — set day 18 blazing only, read day 52
//   knows_maren      — set day 24 blazing/great knows-senna track, read day 42
//   bird_encountered — set day 32 blazing/great/good, read day 34
//
// QUEST DAYS: 7, 12, 13, 18, 22, 24, 27, 32, 34, 39, 42, 52, 57
// ─────────────────────────────────────────────────────────────────────────────


// ── DAY 7 — MIRA — The Amber Road ────────────────────────────────────────────
// Fires: quest day 7
// Sets: has_letter (blazing/great), mira_tip (blazing/great)
// Conditions incoming: none

const DAY_7 = {

  // Sets has_letter = true, mira_tip = true
  blazing: `There is a woman resting at the waypost marker when the morning arrives. Pack on the ground, a cart parked sideways in the grass, a mug of something steaming balanced on the milestone stone. She looks up when Chip approaches and does not look surprised.

Her name is Mira. She moves between settlements carrying things people need and things people don't know they need yet. She has been carrying a sealed letter for two seasons, waiting for the right traveler to give it to.

She looks at the Emberstone for a long time. Then she looks at Chip. Then she takes the letter out of her pack and holds it out.

"This goes to the cartographers in Thornwick," she says. "Don't read it. Don't lose it. If you make it that far they'll know what it's for."

Chip asked what was in it. She said if she knew she would have opened it herself.

Then she said: "Fogmere's ahead. Second day in — you'll hear something moving in the grey. Low to the ground. Don't follow it unless it's moving toward the road. If it's moving toward the road, follow it."

She didn't explain what it was. She packed up her cart and continued north.

The letter is in the pack. The Emberstone burned noticeably brighter after she left.

Will's ledger entry: "Day 7. Letter acquired. Fogmere intelligence received. Mira. Documented."`,

  // Sets has_letter = true, mira_tip = true
  great: `Mira is packing up when the morning arrives — cart loaded, mug rinsed, pack on her shoulders. She pauses when she sees Chip coming. She looks at the Emberstone. Something in her expression settles.

"You're later than I hoped," she says. "But you're here."

She takes the letter out first, holds it out. "Cartographers in Thornwick. Don't read it." Then, while Chip is still processing that: "Fogmere's ahead. Second day in you'll hear something moving in the grey. Low to the ground. If it's moving toward the road, follow it. Don't ask what it is."

She's moving before the group arrives. Brent asks who that was. Chip says he's not entirely sure. Kevin says: "someone who's been through the Fogmere more than once and was still willing to wait."

The letter is in the pack. The information about the second day turns out to be accurate.

Will: "Day 7. Letter acquired. Fogmere tip. Mira. Documented."`,

  // Sets has_letter = false, mira_tip = false
  good: `Mira is at the bend in the road when the morning catches up to her — just barely, the cart moving at the pace of someone who left a while ago. The group calls out. She turns, assesses the distance, makes a decision, and lifts one hand in acknowledgment before continuing.

Whatever she was carrying, she's still carrying it. Whatever she knew about the road ahead, she kept it.

Kevin, from the back of the group: "we almost had something there."

Will notes the near-miss without editorializing. The waypost marker has a fresh notch cut into it — her mark, just made. The wood is still pale where the blade went in.

The Fogmere is ahead. Nobody in the group knows what to expect from it. The notch in the waypost is the only thing she left.`,

  // Sets has_letter = false, mira_tip = false
  struggle: `Someone was here.

The evidence: a circle of flattened grass where a cart parked, a faint ring on the milestone stone where a mug sat, a notch cut fresh into the waypost. The wood inside the notch is still pale. Whoever it was, they were here within the hour.

They're gone now. The road north is empty.

Kevin looks at the notch for a moment.

"She waited as long as she could."

He doesn't say who. He starts walking south. The group follows.

The Fogmere is ahead. The waypost holds its fresh mark. Whatever was meant to travel with the pack is still traveling with someone else.`,

};


// ── DAY 12 — THE MURK-CRAWLER — The Fogmere ──────────────────────────────────
// Fires: quest day 12
// Sets: fogmere_riddle = true (blazing/great/good_with_tip)
// Conditions incoming: mira_tip (changes outcome for struggle)
// NOTE: struggle + mira_tip = floors to good_with_tip minimum

const DAY_12 = {

  // Sets fogmere_riddle = true
  // Condition: blazing (any mira_tip state) OR great (any mira_tip state)
  blazing_great: `The murk-crawler appears at the edge of the stone's light — low to the ground, armored in overlapping plates the color of wet slate, moving at the specific unhurried pace of something that has never doubted its direction. Entirely blind. Navigating by sensing the dryness at the Fogmere's edge.

Chip stops.

He remembers exactly what Mira said. Low to the ground. Moving toward the road. Follow it.

He follows it.

The group falls in behind him without being asked. They move through the densest part of the Fogmere in a line, the murk-crawler's pace just fast enough that losing it would be easy if you looked away. Chip doesn't look away.

An environmental consultant who has spent years cataloging what lives in grey hours knows that the creatures best adapted to fog are the ones that don't navigate by sight — that read the air itself, the specific chemistry of moisture and dryness, finding the exit the way water finds low ground. This murk-crawler has been doing this since before the road existed. It will be doing it after.

At a point where the fog thickens into near-total grey the murk-crawler stops. It turns to face a direction Chip hasn't been facing. The grey heron is there — still, tall, standing at the edge of a small clearing the fog doesn't quite fill, the way fog sometimes makes exceptions for things that have been somewhere long enough.

The murk-crawler turns around and moves back the way it came. Its job is done in this direction.

The heron looks at the group. Then specifically at Chip.

"Something travels with you," it says, "that you did not pack."

The riddle, in full:

I have no mouth but I speak to those who stop.
I have no eyes but I see who is lost.
I grow heavier the longer you carry me
and vanish the moment you set me down.
What am I?

The fog holds the question. The clearing holds the heron. The group looks at each other.

The heron says nothing further. The Fogmere works on its own schedule and tonight the schedule says: carry this. Tomorrow it says something else.

Brent: "is it a feeling?"
Kevin: "sleep on it."
Will: "Day 12. The murk-crawler. The heron. The riddle. Documented. Answer pending."`,

  // Sets fogmere_riddle = true
  // Condition: good WITH mira_tip (saved from struggle)
  good_with_tip: `The murk-crawler is moving when Chip sees it. Low to the ground. Moving toward the road.

He remembers what Mira said. He doesn't remember everything — the morning cost something and the fog is thick — but he remembers that. Low to the ground. Moving toward the road. Follow it.

He follows it on faith rather than knowledge. The group follows him.

The murk-crawler moves faster than expected through the densest section. Chip keeps pace. At the clearing it stops, turns toward the heron, and Chip arrives two steps behind it.

The heron looks at him. Then at the group still catching up. Something in the way it holds its stillness suggests it was expecting more preparation than this.

It asks the riddle anyway:

I have no mouth but I speak to those who stop.
I have no eyes but I see who is lost.
I grow heavier the longer you carry me
and vanish the moment you set me down.
What am I?

The murk-crawler turns back without ceremony. Chip stands in the clearing with the riddle and no lore to put around it. The tip got him here. It didn't tell him what to do once he arrived.

Tomorrow. The heron will still be here.

Will: "Day 12. The murk-crawler. The heron. The riddle. Mira's tip applied. Documented. Answer pending."`,

  // Sets fogmere_riddle = false
  // Condition: good WITHOUT mira_tip
  good_no_tip: `Something is moving in the grey.

Low to the ground, moving southeast. Chip sees it. No context for what it is — Mira's tip never arrived. He follows on instinct.

The group follows Chip.

The murk-crawler moves at its own pace through the densest section. Chip keeps close. At the clearing it stops and turns toward the heron — but before the handoff completes the murk-crawler moves on, faster than expected, and the clearing empties before the full weight of what was happening registers.

The heron was there. Chip saw it. He didn't know what it meant.

Tomorrow it will still be there. The Fogmere holds its questions patiently.

Kevin, on the road after: "you saw it."
Chip: "yeah."
Kevin: "that's something."`,

  // Sets fogmere_riddle = false
  // Condition: struggle WITHOUT mira_tip
  // NOTE: struggle WITH mira_tip is impossible — tip floors to good_with_tip
  struggle: `Something is moving in the grey.

Low to the ground, heading northwest. Chip follows it.

The group follows Chip.

For twenty minutes they move deeper into the Fogmere — away from the road, away from the path the stone would light if they stopped to look at it. The thing ahead stays just visible, just far enough to seem worth following, moving with the specific unhurried pace of something that knows exactly where it is going.

At some point Chip realizes the stone is dimmer than it should be. At some point he realizes the path underfoot has changed texture. At some point he stops.

"Where are we," Brent says.

Kevin looks around. "We went northwest," he says. "The road is back southeast."

Brent: "how do you know."

Kevin: "the stone is dimmer going forward than it is going back. We're moving away from the morning."

The thing they were following is gone. Whatever it was, it is not the murk-crawler. The murk-crawler went southeast. It always goes southeast. Mira knew that. Mira would have said that. Mira was at the waypost marker and Chip was not.

The group navigates back by stone-light. It takes an hour. Brent suggests the thing they followed might have been an echo of something. Kevin says an echo isn't a thing that moves. Brent says he means like a shadow of it. Kevin says that's not what echo means. Brent says he knows what echo means.

Nobody finds the murk-crawler. Nobody finds the heron. The Fogmere holds its business today.

Kevin, once they're back on the road: "something else was moving out there too. The right thing. Southeast."

He says it without judgment. The judgment is in the saying.`,

};


// ── DAY 13 — THE HERON — The Fogmere Answer ──────────────────────────────────
// Fires: quest day 13
// Sets: nothing
// Conditions incoming: fogmere_riddle (has riddle or not)
// NOTE: If fogmere_riddle = false AND today = blazing/great, heron found independently

const DAY_13 = {

  // Condition: fogmere_riddle = true, blazing today
  has_riddle_blazing: `The heron is where they left it.

The clearing holds the same stillness. The heron looks at the group arriving and waits.

Brent tries first. "An echo?"

The heron: "An echo needs a voice to follow. This makes its own."

Kevin: "Fear."

The heron: "Fear can be outrun. You know this already."

Will says nothing. He is watching Chip.

Chip has been carrying the riddle since yesterday. Not constantly — the fog doesn't allow for constant thinking, it softens, it interrupts. But in the gaps he has been turning it over.

Grows heavier the longer you carry it. Vanishes the moment you set it down — except it doesn't, not really, it just feels that way until the next morning when it's back. No mouth but speaks to those who stop. No eyes but sees who is lost.

He knows this thing. He has been carrying it longer than this campaign. He knows exactly what it weighs.

"Doubt," he says.

The heron is still for one moment. Then it steps aside.

Behind where it stood: a path through the fog, visible, straight, lit by something that isn't the Emberstone. The shortest way out of the Fogmere's worst section.

The group moves through it without speaking. The fog on either side is the same grey it has always been. The path between it is clear.

Kevin, once they emerge: "you knew it before you said it."

"Yeah," Chip says.

"How long."

"Since the murk-crawler."

Will: "Day 13. Doubt. The path opened. Documented."`,

  // Condition: fogmere_riddle = true, great today
  has_riddle_great: `The heron waits in the clearing.

Brent: "Memory."
Heron: "Memory softens. This does not."

Brent: "Regret."
Heron: "Regret points backward. This has no direction."

Kevin looks at Chip. Chip looks at the riddle as he has been carrying it since yesterday. Grows heavier. Vanishes when set down. Sees who is lost.

"Doubt," Chip says.

Kevin: "yeah."

The heron steps aside. The path opens.

Brent: "I was going to say doubt."
Kevin: "you said memory."
Brent: "after memory I was going to say doubt."
Will: "Day 13. Doubt. Group approach. Chip answered. Documented."

The path through the Fogmere's worst section opens ahead of them. Clear, straight, lit by something that isn't the stone.

The murk-crawler is somewhere southeast, already on its next crossing. It doesn't know any of this happened. It never does.`,

  // Condition: fogmere_riddle = true, good today
  has_riddle_good: `The heron is there. The riddle has been in the pack since yesterday.

The group tries. Brent says fear. Kevin says echo. Chip turns it over — the heaviness of it, the way it vanishes when you think you've set it down only to find it back by morning.

"Something like doubt," he says. "The feeling before doubt. The thing that makes you stop before you've decided to stop."

The heron is still. This is not the answer but it is the shape of the answer. The heron has been here long enough to know the difference between someone who doesn't know and someone who almost does.

It doesn't step aside. But it doesn't leave either.

The group moves on without the shortcut. The answer sits in the pack alongside everything else — carried, almost-resolved, slightly lighter than it was but not all the way down.

Kevin, on the road out: "you had it."

"Almost," Chip says.

"Almost is its own answer," Kevin says. "Just not the one the heron accepts."`,

  // Condition: fogmere_riddle = true, struggle today
  has_riddle_struggle: `The clearing is there. The heron is there. The riddle has been in the pack since yesterday.

The group tries. Brent says echo. Kevin says fear. Chip turns it over the way he has been turning it over since day 12 and the fog does what the fog does — softens, interrupts, makes the thinking heavier than it already is.

The heron waits with the patience of something that has heard every wrong answer the Fogmere has produced and will hear every wrong answer it will ever produce and has reached no conclusions about any of them.

Eventually it moves. Not dramatically — it simply steps back into the fog the way it stepped out of it, with the unhurried certainty of something that has other clearings to stand in.

The shortcut closes.

Brent: "was it fear?"
Kevin: "no."
Brent: "memory?"
Kevin: "no."
Brent: "what was it."
Kevin: "something we were carrying the whole time."

They navigate the long way. The fog is the same grey it has always been. The answer is still in the pack, unresolved, heavier than when they arrived.

Will: "Day 13. The heron left. Shortcut closed. Documented."`,

  // Condition: fogmere_riddle = false, blazing today (finds heron independently)
  no_riddle_blazing: `The heron is in the grey without the murk-crawler's introduction — just there, in a thinning of the fog that might be a clearing or might be the fog making an exception for something that has been here long enough to deserve one.

Chip finds it before the group. He stops. The heron looks at him with the patience of something that has been waiting for a specific kind of morning.

"Something travels with you," it says, "that you did not pack."

The riddle, in full:

I have no mouth but I speak to those who stop.
I have no eyes but I see who is lost.
I grow heavier the longer you carry me
and vanish the moment you set me down.
What am I?

No yesterday to draw from, no murk-crawler's context, no group behind him yet. Just Chip and the heron and the riddle arriving all at once.

He sits with it. The fog presses the edges of the clearing. The group arrives and he holds up one hand — not yet.

He thinks about the heaviness. About the thing that vanishes when you set it down but is always back by morning. About what it means to see who is lost without having eyes for it.

"Doubt," he says.

The heron steps aside. The path is there — shorter than the full shortcut, a correction rather than the whole answer, but real.

Will: "Day 13. Heron found independently. Doubt. Partial path. Documented."`,

  // Condition: fogmere_riddle = false, great today (finds heron independently)
  no_riddle_great: `Kevin spots the clearing first — the specific thinning of fog that marks something that has been in one place for a very long time. The group moves toward it.

The heron offers the riddle unprompted:

I have no mouth but I speak to those who stop.
I have no eyes but I see who is lost.
I grow heavier the longer you carry me
and vanish the moment you set me down.
What am I?

The group works it together. Wrong answers first — Brent, then Kevin, each rejected with one line. Chip gets there.

"Doubt."

The heron steps aside. The path opens — shorter than the full shortcut but real.

Will: "Day 13. Heron found independently. Doubt. Group approach. Documented."`,

  // Condition: fogmere_riddle = false, good today
  no_riddle_good: `Another morning in the Fogmere. The stone holds. The road continues.

Somewhere in the grey the heron stands in its clearing with its question. The murk-crawler moves southeast on its ten-thousandth crossing. The shortcut exists whether or not anyone finds it today.

The group navigates through the fog the way they have been navigating — by stone-light and proximity and the general agreement that forward is forward even when forward is hard to locate.

They emerge on the other side. That is the day.

Kevin: "some days the Fogmere just takes what it takes."
Will: "Day 13. Through it. Documented."`,

  // Condition: fogmere_riddle = false, struggle today (both days struggle)
  no_riddle_struggle: `The Fogmere keeps its business today.

The stone lights three steps. They take three steps. The stone lights three more. There is no clearing, no murk-crawler, no heron, no riddle — just the grey and the road and the question of whether the stone still burns when there is nothing to burn toward.

It still burns. That is the day.

Somewhere in the fog the murk-crawler moves southeast on its ten-thousandth crossing, indifferent to whether anyone follows. Somewhere in a clearing that the fog makes an exception for a grey heron stands with a question nobody is coming to answer today.

The Fogmere doesn't hold this against anyone. It is simply what it is.

Kevin: "some days the Fogmere just takes what it takes."
Will: "Day 13. Through it. Documented."`,

};


// ── DAY 18 — THE ARCHIVE — Thornwick ─────────────────────────────────────────
// Fires: quest day 18
// Sets: archive_tier_18, knows_senna, knows_roan
// Conditions incoming: has_letter
// NOTE: 8 variations (4 archive tiers × 2 letter states)

const DAY_18 = {

  // Sets archive_tier_18 = blazing, knows_senna = true, knows_roan = true
  // Condition: blazing today, has_letter = true
  blazing_with_letter: `The cartographers' archive opens before the village does. A single lamp in the window, a door that isn't locked for anyone who arrives before the third hour. Chip arrives before the lamp has burned down to its first mark.

The archive is one long room lined floor to ceiling with ledgers organized by campaign number. The index is a separate volume. He finds it, opens it, and starts reading.

Elara's entry is in the fourth volume from the left, third shelf. He almost misses it because it isn't filed under her name — it's filed under her campaign number, which is 7,441. He sits with her pages for twenty minutes.

She grew up two days east. Youngest of four. Left at nineteen. The early entries are short and uncertain, the handwriting of someone still learning what to record. By the third campaign the entries are extraordinary — threshold descriptions so precise the cartographers kept them as reference documents. Her last entry ends not with a stop but with a cartographer's note: account continues in the summit archive. We don't have the rest.

There is a summit archive. Nobody has mentioned this.

He finds Roan's entry twenty minutes later. Campaign 9,847. The wake times are logged to the minute. Stone brightness rated on a scale she invented herself and annotated in the margin. She was a surveyor before the children. After the children she stopped traveling and then one morning started again — not because the life she'd built was wrong but because she could feel the edges of it and wanted to know what was past them.

The entry stops mid-sentence on day 47: the stone this morning was the clearest it has been since —

Cartographer's margin note: further than expected.

A second note in a different hand, added later: P. came back for the ledger. Asked us to keep it. We kept it.

Petra. Her daughter came back for her mother's record.

He sits with that for a moment.

The field contacts ledger is at the back of the archive. He finds it with twenty minutes still remaining before the archive fills with the day's business.

Senna's entry is brief. Name, region, specialty: advance survey, Greywood and eastern approaches. A note in a different hand: moves faster than the surveys. Reports when she chooses. Reliable. And below that, in a third hand, much older: don't follow her unless she wants to be followed.

One personal note, the only first-person writing she ever submitted, from eight years ago: I found my father's first survey marker last season. Still standing. I left it.

He closes the ledger. The archive is beginning to fill with the morning's cartographers. He has what he came for without knowing he was coming for it.

The cartographer who receives Mira's letter is a compact man with ink-stained fingers who reads it twice before looking up.

"She found another one," he says. "That's three in that region now."

Chip asks what that means. The cartographer looks at him with the specific patience of someone who has explained this many times to many travelers.

"We don't map places," he says. "We map thresholds. The exact points where the road changes the person walking it. The Fogmere edge. The spot in the Pass where something settles that was unsettled. The place on the Ashfields where the Pull runs out of material." He taps the letter. "Mira found one we didn't have. Two seasons she carried that, waiting for the right traveler."

He looks at the Emberstone.

"You've already crossed four of ours. Probably didn't notice either."

He doesn't ask Chip to stay and discuss it. The data point has been received. That's the work.

Will's ledger entry for day 18: "Archive accessed. Elara. Roan — she had a daughter named Petra. Senna in the field contacts. Letter delivered. Four thresholds crossed. Documented."

For Will that entry is practically a novel.`,

  // Sets archive_tier_18 = blazing, knows_senna = true, knows_roan = true
  // Condition: blazing today, has_letter = false
  blazing_no_letter: `The archive opens before the village does. Chip arrives before the lamp has burned to its first mark.

He finds Elara. He finds Roan — her meticulous wake times, the scale she invented for stone brightness, the entry that stops mid-sentence on day 47, Petra coming back for the ledger. He sits with that.

He finds Senna in the field contacts at the back. The note about her father's survey marker. Don't follow her unless she wants to be followed.

The compact cartographer with ink-stained fingers finds him there and asks if he's carrying anything from a field contact named Mira.

Chip says no.

The cartographer nods. "She finds travelers she trusts," he says. "Takes her time about it." He pauses. "You came through the Fogmere?"

Chip says yes.

"She would have been on the Amber Road around day seven. You might have been close."

He explains the threshold work anyway — what the cartographers map, why, how long they've been doing it, the fact that Chip has already crossed four of their documented points without knowing.

The data is in the archive whether the letter arrives or not. Chip is a data point regardless.

Will: "Day 18. Archive accessed. Elara. Roan — daughter named Petra. Senna. No letter. Four thresholds crossed. Documented."`,

  // Sets archive_tier_18 = great, knows_senna = true, knows_roan = false
  // Condition: great today, has_letter = true
  great_with_letter: `The archive is open when the morning arrives. Chip has a reasonable window before the day crowds in.

He finds Elara in the fourth volume. Her extraordinary middle entries, the threshold descriptions the cartographers kept as reference. Her last entry ending with the note: account continues in the summit archive.

He sits with that. There is a summit archive. He files it away.

He finds Senna in the field contacts ledger. The sparse entry, the three hands, the note about her father's survey marker still standing. Don't follow her unless she wants to be followed.

He runs out of time before he reaches Roan. The archive is filling up. He notes the campaign number — 9,847 — for later.

The compact cartographer receives Mira's letter with both hands, reads it twice, looks up.

"She found another one. Three in that region now."

He explains the threshold work — what they map, the Fogmere edge, the Pass needle point, the four Chip has already crossed. He is slightly more expansive than he would be with someone who hadn't carried Mira's letter. The letter is a credential of a kind.

"Two seasons she held that," he says. "Waiting for someone going south."

Brent, from outside where the group has been waiting: "Papi how long does an archive take."

Will, also outside: "as long as it takes."

Brent: "that's not an answer."

Will: "Day 18. Documented."

Chip comes out with Elara and Senna in his head and the threshold explanation settling into the pack alongside everything else. He didn't get to Roan. The campaign number is written in the ledger's margin in his handwriting. He'll know what it means if he ever comes back.`,

  // Sets archive_tier_18 = great, knows_senna = true, knows_roan = false
  // Condition: great today, has_letter = false
  great_no_letter: `The archive is open. Chip has a reasonable window.

He finds Elara. He finds Senna in the field contacts — sparse entry, three hands, the father's survey marker, don't follow her unless she wants to be followed.

He doesn't reach Roan before the archive fills.

The compact cartographer finds him at the field contacts ledger and asks about Mira.

Chip says he didn't meet her.

The cartographer absorbs this the way you absorb information that doesn't surprise you but still costs something. "She would have been on the Amber Road around your day seven," he says. "Moving north."

A pause.

"She's been carrying something for two seasons. Waiting for the right traveler going south." He looks at the Emberstone. "She might have been waiting for you specifically."

He explains the threshold work anyway. What they map. Why. The four points Chip has already crossed. The data point he represents regardless of whether the letter arrived.

Outside Brent is asking Will how long archives take. Will is not answering. Kevin has found a wall to lean against and appears to have been there for some time.

Chip comes out with Elara and Senna and the threshold work and the specific weight of almost having been the right traveler on the right road at the right time.

Kevin, looking at him: "you missed something on day seven."

"I know," Chip says.

"It's okay," Kevin says. "The road keeps accounts."`,

  // Sets archive_tier_18 = good, knows_senna = true, knows_roan = false
  // Condition: good today, has_letter = true
  good_with_letter: `The archive is open but the morning is already busy. One window of time, one section of the records, no wandering.

He goes to the field contacts ledger directly — something about the Greywood ahead makes him want to know what the cartographers know about it. He finds Senna's entry. Reads it fully. The three hands, the sparse details, don't follow her unless she wants to be followed. The note about her father's survey marker: still standing. I left it.

He closes the ledger. He didn't get to Elara. He didn't get to Roan. The archive holds what it holds and today it held one thing.

The compact cartographer receives Mira's letter. Reads it once. Looks up.

"She found another one."

He says it more to himself than to Chip. Then he looks at the Emberstone and says: "you carried this from the Amber Road?"

Chip says yes.

"She's particular about who she gives those to." A brief pause. "The cartographers map thresholds — the points where the road changes the person on it. She found one we didn't have. You brought it home."

He doesn't elaborate further. The data point has been received. Chip is briefly a part of something larger than the quest without fully understanding what that something is.

That's enough for today.`,

  // Sets archive_tier_18 = good, knows_senna = true, knows_roan = false
  // Condition: good today, has_letter = false
  good_no_letter: `The archive is open. One window of time, one section.

He finds Senna in the field contacts ledger. Reads the entry fully. Closes the ledger.

The compact cartographer finds him on the way out and asks about Mira.

Chip says he didn't meet her.

The cartographer nods slowly. "Day seven on the Amber Road," he says. "Moving north. She would have stopped at the waypost marker."

He doesn't say what she was carrying. He doesn't say what was missed. He looks at the Emberstone once and then looks away.

"Safe road," he says.

Outside Kevin is leaning against the wall. He looks at Chip's face and doesn't ask what happened in there.

"The Greywood's next," Kevin says.

"Yeah," Chip says.

"Something worth knowing in there?"

Chip thinks about Senna's entry. The survey marker her father left. Still standing. I left it.

"Maybe," he says.`,

  // Sets archive_tier_18 = struggle, knows_senna = false, knows_roan = false
  // Condition: struggle today, has_letter = true
  struggle_with_letter: `The archive opens at the third hour. Chip arrives after the third hour.

A junior cartographer at the door explains this without unkindness. The records are available to travelers during archive hours. Archive hours began at the third hour. He is welcome to return tomorrow.

There is no tomorrow in Thornwick. The road continues today.

He delivers Mira's letter at the cartographers' office — third building on the left, door always open for correspondence. The compact cartographer receives it, reads it twice, looks up.

"She found another one."

He says it with the satisfaction of someone whose work just got more complete. Then he looks at Chip.

"Two seasons she held this. Waiting for the right traveler."

A pause while he registers that the right traveler is standing in front of him having just missed the archive hours.

He explains the threshold work briefly — what they map, why it matters, the four points Chip has already crossed without knowing. He keeps it short. The data point has been received. That's the work.

Chip stands outside the closed archive door for a moment on his way back to the group.

Through the window: shelves of ledgers, a lamp burning, the morning's cartographers at their work.

He delivered the letter. That's what he had.

Will: "Day 18. Letter delivered. Archive closed. Four thresholds crossed. Documented."`,

  // Sets archive_tier_18 = struggle, knows_senna = false, knows_roan = false
  // Condition: struggle today, has_letter = false
  struggle_no_letter: `The archive opens at the third hour. Chip arrives after the third hour.

The junior cartographer at the door explains the hours. Chip nods. The door stays closed.

The compact cartographer finds him outside and asks about Mira.

Chip says he didn't meet her.

The cartographer looks at him for a moment with the expression of someone updating a record internally.

"She was on the Amber Road around your day seven," he says. "She's been carrying something for two seasons."

He doesn't say what. He looks at the closed archive door and then at the Emberstone and then back at Chip.

"Safe road," he says.

That's all.

Brent, when Chip rejoins the group: "how was the archive?"

Chip: "closed."

Brent: "Papi."

Kevin doesn't say anything. He starts walking. The group follows.

The Greywood is ahead. Thornwick holds its records. The cartographers map thresholds that Chip has been crossing without knowing they were there.

The road continues whether or not you know what you're walking through.`,

};


// ── DAY 22 — THE HOLLOW — The Greywood ───────────────────────────────────────
// Fires: quest day 22
// Sets: nothing (standalone)
// Conditions incoming: none

const DAY_22 = {

  blazing: `The hollow is at the base of one of the oldest trees in the Greywood — a space the tree grew around over centuries, not carved, not built, just gradually enclosed by wood that had nowhere else to go. Chip finds it before the group.

He crouches at the entrance and reads the ash the way you read ash when you've spent years reading what the ground says about what happened on it. Hardwood. Hot burn, short duration. Someone who knew how to make a fire that would be out by morning but still warm at dawn. Twelve to eighteen hours ago.

The symbol on the curved interior wall repeats seven times in a spiral — pressed into the wood with something narrow and deliberate. He has seen this symbol before. Not in the Greywood. In the field contacts ledger in the Thornwick archive, in a section about advance surveyors who mark their routes for cartographers who follow.

Wayfinder mark. Someone moving parallel to the road through the Greywood, faster than the group, on a line slightly north of the compass bearing.

He photographs the symbol. He notes the angle of the spiral's terminus — the direction it points. Slightly north of southeast. Someone moving ahead of them, not behind.

The group arrives while he's still crouching.

Brent: "what is this place"
Chip: "a camp. Recent. Someone who knows the Greywood well enough to make a fire that doesn't leave smoke."
Kevin: "how recent."
Chip: "last night. Maybe early this morning."
Will: "Day 22. Hollow. Wayfinder symbol. Bearing noted. Documented."

Kevin looks at the symbol for a long time. He doesn't say what he's thinking. He almost never says what he's thinking.

They continue south. Someone is moving through the Greywood parallel to them, faster, on a line slightly north of theirs. Chip knows the symbol. In two days he'll know the person.`,

  great: `The group finds the hollow together — Brent spots the opening in the tree roots and calls everyone over. They crowd around the entrance.

The fire ring is recent. Chip can tell that much — the ash hasn't settled the way ash settles after two or three days. Last night, probably. Maybe early this morning.

The symbol on the wall repeats seven times. Will copies it into the ledger with precise strokes. Chip looks at it for a while. He has a feeling he's seen something like it before — in the archive, maybe, in the field contacts section — but the exact connection won't come.

"Wayfinder mark," Kevin says. Quietly. Like he's said it before.

Brent: "what does that mean."
Kevin: "someone marking their route. Moving through the Greywood on a parallel line."
Brent: "ahead of us or behind."
Kevin: "the spiral points forward. Ahead."

Chip looks at the angle of the terminus. Slightly north of their bearing. Someone faster, on a better line.

They note it and continue. The symbol is in the ledger. The bearing is roughly sensed. In two days something will step onto the path and the group will have more context than they would have had without the hollow.

Will: "Day 22. Hollow. Symbol copied. Recent camp. Documented."`,

  good: `Brent finds the hollow. He calls the group over. They look at it from outside.

The fire ring is there. The symbol is there. The ash is cooler than yesterday's would be.

Chip looks at it from the doorway. The space is tight. The symbol means something he can almost place — the spiral, the specific angle of it, something in the repetition. He takes a photo.

"Recent camp," he says. "Symbol means something. I can't place it."

Kevin: "take a photo."
Chip: "I did."
Kevin: "good."

They move on. The bearing goes unnoticed. The symbol sits in Chip's camera roll alongside thirty other photos from the road, waiting for the moment it becomes relevant.

In two days it will become relevant.

Will: "Day 22. Hollow. Symbol photographed. Documented."`,

  struggle: `The group passes the hollow at the pace of a morning that is fine but not remarkable. Kevin notices the opening in the tree roots and stops. The group stops. Chip is thirty meters ahead.

They call him back. He comes back. He looks at the hollow from outside, sees the fire ring, sees the symbol. Says hm. He's cold and the morning already cost something and the road is right there.

"Could be anything," he says.

Kevin looks at him. Then at the symbol. Then he takes a photo without saying anything and puts his phone away.

"Let's keep moving," Chip says.

They keep moving.

In two days something will step onto the path and Kevin will have context that Chip doesn't. This is not the first time on this road that Kevin has quietly held something Chip walked past.

Will: "Day 22. Hollow. Symbol. Kevin photographed it. Documented."`,

};


// ── DAY 24 — SENNA — The Greywood ────────────────────────────────────────────
// Fires: quest day 24
// Sets: knows_maren (blazing/great on knows-senna track only)
// Conditions incoming: knows_senna (from day 18 archive)
// NOTE: 8 variations — 4 tiers × 2 senna-knowledge states

const DAY_24 = {

  // ── DOESN'T KNOW SENNA (struggle day 18) ──────────────────────────────────

  // Sets knows_maren = false
  doesnt_know_blazing: `She steps onto the path directly ahead — small pack, moving at a pace that makes the group's look unhurried. She stops when she sees Chip. Her eyes go to the Emberstone immediately, then to his pack, then to his face.

She doesn't introduce herself. She looks at him the way someone looks at a thing they've been watching from a distance for long enough to have formed an opinion about.

"You found the hollow," she says.

Chip says yes.

"Read the symbol?"

He says yes — wayfinder mark, bearing slightly north of southeast, someone moving ahead of them on a parallel line.

Something in her expression shifts. Not surprise. Recalibration.

"I'm Senna," she says. "I survey the Greywood for the cartographers. Among other places." A pause. "The hollow was mine."

Chip says: "the murk-crawler route in the Fogmere. That was in your survey reports."

She looks at him. "You read the archive."

"I tried to."

"You found the field contacts section."

"Yes."

She is quiet for a moment. Then: "Ridge." Just that word. Then she looks past him at the group arriving behind him.

"There's a cairn on the Ridge," she says. "Names in the base stones. Look for the one that appears twice. Different handwriting. Decades apart."

Chip asks whose name it is.

"My mother's," she says. "Maren. She stopped on the Ridge on her first campaign. I went back and added her name again after I finished mine." A pause. "I wanted the Ridge to know she got there eventually. Through me."

She continues north before the group fully arrives. Brent watches her go.

"Who was that."
Kevin: "Senna."
Brent: "how do you know."
Kevin: "Chip just told us."

Will: "Day 24. Senna. The cairn. Maren. Documented."`,

  // Sets knows_maren = false
  doesnt_know_great: `She's moving fast and nearly past the crossing point when the group comes around the bend. She stops. Takes in the group, the stone, the pack. Her eyes rest on Chip for a moment.

"The hollow on the third ridge line," she says. Not a question.

Kevin says yes.

She nods. She looks at Chip. "Ridge." The one word, complete.

Then: "There's a cairn. Look for the name that appears twice."

She moves on before anyone can ask whose name. Brent watches her go.

"Did she just — is that helpful? Will, document that she was confusing."

Will: "Day 24. Unknown woman. Ridge. Cairn. Name appears twice. Documented."

Kevin looks at the crossing point for a moment. Then he starts walking south.

Chip thinks about the cairn. He doesn't know why. He will.`,

  // Sets knows_maren = false
  doesnt_know_good: `They hear her before they see her — movement in the canopy above, parallel to the path, keeping pace. It continues for twenty minutes. Then it stops.

A figure crosses the path fifty meters ahead. Small pack. Fast. She doesn't look back.

Kevin says: "that's not a coincidence."

Brent says: "should we call out?"

By the time they agree she's gone. But on the tree at the crossing point, at eye level, freshly made — the same symbol from the hollow on day 22.

Made recently. For them, probably.

Will photographs it. "Day 24. The symbol again. Someone is tracking our route."

Kevin looks at it for a moment. He doesn't say what he's thinking. He almost never says what he's thinking.

The Greywood continues. Somewhere ahead and slightly north something moves faster than the road.`,

  // Sets knows_maren = false
  doesnt_know_struggle: `She crosses the path while Chip is at the back of the group, twenty meters behind, moving at the pace of a man who answered his alarm but hasn't fully arrived yet.

The rest of the group sees her stop, look at them, look past them toward Chip, make a small adjustment to her expression, and continue north.

Kevin watches her until she's gone. Then looks back at Chip.

Brent: "she looked at you, Papi. She was looking for you."

Chip: "what did she look like?"

Brent: "like someone who had somewhere to be and was deciding whether we were worth stopping for."

Kevin: "she decided."

On the tree at the crossing point: the symbol, freshly made. She left it anyway. Whatever she came to say she left in a mark on a tree instead.

Will: "Day 24. Unknown woman. Symbol left. Did not stop. Documented."`,

  // ── KNOWS SENNA (blazing/great/good day 18) ───────────────────────────────

  // Sets knows_maren = true
  knows_blazing: `She steps onto the path directly ahead and Chip recognizes her before she speaks. The name from the field contacts ledger. The three hands. Don't follow her unless she wants to be followed. I found my father's first survey marker last season. Still standing. I left it.

She stops when she sees him. Her eyes go to the Emberstone.

"You read the archive," she says.

"The field contacts section," Chip says.

"Yes." A pause. "You followed the murk-crawler."

"We did."

She looks at him for a moment with the specific attention of someone who has been watching from a distance and has now closed it. Then:

"Ridge."

And then: "There's a cairn on the highest accessible point. Names in the base stones. Look for Maren. She appears twice — my mother, thirty years apart. First time she stopped on the Ridge. Second time I added her name after I finished for her." A pause. "She never knew I went back. She was gone by then."

Chip says: "your father's survey marker. You said you left it standing."

Something in her expression shifts — not surprise, something quieter. She didn't expect the archive note to travel this far.

"He marked his first route with a stone cairn," she says. "Smaller than the Ridge cairn. His initials on the base stone. I found it last season on a Greywood survey." She looks at the trees. "Some things should stay where they were left."

She continues north. The group arrives. Kevin looks at the empty path and then at Chip.

"Senna," Chip says.

Kevin nods once. Like a door closing on something he's been carrying for a while.

Will: "Day 24. Senna. Ridge. Maren. Her father's marker. Documented."

Brent: "who is Senna and why does Kevin look like that."

Will: "Day 24. Brent asked why Kevin looks like that. Also documented."`,

  // Sets knows_maren = true
  knows_great: `She's moving fast and nearly past the crossing when Chip rounds the bend first, ahead of the group. She stops. Looks at him. Then at the Emberstone.

"You found the archive," she says.

"The field contacts section."

A small nod. The recalibration of someone who expected to remain a name in a ledger.

"Ridge," she says. Then: "There's a cairn. Look for Maren. She appears twice."

She moves before he can ask. The group arrives as she disappears into the trees.

Brent: "who was that."
Chip: "Senna. She surveys the Greywood for the cartographers."
Kevin: "among other places."

Everyone looks at Kevin.

Kevin: "it was in the archive."

It was not in the archive at the level Kevin accessed. Kevin says nothing further. The Greywood continues south.

Will: "Day 24. Senna. Ridge. Maren. Documented."`,

  // Sets knows_maren = false
  knows_good: `She's already past the crossing when the group arrives. Chip sees her back — small pack, fast, already fifty meters north and not slowing.

He knows the name from the archive. The three hands. Don't follow her unless she wants to be followed.

She wanted to be followed and he was too far back to be there for it.

The group catches up. On the tree at the crossing point: the symbol. Made recently. She left it for him specifically — the same mark from the hollow, the same wayfinder notation. Slightly north of southeast.

And below it, scratched small: Ridge.

Just the word. She couldn't give it to him directly so she left it in the wood.

Kevin looks at the mark. Then at Chip. Then at the direction she went.

"She knew you'd know what it meant," Kevin says.

Chip looks at the symbol. He does know what it means. He just didn't get to hear it from her.

Will: "Day 24. Senna. Symbol left. Ridge. Documented."`,

  // Sets knows_maren = false
  knows_struggle: `She crosses the path while Chip is twenty meters behind the group.

Brent sees her stop. Sees her look at the group, then past them at Chip still coming, then back at the group.

She says one word — "Ridge" — and continues north.

The group stands at the crossing.

Brent: "who was that."
Kevin: "Senna."
Brent: "how do you — wait, from the archive?"
Kevin: "Chip found her entry."

Chip arrives. Brent relays it: "a woman named Senna said Ridge and kept walking."

Chip stops. He knows the name. He knows the archive entry. The three hands. The father's survey marker. He was twenty meters behind when she crossed.

He looks north at the empty path.

Kevin: "she said it to the group. You heard it."

"Secondhand," Chip says.

"Still heard it," Kevin says. "The Ridge is the Ridge whether she said it to your face or not."

He starts walking south. The group follows.

On the tree at the crossing: no symbol. She left him the word and kept the rest.

Will: "Day 24. Senna. Said Ridge. Chip was twenty meters back. Documented."

Brent: "Will you didn't have to add that last part."

Will: "Day 24. Brent said I didn't have to add that. Also documented."`,

};


// ── DAY 27 — ALDRIC — The Hollow Pass ────────────────────────────────────────
// Fires: quest day 27
// Sets: nothing (standalone)
// Conditions incoming: none
// NOTE: Two poems — blazing/great/good share one, struggle has its own

const DAY_27 = {

  blazing_great_good: `The bridge at the Hollow Pass has one keeper. Aldric. Thousands of years in the same coat. The ropes move whether the wind is blowing or not — the canyon pulls at them from below, patient and yearning, the way deep things pull at the surfaces above them.

Aldric already knew the answer. He was waiting to find out if Chip did too.

You look like you left something behind. What was that, traveler.

Below the bridge the river has been cutting the same stone for a million years and is not finished.

I stopped believing I would be a different person. I left that behind.

Aldric stepped aside. Reached into his coat — a stone, smooth, from the canyon floor, warm and weathered — and dropped it into the pack.

Aldric watched him cross the way he has watched ten thousand travelers go. The safe answers. The almost-answers. The ones who stood at the edge and stepped back into safety.

And the ones who spoke honest and kept walking.

There are not many of them.

This one kept walking.`,

  struggle: `The bridge at the Hollow Pass has one keeper. Aldric. Thousands of years in the same coat. The ropes move whether the wind is blowing or not — the canyon pulls at them from below, patient and yearning, the way deep things pull at the surfaces above them.

Aldric already knew the answer. He was waiting to find out if Chip did too.

You look like you left something behind. What was that, traveler.

Below the bridge the river has been cutting the same stone for a million years and is not finished.

I stopped believing I would be a different person. I left that behind.

Aldric looked at him for a long moment. Then he stepped aside.

You know the right answer. Will you live it.

On the far side Kevin fell into step beside Chip and didn't speak until he found the words:

The stone didn't fail. It just said yes to the water one morning at a time until the canyon was formed.

The canyon holds the sound of it the way it holds everything — without preference, without judgment, for as long as it takes.`,

};


// ── DAY 32 — THE EASTERN FIRE — The Sanctuary ────────────────────────────────
// Fires: quest day 32
// Sets: bird_encountered = true (blazing/great/good), false (struggle)
// Conditions incoming: none

const DAY_32 = {

  // Sets bird_encountered = true
  blazing: `Halvard had one thing to ask of Chip during his visit to the Sanctuary.

Sit at the eastern fire before dawn.

Chip was there before the fire had competition from the sky. The Sanctuary was quiet in the specific way of a place that has been tended for a very long time.

The cedar waxwing arrived without announcement. Small. A yellow-tipped tail, a red spot on the wing like something sealed there. A black mask across the eyes — isn't looking for input.

It landed on the stone ring of the fire and looked at the flame.

An environmental consultant knows the cedar waxwing. A bird that moves in flocks, that passes berries from beak to beak down a line. A bird that shows up every year without fail not because migration compels it but because it does.

It looked at the flame for eleven minutes. Chip counted.

Then it looked at him.

Not the glancing assessment of a startled bird. The full attention of something that has decided to look. He didn't move. It held the look for a long moment.

It jumped from the stone ring onto his hand.

Less than he expected, the weight of it. Lighter than a morning you almost missed.

Chip sat with what he was holding.`,

  // Sets bird_encountered = true
  great: `Halvard had one thing to ask of Chip during his visit to the Sanctuary.

Sit at the eastern fire before dawn.

Chip was there at dawn — the sky going from black to the specific grey that comes before color, the fire the only warm thing in the cold.

The cedar waxwing arrived with the first light. Small. A yellow-tipped tail, a red spot on the wing like something sealed there. A black mask across the eyes — isn't looking for input.

It landed on the stone ring and looked at the flame.

An environmental consultant knows the cedar waxwing. A bird that moves in flocks, that passes berries from beak to beak down a line. A bird that shows up every year without fail not because migration compels it but because it does.

It looked at the flame for a while. Then it looked at him.

It jumped from the stone ring onto his hand.

Less than he expected, the weight of it. Lighter than a morning you almost missed.

Chip sat with what he was holding.`,

  // Sets bird_encountered = true
  good: `Halvard had one thing to ask of Chip during his visit to the Sanctuary.

Sit at the eastern fire before dawn.

Chip arrived after dawn. The fire was lower than it had been. At the stone ring — two small feathers, yellow-tipped. The ash disturbed in the pattern of something small that landed and left.

He sat anyway.

The cedar waxwing returned. Small. A yellow-tipped tail, a red spot on the wing like something sealed there. A black mask across the eyes — isn't looking for input.

It landed on the stone ring and looked at the flame. Then at Chip.

An environmental consultant knows the cedar waxwing. A bird that moves in flocks, that passes berries from beak to beak down a line. A bird that shows up every year without fail not because migration compels it but because it does.

It jumped from the stone ring onto his hand.

Less than he expected, the weight of it. Lighter than a morning you almost missed.

Chip sat with what he was holding.`,

  // Sets bird_encountered = false
  struggle: `Halvard had one thing to ask of Chip during his visit to the Sanctuary.

Sit at the eastern fire before dawn.

Chip was late.

At breakfast Halvard said:

The bird came this morning.

He brought his mug to his mouth.

It looked at the fire the way it always looks at the fire.

He didn't say what it looked at after that. He didn't need to. The empty space at the eastern fire had already said it.

Chip sat with what he hadn't been there to hold.`,

};


// ── DAY 34 — HALVARD'S ONE THING — The Sanctuary ─────────────────────────────
// Fires: quest day 34
// Sets: nothing
// Conditions incoming: bird_encountered
// NOTE: This is also the Chapter 7 decision day

const DAY_34 = {

  // Condition: bird_encountered = true
  bird_encountered: `Halvard had one thing to say.

He was at his fire when Chip arrived. He didn't look up immediately. The fire burned low and steady, the way it burns when it has nothing left to prove.

Then he looked up.

He said it.

What it does is get carried. In the pack, alongside the compass and the hollow stone, it goes into the road ahead and it will be there when the road needs it.

Outside Kevin was leaning against the Sanctuary wall. He looked at Chip's face the way he looks at things when he already knows the answer and is just confirming.

He didn't ask what Halvard said.

He said: you'll know when you need it.

Then he started walking.

The line between the Sanctuary's warmth and the road's cold is exact. Chip felt it the moment he crossed.

He was still carrying the fire.`,

  // Condition: bird_encountered = false
  bird_not_encountered: `Halvard was at his fire when Chip arrived. He looked up. The long honest look of someone who has been reading travelers for longer than most roads have existed.

Then he stood.

He wished Chip well on the road. Specifically, carefully — a genuine sending forth. Safe road, he said. The Ashfields will ask nothing of you except that you cross them.

He sat back down.

Outside Kevin was leaning against the Sanctuary wall. He read Chip's face the way he always reads it.

He said: the road gives back on its own schedule.

Then he started walking.

The line between the Sanctuary's warmth and the road's cold is exact. Chip felt it the moment he crossed.

The Valley would be where it arrived. Halvard knew that.`,

};


// ── DAY 39 — THE GREY MARE — The Ashfields ───────────────────────────────────
// Fires: quest day 39
// Sets: nothing (standalone)
// Conditions incoming: none
// NOTE: Two poems — blazing/great/good share one, struggle has its own

const DAY_39 = {

  blazing_great_good: `She came out of the grey
the way grace comes —
without apology, never earned.
A wild mare moving through the Ashfields
at the pace of something
that has never doubted
its direction.

No saddle. No brand.
No evidence of where she came
or what she was moving toward.
The grey parted for her.
It only parts
for things that belong to themselves
completely.

Chip walked alongside her.

The Emberstone blazed in the pack.

He didn't reach for her.

She turned her head —
full dark eyes,
the specific attention
of a creature
that has decided to see you.

Seen without agenda.
Without a mold
it wanted you to exist in.
Fully.
Without wanting anything in return.

Chip understood he was seen.

He put his arms around her neck.

The grey fell.
The Ashfields, nowhere.
The streak and the ledger
and the Pull and the road
and the days behind
and the distance still to go —
nothing.

Two sets of prints
stopped to have a moment together.

Her breath came even and slow.
The mane was rough against his face.
She smelled like rain.

And in that moment
he broke,
into blossom.

The group stood at a distance.

Kevin said:
that was a blessing.

Aye papi, added Brent.

Will wrote it down and circled it.`,

  struggle: `A wild mare was there when the morning opened.

Pale. Unhurried.
The grey parted for her
the way it parts
for things that belong
to themselves completely.

Chip saw her and felt something
he recognized —
the freedom of a creature
with no ledger,
no fellowship,
no alarm,
no road it was supposed to be on.

Just the grey
and the direction it chose
and nothing asking anything of it.

He moved toward her.

She didn't spook.
She simply
walked away —
unhurried,
the same pace,
as if the distance between them
was a thing she had decided on
and would maintain
without effort.

The grey closed behind her.

He stood where she left him.

The Emberstone held its light.
The group caught up.
Nobody said anything.`,

};


// ── DAY 42 — THE CAIRN — The Ridge of the Unremembered ───────────────────────
// Fires: quest day 42
// Sets: nothing
// Conditions incoming: knows_maren
// NOTE: 4 versions based on knowledge state + today's tier

const DAY_42 = {

  // Condition: knows_maren = true (blazing or great day 24 knows-senna track)
  knows_maren: `The cairn stands at the Ridge's highest accessible point. Stones stacked by many hands over what the base stones suggest is more than a century. The convention is simple: add your name when you pass. Remove no one else's.

Chip found it before the group.

He read every name. It took twenty minutes. Most are first names only — a few initials, one full name in formal script, dates spanning decades. The records of everyone who made it this far and stopped to say so.

Near the base: Maren. Twice. The first in handwriting weathered by thirty years. The second in the same hand, unmistakably, thirty years later.

He knew whose name it was before he finished reading it the second time.

Senna had said: I went back and added her name after I finished mine. I wanted the Ridge to know she got there eventually. Through me.

He stood with that for a moment.

The group arrived. Kevin walked directly to the cairn without being asked, found a spot near the base, and added his name in small handwriting. He didn't explain when he was here before. Nobody asked.

Brent added his name. Will added his. Chip added his below Maren's second entry — below the name that came back, below the thirty years, below the daughter who carried her mother to the summit.

The Ridge held all of it the way the Ridge holds everything — the names of the ones who stopped here and the names of the ones who didn't stop, and makes no distinction between them in the keeping.`,

  // Condition: knows_senna = true but knows_maren = false
  // (good/struggle day 24 on knows-senna track)
  knows_senna_not_maren: `The cairn stands at the Ridge's highest accessible point. Stones stacked by many hands over more than a century. Add your name when you pass. Remove no one else's.

The group found it together.

They read names. Brent read them aloud. Will copied several into the ledger. Kevin walked to the base without a word and added his name in small handwriting near the bottom. Nobody asked when he was here before.

Chip found the doubled name.

Maren. Twice. Same hand. Thirty years apart.

He stood with it. He knew the name from somewhere — not from the road, from the archive. The field contacts ledger. Senna's entry. The survey marker her father left standing.

The thread was there but incomplete. Something connected but not resolved.

He added his name. Brent added his. Will added his.

The Ridge held all of it. The doubled name sat in the base stones the way it has sat for thirty years — waiting for someone who would know what it meant.

Chip almost did.`,

  // Condition: knows_senna = false (struggle day 18)
  doesnt_know_senna: `The cairn stands at the Ridge's highest accessible point. Stones stacked by many hands over more than a century. Add your name when you pass. Remove no one else's.

The group found it together.

They read names. Brent read them aloud. Kevin walked to the base and added his name quietly near the bottom. Nobody asked.

Chip found the doubled name.

Maren. Twice. Same hand. Decades apart.

He read it twice to make sure he was seeing it right. He was.

Someone came back to the Ridge. After decades they came back and added their name again. He didn't know who. He didn't know why. The name sat in the stone and offered nothing further.

He added his name. Brent added his. Will added his.

The doubled name stayed where it had always been — in the base stones, carrying a meaning that was moving through the world without him.

The Ridge held it anyway.`,

  // Condition: struggle today (any knowledge state)
  struggle: `The cairn stands at the Ridge's highest accessible point. The group found it. Chip was moving when they stopped — the cold was real and the pace was the answer to the cold and by the time he turned around they were already there.

He came back.

Kevin was at the base adding his name in small handwriting. Will was reading names aloud to himself in the specific way Will reads things — cataloging, not performing. Brent had already added his and was looking at the view.

Chip stood at the cairn.

He looked at the names. He didn't know the convention — add your name when you pass — until Brent said it, casually, as if everyone knew. Everyone did know. He hadn't been told. Or he had been told somewhere on the road and hadn't been present for it.

Kevin finished and stepped back. Will finished and stepped back. Brent had already finished.

Chip looked at the stone in his hand. The moment for adding his name had been when the others added theirs and that moment had passed while he was figuring out what was happening.

I didn't know, he said. Nobody had told me.

Kevin looked at him. Not unkindly.`,

};


// ── DAY 52 — ROAN — The Valley Below the Peak ────────────────────────────────
// Fires: quest day 52
// Sets: nothing
// Conditions incoming: knows_roan
// NOTE: 3 versions

const DAY_52 = {

  // Condition: knows_roan = true (blazing day 18 archive)
  knows_roan: `She was coming down when the morning opened.

Small pack. The specific lightness of someone who has set something down after carrying it for a long time. She moved through the Valley with the ease of someone whose hard part was behind them.

Chip heard the sound before she arrived.

Low. Felt more than heard. The specific frequency of something that has been burning longer than the road has existed. He stood still when it came and let it move through him.

Then she came around the bend.

They stopped on the path and looked at each other like you do crossing paths on a climb — one going up, one coming down.

She looked at the Emberstone.

He looked at her.

Something in the way she held herself. The way she talked about the campaign when they started talking — specific, meticulous. The surveyor's eye. Someone who had been logging details since the beginning.

He said: Roan.

She looked at him.

How do you know that name.

Thornwick, he said. The archive. Campaign 9,847. Your entry stops mid-sentence on day 47. The stone this morning was the clearest it had been since —

She was quiet for a moment.

Petra kept the ledger, she said. I asked her not to but she kept it. She said someone should have the whole account even if I couldn't finish writing it.

A pause.

I came back three years ago. Started over. I'm four days past the summit now. Heading home.

She looked at the Emberstone again.

You're four days out, she said. The sound you heard this morning — that's the Waking Fire's reach. You're inside it now. Have been since you entered the Valley. Most people don't hear it until they're closer. You heard it here.

She looked at him with the specific attention of someone updating a record.

Petra will want to know about this, she said. That someone read the ledger. That it traveled.

She continued down.

The group stood on the path watching her go.

Will said: Roan.

Just the name. The way you say a name when it has just become real after living in a document.

Kevin watched her until she rounded the bend.

She came back, Brent said.

Kevin said: she did.

The Valley continued upward. Four days to the summit. The sound still faintly present if you stood still enough to feel it.`,

  // Condition: knows_roan = false, blazing today (Brent asks)
  doesnt_know_blazing: `She was coming down when the morning opened.

Small pack. The specific lightness of someone who has set something down after carrying it for a long time.

Chip heard the sound before she arrived.

Low. Felt more than heard. Something that had been burning longer than the road existed. He stood still and let it move through him and didn't know what it was until she came around the bend and he asked.

That's the Waking Fire, she said. Its reach extends into the Valley on still mornings. You have to be standing still before the day gets loud. Most people miss it.

She looked at the Emberstone.

You're four days out, she said. The fact that you heard it here means something. It doesn't reach this far for everyone.

Brent said: who are you.

She told them. The campaign. Coming back after years. The summit four days behind her.

Kevin watched her go.

Brent said: she came back.

Kevin said: she did.

Four days. The sound still faintly present in the Valley's still air if you stood where Chip had been standing when it arrived.`,

  // Condition: knows_roan = false, great/good/struggle today
  doesnt_know_other: `She was coming down when the morning opened.

Small pack. The specific lightness of someone who has set something down after carrying it for a long time.

They met on the path like you do crossing paths on a climb — one going up, one coming down.

She looked at the Emberstone. Then at the group.

You're close, she said.

How close, Brent said.

She thought about it.

Close enough that on a still morning — early, before the Valley wakes up — you can hear the Waking Fire. Low. You feel it more than hear it. Like something breathing that has been breathing for longer than the mountain.

She looked at Chip.

Did you hear it this morning.

Great: he had heard something. Standing still in the early cold before the group assembled — a low frequency he'd taken for the Valley's own acoustics. Maybe, he said. She nodded. That's it. You're inside its reach.

Good/Struggle: he hadn't heard anything. She nodded.

You'll hear it, she said. When you're still enough.

She continued down.

Brent: how many days do you think she meant.

Kevin looked at the Valley rising ahead of them. At the Peak above it, half in cloud.

He didn't answer.

Some distances are better walked than counted.`,

};


// ── DAY 57 — THE WAKING FIRE'S EDGE — Ashen Peak Slope ───────────────────────
// Fires: quest day 57
// Sets: nothing (standalone, one day from summit)
// Conditions incoming: none
// NOTE: Two poems — blazing/great share one, good/struggle share one

const DAY_57 = {

  blazing_great: `The slope holds heat
it has no business holding.

Chip felt it rise through his boots
the way feeling rises
through a conversation
you didn't know you needed —
before the words,
before the understanding,
just the warmth
of something
moving toward you.

He crouched and pressed his hand
to the ash.

The ash was the color of a February sky.
Beneath it something breathed
that had been breathing
since before February existed.

The Emberstone left the pack
on its own terms.

In his hand it was alive
the way a coal is alive —
not burning,
becoming.
The air around it
had the specific weight
of a room
after someone has been crying
and stopped —
changed,
settled,
honest.

The stone catches early light
the way a child catches a parent's eye
across a room —
not asking for anything.
Just finding.
Just saying:
I see you.
I have always seen you.

It was made here.

The first people who came
to this mountain
pressed their stones
against the Waking Fire
and most came back
with the same stones
they arrived with.

A few did not.

The fire kept something
in the ones it chose —
not heat,
not light,
the quality underneath both.
The thing that makes a person
get up before the argument
has finished forming.

It has been passed forward
since then
like a question
nobody has stopped asking.

Sixty mornings
and the stone knew all of them —
the ones that blazed
and the ones that barely held
and the ones the Pull
nearly won
and the answer came anyway
at the last available light.

It held all sixty
the way the body holds
every version of itself
it has ever been —
not equally,
not without preference,
but completely.

He pressed it to his chest.

Below his hand
something recognized something.

The warm circle on the slope
pulsed once —
the mountain acknowledging
what was coming home to it.

Kevin stepped into the circle.
Stood beside Chip.
Looked up.

The summit was four days of slope
and one morning of decision
and whatever the Waking Fire
does to a stone
that has earned the right
to be returned to it.

Kevin put his hand
on Chip's shoulder
and left it there
for a moment.

Brent slapped his ass
and we all started walking.`,

  good_struggle: `The slope holds heat
it has no business holding.

Someone noticed first —
Brent said papi the ground
or Kevin stopped
or the stone brightened in the pack
before anyone could explain why.

Chip crouched.

Pressed his hand to the ash.

The warmth came up through his palm
like an answer
to a question
he hadn't finished asking.

The Emberstone was bright
in his hand —
brighter than the morning
had given it reason to be,
brighter than yesterday,
catching something
nobody else could see
and refusing
to be quiet about it.

He didn't know what the circle was.
He didn't know what the stone knew.

He just held it
and felt it holding him back
and that was enough
to stand in
for a moment.

Brent slapped his ass
and they all started walking.`,

};


// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  DAY_7,
  DAY_12,
  DAY_13,
  DAY_18,
  DAY_22,
  DAY_24,
  DAY_27,
  DAY_32,
  DAY_34,
  DAY_39,
  DAY_42,
  DAY_52,
  DAY_57,
};
