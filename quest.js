'use strict';

// ── World constants ───────────────────────────────────────────────────────────

const WORLD = {
  hero:        'Chip',
  hometown:    'Wilmette',
  currentTown: 'Downers Grove',
  dog:         'Stevie',
  stone:       'the Emberstone',
  pull:        'the Pull',
  pullFull:    'the Dreaming Pull',
  destination: 'Ashen Peak',
  fellowship:  ['Will', 'Brent', 'Kevin'],
};

// ── Performance tier ──────────────────────────────────────────────────────────

const getPerformanceTier = (minutes, prevMinutes) => {
  if (minutes < 480 && minutes < (prevMinutes - 9)) return 'improving';
  if (minutes < 480) return 'good';
  if (minutes < 510) return 'standard';
  return 'struggle';
};

// ── Ember level (1 = flickering, 5 = blazing) ─────────────────────────────────

const getEmberLevel = (minutes) => {
  if (minutes < 420) return 5;
  if (minutes < 450) return 4;
  if (minutes < 480) return 3;
  if (minutes < 510) return 2;
  return 1;
};

// ── Variant rotation ──────────────────────────────────────────────────────────

const pickVariant = (chapter, tier, recentIds) => {
  const pool = chapter.variants.filter(v =>
    v.tiers.includes(tier) && !recentIds.slice(-3).includes(v.id)
  );
  if (pool.length === 0) return chapter.variants.find(v => v.tiers.includes(tier));
  return pool[Math.floor(Math.random() * pool.length)];
};

// ── Template substitution ─────────────────────────────────────────────────────

const renderText = (text, data) => {
  return text
    .replace(/\{\{checkin_time\}\}/g,   data.checkinTime    || '')
    .replace(/\{\{month\}\}/g,          data.month          || '')
    .replace(/\{\{day_of_week\}\}/g,    data.dayOfWeek      || '')
    .replace(/\{\{streak\}\}/g,         data.streak         != null ? String(data.streak) : '')
    .replace(/\{\{quest_day\}\}/g,      data.questDay       != null ? String(data.questDay) : '')
    .replace(/\{\{last_decision\}\}/g,  data.lastDecision   || '')
    .replace(/\{\{decision_echo_1\}\}/g, data.decisionEcho1 || '')
    .replace(/\{\{decision_echo_2\}\}/g, data.decisionEcho2 || '')
    .replace(/\{\{decision_echo_3\}\}/g, data.decisionEcho3 || '');
};

// ── Special narratives ────────────────────────────────────────────────────────

const SPECIAL_NARRATIVES = {
  chronicle_begins: {
    id:    'chronicle_begins',
    title: 'The Chronicle Begins',
    text:  `The ledger has five entries.

Will opened it the morning Chip's alarm was answered — not silenced, not negotiated with, answered — for the fifth time in a row in Downers Grove. He wrote the date. He wrote the time. He drew a line beneath it. Will draws a line when something has been established.

The Emberstone has been on the nightstand since Tuesday. Chip has been treating it like furniture.

It is not furniture.

The Dreaming Pull has been here longer than the quest. It lives in the gap between the alarm and the hand — that specific three seconds of warm and dark and not yet — and it is very good at what it does. It does not attack. It offers. It makes the bed feel like the only reasonable response to the morning, and then it makes tomorrow feel like a better day to start, and then it makes the weeks soft and the months indistinct, until one day you are not sure how long it has been since you meant to do something. That is the Pull's work. It is patient because it has never needed to be anything else.

But the answer has come five times. In a house designed for comfort, in a life that asks nothing of the morning, the answer came anyway.

The Fellowship assembled without ceremony. Will, who documents. Brent, who stayed despite his own predictions and finds himself genuinely surprised by what that feels like. Kevin, who has children and has not slept past their first demands in so long that the Pull gave up on him years ago and reassigned its attention elsewhere.

They are not watching for failure. They stopped expecting failure somewhere around day three. They are watching for what comes next.

Day one was last week. Day five is today.

Let's go.`,
  },

  fellowship_regroups: {
    id:    'fellowship_regroups',
    title: 'The Fellowship Regroups',
    text:  `Will updated the Hall of Campaigns. Days reached. Streak. Average wake time. The numbers without comment, because the numbers are the comment.

Then he turned to a fresh page.

No post-mortem. No inventory of what failed. A campaign fell — it falls sometimes, this is what campaigns do — and the road is still there and the fellowship is still assembled and the Emberstone is on the nightstand exactly where it was at the beginning.

The stone caught first light this morning before anything else in the room did. It always does this. It will do it again tomorrow.

Brent sent something short: "Same road. Fewer illusions about it. Let's go."

Kevin sent one word, at a timestamp that said something about his morning: "Obviously."

The road to Ashen Peak has not moved.

Let's go again.`,
  },

  personal_best: {
    id:    'personal_best',
    title: 'New Personal Best',
    text:  `{{checkin_time}} on a morning in {{month}}.

Will put three lines under the entry. That is the closest the ledger comes to shouting.

New personal best. The stone blazed.`,
  },

  before_7am: {
    id:    'before_7am',
    title: null,
    text:  `{{checkin_time}}.

The Pull was still composing its argument.`,
  },
};

// ── Campaign 1: The Emberstone Chronicles ─────────────────────────────────────

const CAMPAIGN_1 = {
  id:         1,
  title:      'The Emberstone Chronicles',
  subtitle:   'From Downers Grove to Ashen Peak',
  total_days: 60,
  chapters: [

    // ── Chapter 1 ─────────────────────────────────────────────────────────────
    {
      number:   1,
      title:    'The Sleepy Kingdom',
      location: 'Downers Grove',
      days:     [1, 5],

      milestone: `Five mornings in a house that doesn't ask for them. That's the whole setup.

The Emberstone goes into the pack. The compass isn't here yet. The hollow stone isn't here yet. What's here is the road outside and Stevie at the door and the specific feeling of being about to leave a place that has been very good to you.

Chip said something to the group chat that morning that he probably thought was casual. He said: "alright let's do this." Will wrote it in the ledger with a timestamp and no further context, because that is how Will treats anything that might become evidence. Brent said "let's GO." Kevin sent a thumbs up at a time that suggested he had been awake for two hours already and found the whole enterprise charming in a tired way.

The Pull stood in the doorway for a moment. Then Stevie moved through it and the moment was over.

The road to Ashen Peak starts in Downers Grove on a morning in an ordinary house where nothing dramatic happened, where a man answered five alarms that a comfortable life had given him every reason to ignore, where a dog with no concept of inertia simply walked outside and waited.

Five mornings in a house that didn't require them.

None of them were missed.`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c1_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The stone lit clean this morning. Not blazing — it hasn't blazed yet — but steady, the specific steadiness of something that has caught and intends to stay caught. The road ahead held a few steps of light. That is all the road ever asks. A few steps.`,
        },
        {
          id:           'c1_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `{{checkin_time}}. The stone held its light. Not every morning is a statement. Some of them just need to happen, and this one happened.`,
        },
        {
          id:           'c1_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull made a good case this morning. Patient, familiar, not unkind — it is never unkind, that is not how it works. The stone caught on the last available light and held.

Close. The answer came.`,
        },
        {
          id:           'c1_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `Earlier than yesterday. The stone caught the difference before anything else did. A small thing. The small ones are how the road gets built.`,
        },
        {
          id:           'c1_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie was at the door before the alarm had finished its thought. The Pull's argument dissolved before it had an audience.`,
        },
        {
          id:           'c1_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Pull in this house is not theatrical. It carries the specific silence of a morning where nothing is yet required, and that silence is often enough. This morning it wasn't enough. The stone lit. The ledger has a new entry.`,
        },
      ],

      missed: `The Pull won a morning in Downers Grove. It has been patient since day one, and today patience was sufficient.

The road will be there tomorrow.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c1_s1',
          quest_day:    3,
          pull_appears: false,
          text:         `Stevie was awake before the alarm had a word to say about it. The Pull was mid-argument when the dog appeared at the bedroom door with a fully formed opinion about the morning and no awareness that an argument was in progress.

The argument collapsed. It always does. The Pull has no framework for a creature that simply does not register its logic. This is, as far as anyone can tell, the Pull's only consistent vulnerability.

The stone lit. The morning was answered.`,
        },
      ],

      decision: {
        prompt:  `The alarm sounds in the grey before dawn. The house is still. The Pull settles into the quiet and waits.`,
        choices: [
          {
            id:          'c1_rise',
            label:       'Rise before the argument develops',
            consequence: `The argument never assembles. The Pull hasn't finished composing its opening case when the feet are already on the floor, and a case that can't be heard is a case that didn't happen. The stone catches first light. The road begins before the doubt does. This is the mechanical advantage of answering early — not courage, just timing.`,
          },
          {
            id:          'c1_wait',
            label:       'Lie still a moment before answering',
            consequence: `The Pull logs the pause in its long record of hesitations. It is thorough that way. The stone catches anyway — not because the pause didn't happen, but because answering at all is what the record will show. One breath of stillness in a morning that answered. The Pull notes it and moves on.`,
          },
        ],
      },
    },

    // ── Chapter 2 ─────────────────────────────────────────────────────────────
    {
      number:   2,
      title:    'The Amber Road',
      location: 'The road south',
      days:     [6, 10],

      milestone: `Ten mornings. The road has a name now.

There's a mile marker on the Amber Road — old stone, inscription worn past reading — where travelers have cut marks since before the current cartographers were born. Initials. Dates. A few symbols nobody has translated. They stop at different points down the road, the marks. Some here. Some further. The road doesn't say which ones made them on the way out and which came back.

The stone burns steadier here than it did in the first five days. Not brighter. Steadier. There is a difference. A flame that might go out feels different from one that has decided not to. The difference is not visible. It is felt.

Will's ledger entry for day ten arrived with a single line appended below the timestamp: "Double digits. This was not a given." Brent sent a separate message thirty seconds later: "What Will means is: we're genuinely impressed. He doesn't say that. I do." Kevin, from a time that told its own story, sent: "Ten. Nice." And then, three minutes later: "I mean it."

For Will, nothing further was the comment. For Brent, translating Will is an act of service he has fully committed to. For Kevin, three minutes of sitting with a thing before sending it is how Kevin is certain.`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c2_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The Amber Road is easier to find when the morning is answered early enough that the day hasn't claimed it yet. The stone lit a good stretch of it. Not the whole road — never the whole road — but further than yesterday.`,
        },
        {
          id:           'c2_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `A {{day_of_week}} on the Amber Road. The stone held. The ledger has a new entry. Some days the road is just the road and that's enough.`,
        },
        {
          id:           'c2_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried something subtle this morning — not the warmth, not the quiet, but the specific reasonableness of the road still being there in an hour. It's a good argument. It works often. Today it didn't work, but it was close enough that close is worth noting.`,
        },
        {
          id:           'c2_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `Earlier than yesterday on the Amber Road. The stone caught more of it this morning — a little further ahead, a detail that wasn't visible before. Not much. Enough.`,
        },
        {
          id:           'c2_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Someone came through this stretch before. The trail shows it — not worn exactly, but familiar in the way paths get familiar when enough people have needed them. There's a notch cut into the waypost marker at the road's first bend. Not a name. Just a mark that says: I was here and I continued. Whoever made it is gone. The mark stayed.`,
        },
        {
          id:           'c2_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The ledger entry for day {{quest_day}} arrived with a timestamp annotation: "{{checkin_time}}. The Pull had a productive morning. Documented." Will doesn't editorialize. He records. The record is the editorial.`,
        },
      ],

      missed: `One morning lost on the Amber Road. The Pull knows this stretch well — it has been working it since before the quest had a name.

The road will still be there.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c2_arrive',
          quest_day:    6,
          pull_appears: false,
          text:         `The Amber Road arrives as a smell before anything else — dust and something older underneath it, the specific scent of a path that has absorbed ten thousand mornings. The stone in the pack is warm in a way it wasn't in the house. The road notices the difference between a traveler in motion and one who is deciding whether to move.

The group chat received a photo at {{checkin_time}}. Chip had taken it of the road ahead — just the road, the amber light, the first bend. Brent replied first: "okay that looks cool actually." Will replied: "It looks like a road." Kevin replied: "I've been awake since 5. Why are you all texting." Brent replied to Kevin: "Because Chip is on a quest, keep up." Will replied to Brent: "He already knew that." Kevin replied: "Obviously I knew that. I helped name the stone."

Nobody had known Kevin helped name the stone. The conversation continued for eleven minutes.

The bend in the road at the waypost marker. The notch that somebody cut into it at some point and did not explain.`,
        },
        {
          id:           'c2_s1',
          quest_day:    8,
          pull_appears: false,
          text:         `Will's ledger methodology, for anyone who has not encountered it: one entry per morning, timestamp first, checkin time second, streak count third, a single observational note if the morning warrants one. No encouragement. No commentary on trajectory. The ledger is a record, not a conversation.

Brent has opinions about this methodology. He has expressed them, diplomatically, twice. Will acknowledged them both times with the specific silence of someone who has heard the feedback and has decided the feedback is not actionable.

Kevin, on hearing about the methodology, said: "That's just how Will loves people. He shows up and writes it down." He sent this at a time that said he had already been awake for two hours and had thought about it in the interim.

Will has not commented on Kevin's interpretation. The ledger has a new entry for day {{quest_day}}.`,
        },
      ],

      decision: {
        prompt:  `The waypost marker at the Amber Road's first bend. The notch is there. Nobody explained it.`,
        choices: [
          {
            id:          'c2_mark',
            label:       'Add your own mark to the waypost',
            consequence: `It takes thirty seconds. Something small — a date, an initial, the symbol that means you passed through and continued. The cartographers in Thornwick have a record of this waypost going back decades. The mark will be there when the road has changed everything else about this stretch. The road knows who leaves evidence of themselves and who moves through without touching anything.`,
          },
          {
            id:          'c2_forward',
            label:       'Keep moving — the road is the record',
            consequence: `The ledger Will keeps is the record. The streak is the record. The timestamps are the record. Adding something to a waypost that anyone could have made is a different kind of thing — it asks the road to remember you, and the road doesn't owe that. What you're building is in the pack and the stride and the stone, not in the wood of a marker. You pass it and keep going.`,
          },
        ],
      },
    },

    // ── Chapter 3 ─────────────────────────────────────────────────────────────
    {
      number:   3,
      title:    'The Fogmere',
      location: 'The Fogmere',
      days:     [11, 15],

      milestone: `Fifteen mornings. The Fogmere is behind them, and that sentence is the entire story.

The Fogmere has a reputation not for danger but for gradualism. Nobody fails here dramatically. They slow, and then they stop, and the fog absorbs them so gradually that by the time they notice, the road has become hypothetical. That is what it does. That is what it did not do.

The stone is still lit on the other side. That is what making it through the Fogmere looks like for anyone who does: the stone was still lit.

Brent sent something at the fifteen-day mark. Not quick, not offhand — something he had been sitting on since morning. "I want to tell you something and I need you to know I'm not just saying this. Fifteen days in the Fogmere is the part I didn't think would happen. I was wrong. I'm keeping track of the ways I'm wrong about this. The list is getting longer." He sent it at noon, which means he'd been thinking about what to say since at least ten.

Will replied to Brent in the group chat: "Your list and my ledger are the same document." Kevin sent a laughing emoji and then: "that's actually beautiful, Will." Will did not respond to this.

The air on the far side of the Fogmere is different. Not warmer. Not clearer. Just different in the way air feels when you have moved through something without knowing what it cost.`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c3_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The fog doesn't lift for anyone. But the stone burns through it — further on good mornings, less far on others. This morning it burned far. Not all the way through. Far enough.`,
        },
        {
          id:           'c3_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Another morning in the Fogmere. The stone held its light. Visibility is low here and always has been — the only reliable landmark is the stone itself, and the stone is reliable.`,
        },
        {
          id:           'c3_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull sat quietly this morning. Didn't argue, didn't push — just made itself comfortable in the grey and waited. The quiet is sometimes harder than the argument. The stone caught eventually. The road continued.`,
        },
        {
          id:           'c3_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone burned a little further into the fog today than yesterday. Not enough to see the other side. Enough to know the other side is there.`,
        },
        {
          id:           'c3_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie appeared at the bedroom door at a time that made the Pull's argument significantly harder to sustain. The Pull has opinions about the dog. None of them are useful to the Pull.`,
        },
        {
          id:           'c3_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull is as old as the dreaming place itself. It grew from the accumulated weight of every morning that asked too much, every dawn that felt like more than was fair — not a creature that was made but a force that accumulated, over a very long time, from very ordinary reluctance.

It has a different definition of good than the road does.

It was here this morning. The stone lit anyway.`,
        },
      ],

      missed: `The Fogmere claimed a morning. It does that more than anywhere else on the road — not through force but through the slow accumulation of grey.

The road is still there.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c3_arrive',
          quest_day:    11,
          pull_appears: true,
          text:         `The Fogmere arrives before you see it. The temperature drops a degree and the sound changes — not quiet exactly, more like the world has put a hand over its own mouth. The stone in the pack gets warmer as the air gets colder, which is either reassuring or concerning depending on your relationship with unexplained warmth.

In the group chat, Chip wrote: "okay the fog is real." Brent replied: "the FOG is REAL, everybody." Will replied: "Documented. Keep moving." Kevin replied, at a timestamp suggesting he had been in his own fog since 5am, with his children, and had opinions: "The fog is fine. The fog is just the fog. The fog does not care about you personally." A pause. "This is encouragement."

The Pull was already here. It did not arrive with the fog — it was waiting for the fog, the way a familiar tenant waits for the right season. It finds the grey comfortable. It always has.

Something in the way the road bends, just beyond visibility, like it knows something about this stretch that it isn't sharing yet.`,
        },
      ],

      decision: {
        prompt:  `The fog is heaviest at the chapter's midpoint. The stone lights the next few steps. No further.`,
        choices: [
          {
            id:          'c3_trust',
            label:       'Trust the stone — move without seeing far',
            consequence: `The stone has not been wrong yet about what is ahead. Moving without full visibility is a different skill than moving with it, and this is where that skill gets built — not in the clear sections, not on the Amber Road, but here where the stone lights three steps and you take three steps and trust that it will light three more. Most travelers who made it through the Fogmere describe it this way afterward: not bravery. Just three steps at a time.`,
          },
          {
            id:          'c3_wait',
            label:       'Wait for a clear moment before pressing on',
            consequence: `The Fogmere does not reliably produce clear moments. But it produces them occasionally — a shift in the air, a brief thinning — and a traveler who has learned to recognize them and move when they come is a traveler who has learned something about this particular kind of patience. The waiting is not failure. The waiting is information about what kind of mover you are.`,
          },
        ],
      },
    },

    // ── Chapter 4 ─────────────────────────────────────────────────────────────
    {
      number:   4,
      title:    'Thornwick',
      location: 'Thornwick',
      days:     [16, 20],

      milestone: `Twenty mornings. Thornwick has been watching this whole campaign from its records.

The cartographers keep entries going back further than this quest, different travelers and different campaigns on the same road. The entries that extend furthest are not from the travelers who seemed most certain at the beginning. They come from the ones who kept showing up after certainty would have been reasonable to abandon.

One entry in the Thornwick ledger stops at day forty-seven. No explanation. The cartographer's margin note: further than expected. Further than any prediction made at day twenty.

The stone burns with a steadiness in Thornwick that it didn't carry through the Fogmere. Not brighter. More settled. Like something that has decided what it is.

A cartographer pressed a compass into the pack at the twenty-day mark, without explanation. It does not point north. It points at something. Nobody said what.

Chip told the fellowship about the compass in the group chat. He said he thought it was broken. Will replied: "The cartographers of Thornwick do not give broken compasses to travelers. Read the room." Brent replied: "What Will means is: the compass is probably extremely significant and you should treat it carefully." Chip said: "so like hold onto it?" Kevin replied: "Yes, Chip. Hold onto it."`,

      milestone_attribution: null,
      artifact_awarded: 'compass',

      variants: [
        {
          id:           'c4_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The cartographers record the time without commentary — they note everything because the details are the map, and the map is the point. This morning's entry is a good one. The stone lit a stretch of road that wasn't visible from here yesterday.`,
        },
        {
          id:           'c4_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Another entry in the Thornwick records. The road is built from exactly this — one honest morning after another. The stone held. The cartographers noted the time.`,
        },
        {
          id:           'c4_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried the maps this morning — used the evidence of everyone who stopped before Chip as an argument for stopping. Look, it said, in the way it says things. Look where the entries end. The stone caught anyway. Not every entry ends here.`,
        },
        {
          id:           'c4_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone lit more of the road ahead this morning. The cartographers added a small mark further out — a detail now visible that wasn't visible before.`,
        },
        {
          id:           'c4_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `A name carved into the waypost at Thornwick's eastern edge: Elara. No family name, no date. Below it a small symbol the cartographers say means: passed through, continued. Her route extends further than most. Nobody knows how far she got. She passed through. She continued. The mark stayed.`,
        },
        {
          id:           'c4_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Brent sent something during the Thornwick stretch that he prefaced with: "I'm going to say something Will won't say because Will doesn't say things like this." What followed was specific and took four sentences. The short version: twenty days changes the math. The long version was the message.`,
        },
      ],

      missed: `A blank in the Thornwick records today. The cartographers leave room for these — they have seen enough campaigns to know a blank space is not an ending.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c4_arrive',
          quest_day:    16,
          pull_appears: false,
          text:         `Thornwick smells like woodsmoke and old paper, which is the smell of a place that has been keeping records for a long time. The buildings are low and the streets are narrow and every surface has been labeled by someone who thought the labeling mattered. The cartographers are already at work when the morning arrives. They don't mark their hours — they mark what changes between one entry and the next.

The group chat got quiet when Chip arrived. Then Brent sent: "okay Thornwick is a REAL place, I looked it up." Kevin replied: "It's not a real place." Brent replied: "I know that, I meant — it feels real. Like a place that would have records." Will replied, with a timestamp that suggested he had been waiting for an opportunity: "It does have records. I have been keeping them since day one." Kevin replied: "Will. Buddy." Will replied: "The ledger IS the records." Brent sent a laughing emoji.

A cartographer watched the exchange from across the room, which was not possible, and yet.

The Thornwick ledger has an entry that stops at day forty-seven with no explanation. The cartographer who wrote it drew a line under it. Will does that too.`,
        },
        {
          id:           'c4_s1',
          quest_day:    17,
          pull_appears: false,
          text:         `The first morning in Thornwick. The village wakes differently than the road does — there are sounds, the specific quality of a place with occupants rather than just passage. The stone burns clearly in settled air. It has burned through fog and cold and the particular silence of the Fogmere; what it does in a village is simpler. It just lights the morning.

The cartographers are already at work. They don't mark their hours — they mark what changes between their last entry and this one. A new road surveyed. A bridge confirmed. The distance between two points reconsidered. Thornwick's records are not about time. They are about what is real and where it is.

The stone is in the pack. The morning is answered. The first entry in the Thornwick records has been made.`,
        },
      ],

      decision: {
        prompt:  `The cartographers offer to show you where previous travelers stopped on the road ahead.`,
        choices: [
          {
            id:          'c4_study',
            label:       'Study the maps',
            consequence: `The ones who went furthest read the evidence before they left. Not to be warned off — to understand the terrain. The map of where others stopped is information about the road, not a prediction about you. Reading it carefully is a different thing than believing it.`,
          },
          {
            id:          'c4_forward',
            label:       'Look only forward',
            consequence: `The map of where others stopped is not the map of where you stop. There is something to be said for not knowing the precise location of everyone else's limit — it means the road ahead is yours to read, not a document with other people's endings already written in. You'll find out where the hard parts are when you get there.`,
          },
        ],
      },
    },

    // ── Chapter 5 ─────────────────────────────────────────────────────────────
    {
      number:   5,
      title:    'The Greywood',
      location: 'The Greywood forest',
      days:     [21, 25],

      milestone: `Twenty-five mornings. A quarter of the road behind, though the road ahead does not announce its remaining length.

The Greywood has a patience that is not passive. The old trees have watched enough travelers — certain ones and uncertain ones, all of them changed by the time they emerged on the other side — and they have reached no conclusions about which kind arrives further. They record without distinguishing.

The stone burns differently in the Greywood. Not brighter. More focused. Like the forest is giving it something to push against.

Kevin sent something during the Greywood stretch. The timestamp said something about his morning before the message did. It said: "Twenty-five. The part where it stops being a thing you're doing and starts being a thing you are takes longer than people think. You're in that part now." No elaboration. Kevin doesn't elaborate. The message was complete when he sent it.

Chip said: "did Kevin just go deep?" Brent replied: "Kevin goes deep approximately once every nine days. You learn to wait for it." Kevin replied: "I was just awake and had a thought. Don't make it a thing." Will replied: "Day 25. Documented." Kevin replied: "Thank you Will." Will replied: "That's what the ledger is for."`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c5_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The Greywood was quiet and dark when the morning came. The stone lit the path. The old trees recorded it in whatever way old trees record things — the slow ledger of the forest, written in rings, in the dark.`,
        },
        {
          id:           'c5_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `The trees have seen every kind of morning. They make no distinction between the ones that came easily and the ones that cost something. The stone held. The road continued.`,
        },
        {
          id:           'c5_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull found genuine quiet in the Greywood — the kind that makes the dreaming place sound reasonable by comparison. It used the quiet well this morning. The answer still came. The quiet stayed on the road behind for a while.`,
        },
        {
          id:           'c5_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone burned further into the forest today than yesterday. Something ahead caught the light — not clear yet, but present. A suggestion of what the road looks like past the trees.`,
        },
        {
          id:           'c5_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie was at the door before the Pull had finished its opening argument. The Pull had good material in the Greywood quiet. The dog was not interested in any of it.`,
        },
        {
          id:           'c5_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Pull has no concept of a deadline. It will make the same case tomorrow that it made today, with the same conviction, having kept no record that today's case didn't work.`,
        },
      ],

      missed: `The Greywood held a morning in its roots. The silence here is too comfortable, the case too familiar.

The road will still be there.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c5_arrive',
          quest_day:    21,
          pull_appears: false,
          text:         `The Greywood announces itself as a drop in temperature and a change in the light — not darkness exactly, more like the sun has agreed to work through an intermediary. The trees are old enough that the road between them feels borrowed. The bark is the color of old ash and the roots have decided, at some point, to stop staying underground.

Chip posted a photo. Brent replied: "bro the vibes." Will replied: "The road is visible in the photo. Continue using it." Brent replied: "Will is immune to vibes." Kevin replied: "Will IS a vibe. A very specific one." Will replied: "Day 21. The Greywood. Documented." And then, after a pause that felt deliberate: "The photo is good, Chip."

The trees were not impressed by any of this. They have been here long enough to have opinions about what matters and what doesn't, and they keep those opinions in their rings, in the dark.

Something in the canopy. Not wind. The trees moving slightly in a way that has nothing to do with weather.`,
        },
        {
          id:           'c5_s1',
          quest_day:    23,
          pull_appears: true,
          text:         `The Dreaming Pull has no concept of a deadline. There is no day twenty-five for it, no chapter count, no Ashen Peak on any horizon it can see. There is only the dreaming place and the person in the bed and the question of whether this morning is the morning the answer does not come.

Twenty-five answered mornings is not progress it acknowledges. It is twenty-five cases it did not win.

It will make the case again tomorrow, with the same patience, having learned nothing from the twenty-five that came before — because the Pull does not learn. It accumulates. And it has been accumulating for much longer than twenty-five days.

The stone lit. That is what matters today.`,
        },
      ],

      decision: {
        prompt:  `The Greywood is deep and old. The trees have been here long enough to have watched other travelers come through this same path.`,
        choices: [
          {
            id:          'c5_quick',
            label:       'Move quickly through',
            consequence: `Some places work on you less if you don't give them time. The Greywood is old and patient and will be here long after the quest is finished — it does not require your attention in order to do what it does to travelers. Moving fast through it is a reasonable choice. The stone burns cleanly when the pace is urgent.`,
          },
          {
            id:          'c5_slow',
            label:       'Move slowly and listen',
            consequence: `The Greywood records those who rush and forgets them at the same rate. Slow travelers it keeps something of — not a memory exactly, more like a shape, an impression left in the air by someone who was paying attention. The trees have been recording travelers long enough that they know the difference. So does the stone.`,
          },
        ],
      },
    },

    // ── Chapter 6 ─────────────────────────────────────────────────────────────
    {
      number:   6,
      title:    'The Hollow Pass',
      location: 'The Hollow Pass',
      days:     [26, 30],

      milestone: `Thirty mornings.

The Hollow Pass offers no scenery and no revelation. It offers passage, and passage is what it gave. Thirty is a number that means something — not because of what the number is, but because of what thirty consecutive mornings cost and what they built in the building.

The stone burns at its clearest in the Pass. Not its brightest. Its clearest. The Pass strips things to what they actually are. What they actually are, thirty mornings in, is a traveler who has continued past the point where stopping would have been reasonable.

The compass from Thornwick stopped moving in the Pass. It had been pointing with conviction since day twenty, but here the needle settled into certainty. Whatever it is pointing at, the Pass is where the direction became fixed.

Will's ledger entry for day thirty: "Thirty. I had twenty-two in the pool." He did not explain who else had entries, or what they guessed. He noted that thirty was not the consensus. Nothing else. Brent replied to Will in the group: "For anyone curious, Will's 'nothing else' here is doing a lot of work. He's extremely pleased." Kevin sent: "I had thirty-one, for the record." Will replied: "You had the highest number." Kevin replied: "I believed in the guy." A pause. "Still do."`,

      milestone_attribution: null,
      artifact_awarded: 'hollow_stone',

      variants: [
        {
          id:           'c6_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The Pass is cold at this hour — cold enough that the stone's warmth is something other than metaphor. Early mornings here feel different than late ones. More honest about what the road is and what it costs.`,
        },
        {
          id:           'c6_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Through the Hollow Pass. The stone held against the cold. The compass settled to its direction. The road continued.`,
        },
        {
          id:           'c6_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried the cold this morning — made the warmth of the dreaming place feel like the only reasonable response to the temperature. It is not a wrong argument. Cold is real. The stone was lit when the answer came. The Pull noted this with the specific resignation of something that makes a correct argument and still loses.`,
        },
        {
          id:           'c6_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone's light reached further into the Pass than yesterday. The compass needle, which has not moved since it settled here, seemed more certain. Like something ahead recognized the light.`,
        },
        {
          id:           'c6_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `There is a practice among travelers through the Pass — picking up a stone from the wall without being sure why. The one that went into the pack is smooth and heavier than it looks and warmer than the temperature should allow. Nobody pointed this out. It is simply there now.`,
        },
        {
          id:           'c6_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Kevin's message during the Pass arrived with a timestamp that said something about what his morning had already asked of him. It said: "The hard part about this stretch is there's nothing to blame. No warmth, no comfort, no good reason to stop except that stopping would be easier. That's actually the easier kind of hard to deal with. Keep going."

Will replied: "Correct." Brent replied to both of them: "I want to be clear that this group chat has become genuinely important to me and I won't be taking questions."`,
        },
      ],

      missed: `One morning lost in the cold of the Pass. The Pull found what it needed in the temperature and used it precisely.

The Pass will still need crossing.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c6_arrive',
          quest_day:    26,
          pull_appears: false,
          text:         `The Hollow Pass arrives as cold before it arrives as anything else — the kind of cold that isn't weather, that has been sitting in the stone of the canyon walls long enough to become structural. The sound in the Pass is different too. Smaller. Like the walls are holding the noise in and deciding what to do with it.

Chip's check-in note that morning was: "it's cold." Will replied: "Day 26. Documented. Also: yes." Brent replied: "Will said 'also: yes.' I need everyone to note that. That's warmth from Will." Kevin replied: "I've been in a cold car since 6am. No sympathy." Chip replied: "why are you in a cold car at 6am." Kevin replied: "Because I have children, Chip. This is established information."

The compass needle, which has been gesturing vaguely at a direction since Thornwick, went still in the Pass. Pointed clearly. Has not moved since.

The warmth of the hollow stone in the pocket. Warmer than the temperature has any business allowing.`,
        },
        {
          id:           'c6_s1',
          quest_day:    28,
          pull_appears: true,
          text:         `The hollow stone has been in the pack since the Fogmere. It went in without decision — it was just there, smooth and warmer than it had any reason to be, and the hand closed around it and it stayed. Most of the time it's just weight.

This morning the Pull assembled its best case yet. Cold air, the Pass still dark, the specific logic of a warm bed in a cold place presented without embellishment. It was a structurally sound argument.

The hollow stone was warm in the pocket.

That's all it did. It didn't argue back. It was just warm in a place where warm was the Pull's whole point, and something about that made the Pull's footing less certain, and the answer came, and the Pull withdrew to try again tomorrow with fresh material.

The stone is still in the pack. Still warm.`,
        },
      ],

      decision: {
        prompt:  `The compass has just settled on a direction in the Pass. It is not pointing toward the road the map shows.`,
        choices: [
          {
            id:          'c6_compass',
            label:       'Follow the compass',
            consequence: `The compass from Thornwick has not been wrong yet about what it points at. It was given by someone who makes maps of places before they are found. Following it means leaving the marked road for a while — the path it indicates is not the path other travelers have documented. The travelers who came back and reported this section all said the same thing: the compass knew before they did.`,
          },
          {
            id:          'c6_map',
            label:       'Stay on the marked road',
            consequence: `The marked road was built by travelers who survived it. There is a specific kind of wisdom in choosing the path that has already been proven. The compass may be pointing at something real. The map is pointing at something certain. Some campaigns are won on certainty, and there is nothing wrong with the kind of traveler who knows the difference.`,
          },
        ],
      },
    },

    // ── Chapter 7 ─────────────────────────────────────────────────────────────
    {
      number:   7,
      title:    'The Sanctuary of Halvard',
      location: 'The Sanctuary',
      days:     [31, 35],

      milestone: `Thirty-five mornings, and the Sanctuary.

Halvard doesn't make speeches. He makes one observation, quietly, during the days a traveler stays, and leaves them to decide what to do with it. What he said this time will not be written here. Some things lose something in the writing. What it does is get carried — in the pack, alongside the compass and the hollow stone — and it will be there when the road gets harder.

The stone burns quietly at the Sanctuary. Not dimly. Quietly. The way a fire burns when it is not competing with anything.

Chip told the group chat what Halvard said. Not the whole thing — a paraphrase, a rough shape. Will replied, after a pause that was long enough to be intentional: "That tracks." Brent replied: "okay I need the full version when you're back." Kevin replied: "He won't give the full version." Chip replied: "Kevin's right, I'm not giving the full version." Kevin replied: "I know because Halvard told me something too, years ago. You carry it or you don't. You can't explain it." A very long pause in the timestamps. Then Brent: "Kevin has BEEN to the Sanctuary?" Kevin replied: "Different road. Same stop." Nobody asked anything else. Some things are like that.`,

      milestone_attribution: null,
      artifact_awarded: 'halvard_word',

      variants: [
        {
          id:           'c7_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `Halvard's fire was low when the morning came. The stone was already bright. He noticed. He said nothing. At the Sanctuary, saying nothing is how approval is expressed.`,
        },
        {
          id:           'c7_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Another morning at the Sanctuary. The stone held. Halvard made no comment on the time, which means the time was acceptable. His standards are not announced. They are demonstrated by what he does and does not say.`,
        },
        {
          id:           'c7_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Sanctuary is the most comfortable place on the road so far, which means the Pull had its best material here. Better warmth, better quiet, the reasonable suggestion that rest at a waystation is exactly what a waystation is for. The stone caught eventually. Halvard, who has seen the Pull work this stretch more times than he has counted, said nothing.`,
        },
        {
          id:           'c7_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone drew Halvard's attention this morning — not a comment, just the way his eyes tracked to it. Some brightness is noticeable before it is remarked on.`,
        },
        {
          id:           'c7_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: true,
          text:         `Halvard talked about the Pull once during the Sanctuary days. Not a lecture — one thing, said without setup or conclusion.

He said the Pull doesn't want to keep anyone. That is a common misunderstanding. It wants to offer the dreaming place because the dreaming place is genuinely good and it genuinely believes this. The danger is not in the offer. The danger is in the door.

The Pull doesn't lock the door. It stops mentioning it. And the dreaming place becomes comfortable enough that the door stops mattering. And then one morning it's stiff from disuse and you think: it was always going to be difficult to leave.

He said the only thing that keeps the door easy is using it every morning whether you want to or not. He still uses it. After all this time.

What he said after that is what's in the pack.`,
        },
        {
          id:           'c7_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Will's message during the Sanctuary stretch arrived without a ledger citation. Just text: "I want to be clear that I still think a grown man should be able to wake up without a fellowship and a glowing rock. I also want to be clear that you are doing it, which is the only thing that matters to the ledger." A pause. Then: "Halvard's a good stop. Pay attention to what he says."

Brent replied to Will, separately: "You just said something nice." Will replied: "I said something accurate." Brent replied: "Same thing, for you." Will did not respond. This is also how Will says: you're right.`,
        },
      ],

      missed: `The Sanctuary held a morning. Even here, with Halvard's fire and the quiet of the waystation, the Pull finds what it needs.

The road will be there when the door opens.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c7_arrive',
          quest_day:    31,
          pull_appears: true,
          text:         `The Sanctuary smells like woodsmoke and something underneath it that has no name, something that has been accumulating in the stones of this place for longer than the road has been a road. It is warmer than outside by a temperature that feels like more than degrees. Halvard is at his fire when the morning arrives. He does not look up.

In the group chat, Chip wrote: "arrived at the Sanctuary. it's a real place." Kevin replied: "I know." Brent replied: "Wait, Kevin, have you—" Kevin replied: "Different road." Will replied: "Day 31. The Sanctuary. Noted." A pause from Will, which was unusual. Then: "Pay attention here, Chip. More than the other stops."

The Pull was already at the Sanctuary when the road arrived. It has always done well here — the warmth, the quiet, the entirely reasonable feeling that a waystation is exactly the right place to stop. It was already comfortable in the corner when Halvard's fire caught the stone's light.

Halvard's fire and the way it burns without producing much smoke. Old wood. Dry. Burning the way things burn when they have been tended for a very long time.`,
        },
        {
          id:           'c7_s1',
          quest_day:    33,
          pull_appears: true,
          text:         `Halvard talked about the Pull once during the Sanctuary days. Not a lecture — one thing, said without setup or conclusion.

He said the Pull doesn't want to keep anyone. That is a common misunderstanding. It wants to offer the dreaming place because the dreaming place is genuinely good and it genuinely believes this. The danger is not in the offer. The danger is in the door.

The Pull doesn't lock the door. It stops mentioning it. And the dreaming place becomes comfortable enough that the door stops mattering. And then one morning it's stiff from disuse and you think: it was always going to be difficult to leave.

He said the only thing that keeps the door easy is using it every morning whether you want to or not. He still uses it. After all this time.

What he said after that is what's in the pack.`,
        },
      ],

      decision: {
        prompt:  `Halvard is at his fire. He has one thing to say, and he will say it once.`,
        choices: [
          {
            id:          'c7_listen',
            label:       'Listen carefully',
            consequence: `Halvard says it once and does not repeat it. What he offers is offered in the register of things said once and received whole, or not at all — no summary available, no second chance. Listening carefully is not the same as understanding immediately. The road ahead will give it back when you need it, in the form of a moment that suddenly makes sense.`,
          },
          {
            id:          'c7_settle',
            label:       'Let it settle on its own',
            consequence: `Some things arrive before the conversation has words for them. Halvard knows this — he has been at his fire a long time and has stopped mistaking silence for absence. What settled in the quiet will find its name when the road calls for it. He won't be surprised. He has watched enough travelers leave the Sanctuary carrying something they can't yet describe.`,
          },
        ],
      },
    },

    // ── Chapter 8 ─────────────────────────────────────────────────────────────
    {
      number:   8,
      title:    'The Ashfields',
      location: 'The Ashfields',
      days:     [36, 40],

      milestone: `Forty mornings. The Ashfields are behind them.

The Ashfields prepare the traveler for nothing. That is their particular function. Everything after the Sanctuary — after the warmth and the quiet and Halvard's single observation — arrives here as a stripping. Not threat. Not cold. Just the grey, and the road, and the question of whether the stone still burns when the landscape offers no argument for burning.

It still burns.

On the far side of the Ashfields the road changes. The slope becomes visible for the first time. Not close. But there — something the compass has been pointing toward since the Hollow Pass, finally catching the stone's light.

Brent sent something at the forty-day mark: "I'm going to tell you something I didn't say at the start because saying it at the start would have jinxed it. I had a message ready. The one I was going to send when this fell apart. I had it ready since day twelve. I deleted it this morning." A pause. "You made it through the Ashfields. Will didn't think you would. I didn't either, but I wanted to be wrong. I was. I'm keeping track." Will replied, in the group, thirty seconds later: "My prediction was not pessimism. It was prior data." Kevin replied: "Will." Will replied: "The data has been updated." Brent replied: "That's the nicest thing Will has ever said." Will replied: "That is not what I said." It was exactly what he said.`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c8_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `Out of the Ashfields early enough that the Pull hadn't finished assembling its argument. The stone blazed. There is a specific quality to mornings when the answer comes before the case is made — cleaner somehow. Less residue on the road behind.`,
        },
        {
          id:           'c8_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `The Ashfields offer nothing except passage. The stone held. The compass pointed forward. The road on the other side of the grey is the same road, further along.`,
        },
        {
          id:           'c8_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull in the Ashfields doesn't argue. It uses the grey itself — the absence of warmth, of landmark, of anything that makes the dreaming place seem worse than where you are. The answer still came. Late, but it came.`,
        },
        {
          id:           'c8_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The Ashfields look different when the stone is burning well — not different in what they are, different in how far ahead the road is visible. Further than yesterday. Enough.`,
        },
        {
          id:           'c8_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull in the Ashfields is not trying to deceive anyone. This is worth understanding clearly.

It genuinely believes the dreaming place is better than the road. Not as a trick — as a conviction it has held longer than the road has existed. It has watched travelers come through the Ashfields and continue, and it has never once updated its belief that they made a mistake. From where it lives, there is no Ashen Peak. There is only the dreaming place, which is warm and real and asks nothing.

The danger is not deception. The danger is sincerity.

The stone held anyway.`,
        },
        {
          id:           'c8_v6',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie's contribution to the Ashfields was consistent and unreflective. Every morning: awake, present, waiting at the door with the patient certainty of a creature that has never once understood why mornings are complicated. The Pull has no counter to this. It never has. The dog operates on a frequency the Pull cannot access.`,
        },
      ],

      missed: `The grey claimed a morning. The Pull here doesn't need to make a case — it just offers what the Ashfields already are.

The road will still be there.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c8_arrive',
          quest_day:    36,
          pull_appears: false,
          text:         `The Ashfields arrive as a flattening. The trees end and the sound ends and what's left is grey grass and grey sky and the compass and the stone's light, which is the only color for as far as the road goes. The Pull was expecting this to be useful. It is finding, for the first time in the campaign, that it has less to work with here than anticipated. The absence of warmth and comfort was supposed to make the dreaming place sound better. It turns out that the absence of warmth and comfort also makes argument harder. The Pull is recalibrating.

Chip sent a photo to the group. Just grey. Brent replied: "...is that a photo or did your camera break." Will replied: "That is what the Ashfields look like. Keep moving." Kevin replied: "Oh I hate this place for you." Chip replied: "it's fine, I'm fine." Kevin replied: "You're fine but you're in the Ashfields. Both things." Will replied: "The stone is visible in the photo. Bottom left." Everyone looked. It was there. Small and warm against all that grey.

The compass pointing steadily at whatever it has been pointing at since the Pass. More clearly now that the horizon is flat. Something is there.`,
        },
        {
          id:           'c8_s1',
          quest_day:    38,
          pull_appears: true,
          text:         `The Dreaming Pull in the Ashfields is not trying to deceive anyone. This is worth understanding clearly.

It genuinely believes the dreaming place is better than the road. Not as a trick — as a conviction it has held longer than the road has existed. It has watched travelers come through the Ashfields and continue, and it has never once updated its belief that they made a mistake. From where it lives, there is no Ashen Peak. There is only the dreaming place, which is warm and real and asks nothing.

The danger is not deception. The danger is sincerity.

The stone held anyway.`,
        },
      ],

      decision: {
        prompt:  `The Ashfields open ahead. No landmarks. Grey to the horizon. Only the compass bearing and the stone's light.`,
        choices: [
          {
            id:          'c8_bearing',
            label:       'Mark the compass bearing and walk',
            consequence: `The Ashfields end for everyone who crosses them without stopping, and the compass bearing is how you cross without stopping — a number to hold when the grey makes everything feel like it has always been grey and always will be. The bearing doesn't require belief. It just requires following. That is enough.`,
          },
          {
            id:          'c8_count',
            label:       'Count steps through the grey',
            consequence: `Some travelers count because the number is something to hold that the Ashfields cannot take. The grey is real but a count is also real, and counting makes the crossing finite in a way that pure distance does not. Every traveler who has counted their way through the Ashfields finished the count. That is a fact about counting, and it is also a fact about the Ashfields.`,
          },
        ],
      },
    },

    // ── Chapter 9 ─────────────────────────────────────────────────────────────
    {
      number:   9,
      title:    'The Ridge of the Unremembered',
      location: 'The Ridge of the Unremembered',
      days:     [41, 45],

      milestone: `Forty-five mornings.

The Ridge of the Unremembered does not offer comfort or warmth. It offers clarity. The stone burns cleanly here — no fog, no valley softness, no grey absorbing the light. Just the burn and the road and how far the burn reaches on a given morning.

On the Ridge, with enough light, something became visible for the first time. On the horizon. Not named. Not close. But there — the place the compass has been pointing since the Hollow Pass, finally catching enough of the stone's light to be seen.

The Ridge was named for the campaigns that stopped here. Not ended — stopped. The travelers are not gone. They are somewhere else now, in the comfortable life, no longer remembering clearly what the road felt like from this altitude. The Ridge holds the shape of their progress. The view they almost had.

Kevin sent something during the Ridge stretch. The timestamp said something about his morning before the message did. It read: "My older one asked me this morning why I get up before it's light. I told him because the morning is better before anyone else gets to it. He thought about it. Then he got up with me." A pause. "You're further along than you think."

Chip replied: "that's a good kid." Kevin replied: "He's seven. He went back to sleep twenty minutes later." Brent replied: "Kevin this is the most beautiful thing you have ever shared with this group chat." Kevin replied: "He was just curious." Will replied: "Day 45. Kevin's son. Documented." Kevin replied: "Will please do not put my son in the ledger." Will replied: "He's already in the ledger."`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c9_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `{{checkin_time}} on the Ridge. The stone lit the far distance of it — further than any morning since the Ashfields. Something on the horizon caught the light and was visible for a moment before the stone settled to its normal reach. It was there.`,
        },
        {
          id:           'c9_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Hard ground, clear progress. The Ridge offers no warmth but it offers visibility. The stone held. The compass pointed. The road continued toward what the compass has been pointing at since the Pass.`,
        },
        {
          id:           'c9_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull found something on the Ridge it hadn't tried before — the memory of easier stretches. Not any specific chapter. Just the general quality of what easier felt like, offered accurately, without embellishment. The stone held. The Ridge felt longer this morning than it was.`,
        },
        {
          id:           'c9_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone lit the Ridge further this morning. Something on the horizon was visible — distant, clear for a moment, then settling back as the stone found its normal range. It was there. Yesterday it wasn't there at all.`,
        },
        {
          id:           'c9_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `The Ridge holds the shapes of campaigns that stopped here. Not the travelers — just the shape of how far they got, the altitude they reached before the comfortable life reasserted itself. Standing on the Ridge means standing above most of those shapes. That is a specific kind of information.`,
        },
        {
          id:           'c9_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Pull that shows up on the Ridge is not the same one that worked the Fogmere or made its honest case in the Ashfields. Forty-five answered mornings have changed the angles.

It tried the memory of Madison this morning. Not Downers Grove — further back. A specific morning before the weight of the current life had accumulated. The memory was real. The Pull found it accurately.

What it cannot explain is why that memory requires the dreaming place to access.

The stone held. The answer came.`,
        },
      ],

      missed: `One morning lost on the Ridge. The Pull found the memory it needed and used it precisely.

The road continues tomorrow.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c9_arrive',
          quest_day:    41,
          pull_appears: false,
          text:         `The Ridge arrives as altitude. The air is different up here — thinner, not quite cold, the specific quality of air that has not been breathed by many people. The road on the Ridge is harder than the road before it in a way that shows in the stride rather than in any single obstacle. The stone burns clear and steady, no fog to push through, no grey to absorb the light. Just the burn and the road and the horizon, which is further away than it has been at any point in the campaign.

Chip sent a check-in note: "you can see far from up here." Brent replied: "Is that the horizon? Can you see—" Chip replied: "I think so. Something. Hard to tell." Will replied: "Day 41. Something visible on the horizon. Noted for the ledger." Kevin replied: "That's it. That's what the compass has been for." Chip replied: "you think that's actually Ashen Peak?" Kevin replied: "I think you've been walking toward it for forty-one days. What else would it be."

The shapes the Ridge holds — the altitude of campaigns that stopped here without ending. The view they almost had, preserved in the air above the place they stopped.

The question of whether Chip will name what he sees, or keep it a direction for a little longer.`,
        },
        {
          id:           'c9_s1',
          quest_day:    43,
          pull_appears: false,
          text:         `Will's ledger entry for a morning on the Ridge arrived with an annotation in the margin: "Note: the traveler whose entry stops at day forty-seven stopped somewhere in this stretch. Chip is past that mark."

No comment on what this means. Will records the thing and lets the thing speak.

Brent replied to Will, in the group: "Will. That's a big deal." Will replied: "It's a data point." Kevin replied: "It's a big deal, Will." A pause. Then Will: "The ledger notes it." Brent replied: "That means yes." Will did not respond.

The thing speaks.`,
        },
        {
          id:           'c9_s2',
          quest_day:    44,
          pull_appears: true,
          text:         `The Pull tried something different on the Ridge this morning. Not comfort, not warmth, not the reasonable argument about an hour from now. It went further back.

It found a morning from Madison — a specific one, not invented, accurately remembered — when the day had no weight yet and the light came in a certain way and nothing was owed to anyone. It offered this with the care of something that knows the difference between a thing that works and a thing that almost works.

The stone held. The answer came.

What the Pull cannot explain, and has never been able to explain, is why that morning requires the dreaming place to access. The memory belongs to Chip. The Pull just found it first.`,
        },
      ],

      decision: {
        prompt:  `The destination is visible on the horizon for the first time. Just barely. The compass has been pointing at it since the Hollow Pass.`,
        choices: [
          {
            id:          'c9_name',
            label:       'Name what you\'re seeing',
            consequence: `Naming the destination makes it real in a way the compass never quite did. It also makes the distance real, and the doubt, and the specific weight of forty-one answered mornings that were working toward something you could only call "the direction." You name it anyway. Ashen Peak. The stone burns a little different after that — not brighter. Steadier. Like it heard.`,
          },
          {
            id:          'c9_silent',
            label:       'Don\'t name it yet',
            consequence: `The Unremembered travelers — the ones whose shapes the Ridge holds — most of them named it when they saw it. The naming made it feel close. Closeness made it feel achievable. Achievable made rest feel reasonable, and the reasonable kind of rest is where campaigns end. You keep it a direction. A direction has no weight yet. You can walk toward a direction without having to believe in it.`,
          },
        ],
      },
    },

    // ── Chapter 10 ────────────────────────────────────────────────────────────
    {
      number:   10,
      title:    'The Forgetting',
      location: 'The Forgetting',
      days:     [46, 50],

      milestone: `Fifty mornings. The Forgetting is behind them.

The Forgetting is a gorge and a bridge and a thing that happens to travelers who stop and look down too long. Not forgetting the destination — forgetting the urgency of it. The warmth of the dreaming place is still real from here. The distance to Ashen Peak is still real from here. Standing on the bridge, both are present, and the Forgetting does something to the weight of that — makes it feel like the weight has always been there and will always be there and crossing does not change it.

The stone blazed on the crossing. Not dimly — blazed. The way it hasn't blazed since the road started.

Among the marks left by previous travelers on the railing: a flask. Small, old, sealed. A note tucked under it: water from below. In case you need to remember what you're crossing for. The flask went into the pack.

Will sent one thing at the fifty-day mark. Not a ledger citation. Just: "Fifty mornings. I had you for the Valley. I was wrong. I am updating my assessment." A pause. Then: "Halfway. Don't make me write another one of these."

Brent replied to Will: "Will owes me twenty dollars and I want everyone to know that he knows exactly why." Will replied: "I know why." Kevin replied: "Chip, do you know about the bet?" Chip replied: "what bet." Kevin replied: "There's a bet." Will replied: "There was a bet. Past tense. It has been resolved." Brent replied: "I'm keeping the twenty dollars forever." The stone was blazing when all of this arrived.`,

      milestone_attribution: null,
      artifact_awarded: 'flask',

      variants: [
        {
          id:           'c10_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The crossing was clean — stone blazing, the gorge below unremarked on, the other side arriving quickly. Some bridges are easier to cross when the answer comes before the Forgetting has found its voice.`,
        },
        {
          id:           'c10_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `The bridge is crossed. The stone held. The flask is in the pack. The other side is the same road, further along, and it looks different from here than it did from Downers Grove.`,
        },
        {
          id:           'c10_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull made its largest attempt at the bridge. Not warmth or quiet or memory — something older and harder to name. The suggestion that the other side looks exactly like this side and crossing changes nothing. The stone lit anyway. The flask went into the pack. The other side is different. It is.`,
        },
        {
          id:           'c10_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone lit the bridge and the far bank clearly enough to see what waits there. More road ahead than was visible yesterday. The compass pointed without wavering.`,
        },
        {
          id:           'c10_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `There is a number carved into the railing: 50. Below it, in a different hand, the same symbol used for Elara's mark in Thornwick — passed through, continued. Different traveler, different campaign. Whoever left it made it at least this far.`,
        },
        {
          id:           'c10_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Brent sent three messages in quick succession at the halfway mark. The first: "Okay." The second: "I mean genuinely okay, not fine okay." The third: "Will isn't going to say this so I will: we're proud of you. Both of us. Him in his way, which involves timestamps and ledger citations. Me in mine, which involves saying the thing directly. Halfway. Keep going."`,
        },
      ],

      missed: `The bridge requires crossing at dawn. Dawn came and went without a crossing. The Pull at the Forgetting used the gorge's particular silence well today.

The bridge offers the same crossing tomorrow.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c10_arrive',
          quest_day:    46,
          pull_appears: false,
          text:         `The gorge announces itself as sound before sight — water far below, and a cold that rises from depth rather than descending from sky. The bridge is older than the road, or feels it: stone and iron and something in the railing worn smooth by every hand that has gripped it on the way across. The far side is visible but it feels like more distance than the eye suggests.

Chip sent: "the bridge is real." Will replied: "Day 46. The Forgetting. The bridge is real. Documented." Brent replied: "Don't look down." Chip replied: "too late." Kevin replied: "Look down once, register it, then look forward. That's the whole move." Chip replied: "noted." Kevin replied: "The gorge will do its thing regardless. Give it one look and then take it away." Brent replied: "Kevin is a tactical genius." Kevin replied: "I've been awake since 5. I'm running on tactics and coffee."

The flask on the railing. Old. Sealed. The note tucked under it in handwriting that might have been left yesterday or fifty years ago — the Forgetting makes that kind of distinction feel unreliable.

The sound of the water. The question of whether you look down once, as Kevin said, or whether you already have.`,
        },
        {
          id:           'c10_s1',
          quest_day:    47,
          pull_appears: false,
          text:         `Brent sent three messages this morning.

The first arrived at a time that said something about when he woke up. It said: "I need to tell you something I've been sitting on since around day twelve."

The second: "I wrote the message. The one I had ready for when this fell apart. Wrote it once, saved it, didn't touch it again. Deleted it this morning." A pause in the timestamps. "You're at the bridge. That message assumed you wouldn't be."

The third was just: "Also Will owes me twenty dollars but he'll never admit what the bet was."

Will replied, in the group, seven minutes later: "I know what the bet was." Brent replied: "I know you know." Will replied: "..." Brent replied: "He's paying. Everyone note this moment." Kevin replied: "I want to be clear I had no bet. I just believed in the guy."`,
        },
        {
          id:           'c10_s2',
          quest_day:    48,
          pull_appears: false,
          text:         `There is a number carved into the railing: 50. Below it, in a different hand, the same symbol used for Elara's mark in Thornwick — passed through, continued. Different traveler, different campaign, same road.

Whoever left it made it at least this far.

The mark is old enough that the cartographers in Thornwick have it in their records. They noted it without ceremony: evidence of passage. Nothing more was required.`,
        },
      ],

      decision: {
        prompt:  `The flask is on the railing. The note says: in case you need to remember what you're crossing for. The bridge is halfway crossed.`,
        choices: [
          {
            id:          'c10_open',
            label:       'Open the flask on the bridge',
            consequence: `The water from the gorge below tastes like nothing in particular, which is somehow the most clarifying thing you have tasted on this road. The Forgetting works by making urgency feel historical — something that mattered once, at a different time. The water from below tastes like right now. You cross the second half of the bridge knowing exactly what you're crossing for.`,
          },
          {
            id:          'c10_carry',
            label:       'Carry it sealed to the other side',
            consequence: `The note says in case. You don't need it yet. The not-opening is itself a kind of answer — a record of how you were on the bridge, this morning, when the Forgetting tried and you didn't need to remember because you hadn't forgotten. The flask goes into the pack still sealed. That is also a true thing to know about yourself.`,
          },
        ],
      },
    },

    // ── Chapter 11 ────────────────────────────────────────────────────────────
    {
      number:   11,
      title:    'The Valley Below the Peak',
      location: 'The Valley Below the Peak',
      days:     [51, 55],

      milestone: `Fifty-five mornings, in sight of the Peak.

The Valley Below the Peak is not comfortable. The name misleads — the Valley is hard, the altitude makes the stone's light feel exposed, and the road here has no warmth to offer. What it offers is proximity. For the first time the destination is not inference. It is there, directly above, and the road goes to it.

The compass that settled in the Hollow Pass and has pointed at this mountain since Thornwick has found the end of its function. It still points. The direction is no longer information. It is confirmation.

What Halvard said at the Sanctuary became useful here in a way it hadn't been before. The Valley is where it became clear why he said it when he did.

Brent sent something during the Valley stretch on a morning when the Peak was visible through low cloud. It said: "I know this stretch. Not this one specifically — but the stretch where there's nothing to confirm you're doing the right thing except the fact that you're doing it. Will would tell you the ledger confirms it. I'll tell you something different: you already know. You've known since the Fogmere. You just needed enough elevation to see it clearly."

Will replied to Brent, in the group: "I would also tell him that." Brent replied: "I know. I was being diplomatic." Kevin replied: "We're all being diplomatic. The summit is up there. Go get it, Chip." Chip replied: "yeah." A pause. "yeah, okay." Kevin replied: "That's the one."`,

      milestone_attribution: null,

      variants: [
        {
          id:           'c11_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The stone lit the Valley further than it needed to be lit this morning. The Peak above caught the light — not the summit, not yet, but the shape of the slope ahead. The grey ends. It ends.`,
        },
        {
          id:           'c11_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `A morning in {{month}} in the Valley Below the Peak. The stone held. The compass confirmed what the stone illuminated. The road continued without any help from the landscape, which is the only kind of help the Valley offers.`,
        },
        {
          id:           'c11_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried the altitude this morning — made the dreaming place sound warmer by comparison to the Valley's cold. The stone caught anyway. The Pull noted this with the resignation of something whose best arguments have started landing less often.`,
        },
        {
          id:           'c11_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `Earlier in the Valley, where the difference in time shows more clearly against the altitude. The stone burned further. The Peak caught more of it. That's enough.`,
        },
        {
          id:           'c11_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull that arrives in the Valley Below the Peak is changed from the one that started the campaign.

Fifty mornings of answered alarms have done something to it that it doesn't have a word for. It is not weakened — it is never weakened, it is as old as the dreaming place and the dreaming place is permanent. But it is trying things it doesn't usually try.

It is beginning to understand, for the first time in this campaign, that something may have changed. Not in its offer. In the person receiving it.

The answer keeps coming anyway.`,
        },
        {
          id:           'c11_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `The cartographers in Thornwick have a theory about the Valley. It has to do with travelers who made it this far and then stopped — not fell, stopped — one morning at a time, until the mornings stopped mattering and then stopped entirely. The trees at the Valley's base are what grew from that. Nobody further down the road knows why those trees are different from the others. The asking, apparently, matters.`,
        },
      ],

      missed: `The Valley claimed a morning in sight of the Peak. The Pull here uses the altitude — makes the summit look earned and the bed look sufficient.

The road continues tomorrow.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c11_arrive',
          quest_day:    51,
          pull_appears: false,
          text:         `The Valley arrives as the end of the grey and the beginning of something harder to name. The Peak is above. Not inference now, not a direction on a compass — it's there, visible, the actual shape of the thing the road has been going toward for fifty mornings. The stone in the pack burns warmer than it has since Thornwick. Something about proximity.

Chip sent a photo. The Peak in the background, half in cloud. Brent replied immediately: "CHIP." Will replied: "Day 51. The Valley. The Peak is visible. This has been noted in the ledger with appropriate weight." Kevin replied: "Look at that." A pause. "Just look at it." Chip replied: "I'm looking at it." Kevin replied: "Good. Keep looking. Then start walking." Brent replied: "Kevin is very good at this." Kevin replied: "I have children. I've learned how to say the one thing."

The compass still points at the Peak. It has found the end of its function. It still points.

The pull of the altitude in both directions — up toward the summit, down toward the warmth that the Valley cannot offer. The stone warm in the pack. The road clearly upward.`,
        },
        {
          id:           'c11_s1',
          quest_day:    53,
          pull_appears: true,
          text:         `The Dreaming Pull that arrives in the Valley Below the Peak is changed from the one that started the campaign.

Fifty mornings of answered alarms have done something to it that it doesn't have a word for. It is not weakened — it is never weakened, it is as old as the dreaming place and the dreaming place is permanent. But it is trying things it doesn't usually try.

It is beginning to understand, for the first time in this campaign, that something may have changed. Not in its offer. In the person receiving it.

The answer keeps coming anyway.`,
        },
      ],

      decision: {
        prompt:  `You can see the summit from the Valley. It is the first time the Fellowship could know how close you are, if you told them.`,
        choices: [
          {
            id:          'c11_tell',
            label:       'Tell the Fellowship how close you are',
            consequence: `Will's response arrives in four minutes. It is three words and a timestamp. Brent sends something longer that takes him an hour to write and arrives as a paragraph that reads like it was written in one breath. Kevin sends nothing for six hours and then sends: "I know." The summit is still the same distance. The road feels different.`,
          },
          {
            id:          'c11_carry',
            label:       'Carry it a little longer alone',
            consequence: `There is something that belongs to you about knowing before you've said it — the private weight of almost, held for a few more mornings before it becomes shared. You have carried the harder knowledge alone throughout this road. You can carry this too. When you tell them, it will be from the other side.`,
          },
        ],
      },
    },

    // ── Chapter 12 ────────────────────────────────────────────────────────────
    {
      number:   12,
      title:    'Ashen Peak Slope',
      location: 'Ashen Peak',
      days:     [56, 60],

      milestone: `Sixty mornings.

The Waking Fire is at the summit. The stone gets cast in when the campaign completes — that is what the summit is for. The Emberstone, which has been sitting on a nightstand and going into a pack and coming back out every morning for sixty days, ends its campaign here.

The ash on the slope records the ascent. Every step. The ash of the high trail is mixed with the residue of the Waking Fire, and what the Waking Fire touches, it marks. Looking back down — sixty mornings of footprints, all the way to where the slope begins, all the way to where the road started, back through the Valley and the Forgetting and the Ridge and the Ashfields and the Sanctuary and the Pass and the Greywood and Thornwick and the Fogmere and the Amber Road and a house in Downers Grove where none of this was inevitable.

Will sent the ledger entry for day sixty. Below the timestamp, two lines: "Campaign complete. Sixty mornings, one ledger, one road." A pause — longer than usual. Then a third line, smaller than the others: "I didn't think you'd make it past the Valley. I've been wrong about this since chapter three. For the record: I'm glad I was wrong." Nothing after that. For Will, nothing after that was the whole thing.

Brent's message arrived an hour later. It said: "I've been thinking about what to send for day sixty since about day thirty, which tells you something about where my head has been. Here's what I've got: I showed up skeptical and I'm leaving a believer. Not in the quest — in you. The quest was just the shape it took." A pause. Then: "Will wrote something nice too, right? In his way? Tell him I said good job translating." Kevin sent his message at a time that said something about what his morning had already required of him. It said: "I've watched a lot of people try to change something about themselves. Most of them pick the wrong thing to change. You picked the right thing." A pause. "My kids were still asleep when I sent this. First morning in a while. I stayed up to watch the sun come in. Thought of you."

{{decision_echo_1}}

{{decision_echo_2}}

{{decision_echo_3}}

The road back to Downers Grove looks different from up here.

Not because Downers Grove changed.

Because the person looking at it did.`,

      milestone_attribution: null,
      artifact_awarded:      'ash_mark',

      variants: [
        {
          id:           'c12_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The road has been climbing without announcing it. From here the climb is visible — looking back, the distance traveled is larger than it felt from inside it. Looking forward, something is there that wasn't visible from the Ashfields. The stone is warmer in the pack than it was at the start.`,
        },
        {
          id:           'c12_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `{{checkin_time}} on the slope. The stone cast more light than the morning needed. Some brightness doesn't calibrate to the moment — it just burns at the rate the moment deserves.

Stevie was at the door at an hour that made the Pull's argument collapse before it was finished. The dog has done this more times in this campaign than the Pull has won outright.`,
        },
        {
          id:           'c12_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull came to the slope.

It tried something it found in the house in Downers Grove — a version of things from before the quest, before the road, a morning that asked nothing and offered everything. It offered this accurately and without embellishment because the Pull doesn't embellish. It finds the real thing and offers the real thing.

The stone was already lit. The slope was already underfoot. The answer was still no.`,
        },
        {
          id:           'c12_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `One morning from the summit. The full ledger stretches back down the slope — further than it's possible to see clearly from here, all the way back to where the road started. It's a long way. It was walked.`,
        },
        {
          id:           'c12_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `The flask from the Forgetting has been in the pack since the bridge. Sealed. The note said: in case you need to remember what you're crossing for. This far in, the reason doesn't need a reminder.

The ash on the slope records every step. Looking back down the trail — all those mornings of footprints in the ash, all the way down to where the slope begins.`,
        },
        {
          id:           'c12_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull on the slope of Ashen Peak is quieter than it has been at any point in the campaign. Not gone — it is never gone. But it has made its case completely and the answer has been given completely and there is less left to negotiate.

It will be there tomorrow. It will always be there. The difference, from the slope, is that it no longer sounds like the only reasonable voice in the room.`,
        },
      ],

      missed: `The slope recorded a blank today. The ash here is patient — it will hold tomorrow's step when it comes.

The summit is still there.`,

      artifact_seed: null,

      scheduled: [
        {
          id:           'c12_arrive',
          quest_day:    56,
          pull_appears: false,
          text:         `The slope of Ashen Peak is ash and old stone and the specific silence of a place that has been waiting for this particular traveler for sixty days without knowing it. The air is different at altitude — clean in a way the road below isn't, the kind of clean that has no smell, just the absence of everything that accumulates at lower elevation. The stone in the pack blazes. Not warm. Blazing.

Chip sent a single word to the group chat: "here." Will replied, immediately, which was unusual for Will: "Day 56. The slope. You're here." Brent replied: "CHIP IS ON THE SLOPE." Kevin replied: "Go." Chip replied: "going." Kevin replied: "I know." Brent replied: "Will, say something." Will replied: "What do you want me to say." Brent replied: "Anything." Will replied, after a pause that felt like he was choosing carefully: "The ledger has fifty-six entries. Every one of them is the same person. That's the whole record. That's what it says."

Brent replied: "That's the one." Kevin replied: "Yeah." Chip didn't reply for three hours because he was walking.

The ash records every step. Looking back down from here, the slope holds all of them.`,
        },
        {
          id:           'c12_s1',
          quest_day:    58,
          pull_appears: false,
          text:         `The flask from the Forgetting has been in the pack since the bridge at the halfway point. Sealed. The note said: in case you need to remember what you're crossing for.

Two mornings from the summit. The reason for crossing has not required a reminder in a long time.

The flask stays sealed. That is also a record — of who Chip was on the bridge, of what he was carrying when the Forgetting tried, of what did and did not need to be remembered. The sealed flask is itself a kind of testimony.

It belongs at the summit.`,
        },
        {
          id:           'c12_s2',
          quest_day:    59,
          pull_appears: true,
          text:         `The Dreaming Pull on the slope of Ashen Peak is quieter than it has been at any point in this campaign. Not gone — it is never gone, the dreaming place is permanent and real and necessary and will be there tonight as it has been every night. But something has changed in the ratio between its voice and everything else.

Chip knows what the Pull sounds like now. He knows the texture of its arguments, the specific comfort it offers, the exact quality of warmth it promises. He has heard it sixty mornings in a row. At some point, familiarity changes the equation — not by making the offer less real, but by making the source recognizable. The Pull is still the Pull. It is simply no longer a surprise.

One morning left.`,
        },
      ],

      decision: {
        prompt:  `The full chronicle is in the pack — every entry, every morning, the whole road. The summit is one morning ahead.`,
        choices: [
          {
            id:          'c12_read',
            label:       'Read the chronicle before the summit',
            consequence: `The first entry is from Downers Grove, in the house, before the road had a name. You read every morning in sequence — the ones that cost something, the ones that didn't, the ones where the Pull was close and the ones where it wasn't. You arrive at the summit having seen the whole shape of what you did. It looks different from the outside than it felt from inside it.`,
          },
          {
            id:          'c12_forward',
            label:       'Go up without looking back',
            consequence: `The chronicle will still be there after. You go up carrying everything without reading it — moving the way you have moved for fifty-nine mornings, which is forward, without a full accounting of the cost. You cast the stone into the Waking Fire not knowing the exact shape of what it took to carry it here. That is also a true thing to know about yourself.`,
          },
        ],
      },
    },

  ],
};

// ── Artifacts ─────────────────────────────────────────────────────────────────

const ARTIFACTS = {
  hollow_stone: {
    id:              'hollow_stone',
    name:            'A stone from the Hollow Pass',
    description:     'Pulled from the Pass wall by a hand that did not mean to reach for it. Smooth, heavier than it looks, and warmer than the temperature of the Pass has ever justified. The warmth has not diminished. The Pass keeps nothing it does not intend to give.',
    awarded_chapter: 6,
  },
  compass: {
    id:              'compass',
    name:            'A compass from Thornwick',
    description:     'Does not point north. The cartographers of Thornwick are known to map destinations before the destinations have been found, and the compasses they give to travelers have a corresponding quality — they point at what is real before it is visible. What this one points at has been consistent since the Hollow Pass.',
    awarded_chapter: 4,
  },
  halvard_word: {
    id:              'halvard_word',
    name:            'Something Halvard said at the Sanctuary',
    description:     'Not written here. Halvard has been saying one thing to travelers at the Sanctuary for longer than anyone has kept count, and it has never been the same thing twice, and it has never failed to be what the road ahead required. It is carried in the pack with the other things. It weighs nothing and is not nothing.',
    awarded_chapter: 7,
  },
  flask: {
    id:              'flask',
    name:            'A flask from the bridge at the Forgetting',
    description:     'Left on the railing by a traveler who crossed and continued. Contains water drawn from the gorge below the bridge — where travelers lose not their direction but their urgency. A note was tucked under it: in case you need to remember what you\'re crossing for. Still sealed. The sealing is itself a record.',
    awarded_chapter: 10,
  },
  ash_mark: {
    id:              'ash_mark',
    name:            'Received on the slope of Ashen Peak',
    description:     'The ash of the high trail is mixed with the residue of the Waking Fire, and what the Waking Fire touches, it marks. The mark does not wash off. This is not an accident. The slope knows the difference between someone passing through and someone who arrived.',
    awarded_chapter: 12,
  },
};

// ── Decision echoes ───────────────────────────────────────────────────────────

const DECISION_ECHOES = {
  c9: {
    c9_name: `He named it when he saw it from the Ridge. Said it out loud or just thought it — the record doesn't say which. Ashen Peak. The stone burned steadier after that, like something had been waiting for the word.`,
    c9_silent: `He kept it a direction for as long as he could. Didn't name it when he saw it from the Ridge, just marked the bearing and kept moving. Some things are easier to walk toward before they have weight.`,
  },
  c10: {
    c10_open: `The flask from the Forgetting is empty. He opened it on the bridge at the halfway point — the water tasted like nothing in particular, which turned out to be the most clarifying thing on the road. He crossed the second half knowing exactly what he was crossing for.`,
    c10_carry: `The flask from the Forgetting is still sealed. He carried it all the way here without opening it, which turned out to be its own answer — a record of a man who didn't need to remember because he hadn't forgotten.`,
  },
  c12: {
    c12_read: `He read the full chronicle before the last morning. Sat with the whole road — every entry, the ones that cost something and the ones that didn't. The shape of it looked different from the outside than it felt from inside it. He went up afterward knowing what he'd done.`,
    c12_forward: `He went up without reading it. Sixty mornings in the pack and he carried them to the summit without counting. The chronicle will still be there. Some things you don't need to see in order to have done them.`,
  },
};

// ── Helper functions ──────────────────────────────────────────────────────────

function getChapter(questDay, campaign) {
  return campaign.chapters.find(ch =>
    questDay >= ch.days[0] && questDay <= ch.days[1]
  ) || campaign.chapters[campaign.chapters.length - 1];
}

function isMilestoneDay(questDay) {
  return questDay > 0 && questDay % 5 === 0;
}

// Legacy advance helper — kept for backward compatibility with server.js cron
function getQuestAdvance(minutes) {
  if (minutes < 420) return 2;
  if (minutes < 450) return 1.5;
  return 1;
}

// Story log — no size limit, full chronicle
function appendToLog(existingLog, entry) {
  const log = Array.isArray(existingLog) ? [...existingLog] : [];
  log.push(entry);
  return log;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  WORLD,
  CAMPAIGN_1,
  ARTIFACTS,
  DECISION_ECHOES,
  SPECIAL_NARRATIVES,
  getPerformanceTier,
  getEmberLevel,
  pickVariant,
  renderText,
  // helpers still used by server.js / routes
  getChapter,
  isMilestoneDay,
  getQuestAdvance,
  appendToLog,
};
