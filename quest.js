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


// ── Template substitution ─────────────────────────────────────────────────────

const renderText = (text, data) => {
  return text
    .replace(/\{\{checkin_time\}\}/g,    data.checkinTime    || '')
    .replace(/\{\{month\}\}/g,           data.month          || '')
    .replace(/\{\{day_of_week\}\}/g,     data.dayOfWeek      || '')
    .replace(/\{\{streak\}\}/g,          data.streak         != null ? String(data.streak) : '')
    .replace(/\{\{quest_day\}\}/g,       data.questDay       != null ? String(data.questDay) : '')
    .replace(/\{\{last_decision\}\}/g,   data.lastDecision   || '')
    .replace(/\{\{decision_echo_1\}\}/g, data.decisionEcho1  || '')
    .replace(/\{\{decision_echo_2\}\}/g, data.decisionEcho2  || '')
    .replace(/\{\{decision_echo_3\}\}/g, data.decisionEcho3  || '');
};

// ── Special narratives ────────────────────────────────────────────────────────

const SPECIAL_NARRATIVES = {
  chronicle_begins: {
    id:    'chronicle_begins',
    title: 'The Chronicle Begins',
    text:  `The Dreaming Pull has been in this house longer than the quest has.

It moved in the way it always does — not through the door, not through any entrance a person would use, but through the accumulated softness of a life that has been built well and knows it. A good job. Kath, and a dog named Stevie, both of whom are genuinely excellent. A life that asks nothing of the morning because the morning has already been earned. The Dreaming Pull does not create comfort. It finds comfort that already exists and makes itself at home inside it. This house gave it a lot to work with.

The Pull is not a villain. This is worth establishing early. It is a force as old as the first morning that was ever too cold to face, as patient as every reasonable voice that has ever whispered that today is fine, that tomorrow is also fine, that the version of yourself that gets up before dawn is not that different from the version that doesn't, not really, not in any way that matters. It is made of ordinary reluctance accumulated over a very long time. It genuinely believes what it offers. That is what makes it dangerous.

It has met Chip before. More than once. It knows the shape of his campaigns — the early momentum, the genuine intent, the specific texture of a Wednesday in week three when nothing has gone wrong and the comfortable life is right there and the growth is somewhere up the road being difficult. The Pull has the receipts. Day eight. Day eleven. Day fourteen. It has watched Chip choose the version of himself that wins in the 3.0 DUPR pickleball bracket because that's where he's the best player in the room — not the 4.0 bracket where he'd have to actually be challenged, where his real ceiling might reveal itself, where winning isn't guaranteed. The Pull knows this specific architecture. It has used it before. It intends to use it again.

But the ledger has five entries.

Will opened it on the morning the fifth alarm was answered — not snoozed, not negotiated with, answered — in Downers Grove. He wrote the date. He wrote the time. He drew a line beneath it, the way he does when something has been established. The Emberstone, which has been sitting on the nightstand since Tuesday and which Chip has been treating like a decorative object, went into the pack.

The Fellowship assembled: Will, who documents everything and whose care for Chip is expressed entirely through precision and the occasional devastating text message. Brent — Papi Chulo, as he has been known in this group since before anyone thought to question it — who has known Will and Kevin since high school and has spent the years since translating Will for people who don't know him well enough to read him, calling everyone Papi when they need it and meaning it every time. Kevin, who became a father and in so doing became someone whose mornings are not his own, and who joined this quest the way you join something you have already quietly been doing.

And Chip. Who built something real and good and has decided, somewhere below the level where he'd admit it, that maintaining it is enough. Who is funny in the way that keeps people from looking too closely. Who thinks he is always right in a way that the people who love him find both maddening and, somehow, one of his best qualities. Who has, against the Pull's reasonable expectations, answered five alarms.

Outside right now, while this is being read, something is moving in the early morning light — some small creature doing its business in the hour before the world gets loud, the kind of thing an environmental consultant who genuinely loves the natural world lies in bed and misses while the Dreaming Pull makes its case for one more hour. The Pull can offer warmth. It cannot offer the iridescent wing of a ground beetle at first light. This is a crack in its argument it has never fully solved.

Day one was last week. Day five is today.

The road to Ashen Peak starts here.`,
  },

  fellowship_regroups: {
    id:    'fellowship_regroups',
    title: 'The Fellowship Regroups',
    text:  `The Dreaming Pull has won this campaign before.

It is worth saying that plainly, without ceremony. The Pull has been here, in this specific stretch, with this specific traveler, and it has won. It knows what Chip's campaigns look like when they end — the momentum that runs out, the comfortable life that reasserts itself, the morning that was just one morning until it became the morning after which there were no more mornings. It has done this before. It will try to do it again.

Will updated the Hall of Campaigns. Days reached. Streak. Average wake time. He entered the final number without comment and closed the ledger and opened a fresh page. No post-mortem. No inventory of what failed. He sent Chip a text that said: "We didn't make it. New campaign when you're ready." That was the whole message. Will does not soften things and he does not pile on once the thing has already happened. He states it and turns the page.

Brent sent something shorter than usual. Kevin sent nothing until the next morning, when he sent: "The road is still there. That's not a comfort. That's just true."

The Emberstone is on the nightstand. It caught first light before anything else in the room did, the way it always does, because that is what it does regardless of what happened yesterday.

The Dreaming Pull is already here. It has been here. It is comfortable.

The road is still there.`,
  },

  personal_best: {
    id:    'personal_best',
    title: 'New Personal Best',
    text:  `{{checkin_time}} on a morning in {{month}}.

Will put three lines under the entry. Three lines is the closest the ledger comes to losing its composure.

Brent sent something that was mostly capitalization. Kevin sent a bug emoji, which was the correct call and everyone knew it.

New personal best. The Emberstone blazed.`,
  },

  before_7am: {
    id:    'before_7am',
    title: null,
    text:  `{{checkin_time}}.

The Dreaming Pull was still in the opening paragraph of its argument. Outside, something had been awake for a while already and wasn't waiting.`,
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

      scheduled: [
        {
          id:           'c1_s1',
          quest_day:    3,
          pull_appears: false,
          text:         `Stevie was awake before the alarm had a word to say about it. The Dreaming Pull was mid-construction on what was shaping up to be a structurally sound argument when the dog appeared at the bedroom door with a fully formed opinion about the morning and no awareness that an argument was in progress.

The argument collapsed. It always does. The Pull has spent considerable effort trying to understand the dog and has made no progress. Stevie does not experience the Dreaming Place. She does not weigh the warmth of the bed against the cold of the floor. She is simply awake, and present, and waiting, and the gap between her certainty and the Pull's offer is so complete that the Pull cannot find a way in.

This is, as far as anyone can determine, the Pull's only real vulnerability on this road.

The Emberstone lit. The morning was answered.`,
        },
      ],


      missed: `The Dreaming Pull won a morning in Downers Grove. It knows this house. It has furniture in this house. Today the furniture was sufficient.

Will sent a text that said: "Stevie is embarrassed for you." Brent replied: "Papi. Come on." Stevie went back to the door and waited and eventually gave up and went to her bed, which is the most disappointing thing that happens on a missed morning and the one nobody talks about.

The road will be there tomorrow.`,

      decision: {
        prompt:  `The alarm sounds in the grey before dawn. The house is still. The Dreaming Pull settles into the quiet and waits.`,
        choices: [
          {
            id:          'c1_rise',
            label:       'Rise before the argument develops',
            consequence: `The argument never assembles. The Pull hasn't finished composing its opening case when the feet are already on the floor, and a case that can't be heard is a case that didn't happen. The Emberstone catches first light. The road begins before the doubt does. This is the mechanical advantage of answering early — not courage, just timing.`,
          },
          {
            id:          'c1_wait',
            label:       'Lie still a moment before answering',
            consequence: `The Pull logs the pause in its long record of hesitations. It is thorough that way. The Emberstone catches anyway — not because the pause didn't happen, but because answering at all is what the record will show. One breath of stillness in a morning that answered. The Pull notes it and moves on.`,
          },
        ],
      },
      milestone: `Five mornings answered in Downers Grove. The Dreaming Pull has been in this house long enough to know the furniture. It has lost the argument five times now in a house it knows well, which is not something it is used to, and it is taking notes.

What Chip has built here is real. That is the whole problem. The Pull does not have to invent anything — it just has to point at what already exists. The good job. Kath. Stevie. The life that is genuinely good and in which nothing requires the morning to be answered at any particular hour. In a bad life, getting up is easy. The bad life demands it. A good life is where the Dreaming Pull does its best work. It has been doing its best work here.

But the alarm has been answered five times. In a house the Pull knows well, in a life the Pull has been using against Chip for years, the answer came anyway. Five times. That is not an accident. That is not momentum yet either — momentum is what days six through thirty are going to reveal — but it is five mornings the Pull did not win, and the Pull is a meticulous accountant of its own losses.

The Emberstone is in the pack. Stevie is at the door, which she has been at every morning before the alarm finished its thought, which is the one variable the Pull has never found a counter to. A dog with a fully formed opinion about the morning is not something the Dreaming Pull can argue with. It does not speak that language.

Chip told the group he was ready. He said it the way he says most things — with the complete confidence of a man who believes he is always right and does not check this belief very often against the evidence. Brent said let's go, Papi. The Fellowship noted the confidence and said nothing further, because they have known Chip long enough to know that the armor is part of him, and the campaign needs him in it.

Five mornings. The road is outside.
Stevie has already found it.`,

      milestone_attribution: null,


    },

    // ── Chapter 2 ─────────────────────────────────────────────────────────────
    {
      number:   2,
      title:    'The Amber Road',
      location: 'The road south',
      days:     [6, 10],

      scheduled: [
        {
          id:           'c2_arrive',
          quest_day:    6,
          pull_appears: false,
          text:         `The Amber Road arrives as a smell before anything else — dust and something older underneath it, the specific scent of a path that has absorbed ten thousand mornings. The Emberstone in the pack is warm in a way it wasn't in the house. The road notices the difference between a traveler in motion and one who is deciding whether to move.

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


      missed: `One morning lost on the Amber Road. The Dreaming Pull knows this stretch well — it has been working it since before the quest had a name.

The road will still be there.`,

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
      milestone: `Ten mornings. The road has a name now.

There's a mile marker on the Amber Road — old stone, inscription worn past reading — where travelers have cut marks since before the current cartographers were born. Initials. Dates. A few symbols nobody has translated. They stop at different points down the road, the marks. Some here. Some further. The road doesn't say which ones made them on the way out and which came back.

The Emberstone burns steadier here than it did in the first five days. Not brighter. Steadier. There is a difference. A flame that might go out feels different from one that has decided not to. The difference is not visible. It is felt.

Will's ledger entry for day ten arrived with a single line appended below the timestamp: "Double digits. This was not a given." Brent sent a separate message thirty seconds later: "What Will means is: we're genuinely impressed. He doesn't say that. I do." Kevin, from a time that told its own story, sent: "Ten. Nice." And then, three minutes later: "I mean it."

For Will, nothing further was the comment. For Brent, translating Will is an act of service he has fully committed to. For Kevin, three minutes of sitting with a thing before sending it is how Kevin is certain.`,

      milestone_attribution: null,


    },

    // ── Chapter 3 ─────────────────────────────────────────────────────────────
    {
      number:   3,
      title:    'The Fogmere',
      location: 'The Fogmere',
      days:     [11, 15],

      scheduled: [
        {
          id:           'c3_arrive',
          quest_day:    11,
          pull_appears: true,
          text:         `The Fogmere arrives as a temperature drop and a change in sound — not quiet exactly, more like the world has put a hand over its own mouth and is waiting to see what happens next. Visibility goes to thirty feet. The Emberstone gets warmer as the air gets colder, which is either the stone doing its job or something else entirely, and the road through the grey does not offer an explanation.

Chip reported the fog to the group. Brent replied: "Papi the fog is actually real." Will told him to keep moving. Kevin, awake since before any of this started and running on whatever gets a person through an early morning with young children, offered tactical guidance: the fog does not care about Chip personally, which is encouragement in the specific register of someone who has learned that accurate is more useful than warm.

The Dreaming Pull was already here. It did not arrive with the fog. It was waiting for the fog, the way a familiar argument waits for the right conditions. The grey is its best material on this road. It has won campaigns in fog that it lost in the clear. It is comfortable here in a way it has not been since Downers Grove, and it is not in a hurry.

The road bends ahead, just past where the stone's light reaches. It knows something about this stretch that it is not sharing yet.`,
        },
      ],


      missed: `The Fogmere claimed a morning. The Dreaming Pull was comfortable in the grey and it used that comfort methodically, the way it uses everything — without embellishment, without drama, just the accurate presentation of what already exists.

Will sent: "Absolute clown show. Get up tomorrow." Brent said: "Papi the fog is temporary and the road isn't." Kevin said: "I've been up since five. I have no patience for this. Get up tomorrow."

The road is still there on the other side of the grey. It was there the whole time.`,

      decision: {
        prompt:  `The fog is heaviest at the chapter's midpoint. The Emberstone lights the next few steps. No further.`,
        choices: [
          {
            id:          'c3_trust',
            label:       'Trust the stone — move without seeing far',
            consequence: `The Emberstone has not been wrong yet about what is ahead. Moving without full visibility is a different skill than moving with it, and this is where that skill gets built — not in the clear sections, not on the Amber Road, but here where the stone lights three steps and you take three steps and trust that it will light three more. Most travelers who made it through the Fogmere describe it this way afterward: not bravery. Just three steps at a time.`,
          },
          {
            id:          'c3_wait',
            label:       'Wait for a clear moment before pressing on',
            consequence: `The Fogmere does not reliably produce clear moments. But it produces them occasionally — a shift in the air, a brief thinning — and a traveler who has learned to recognize them and move when they come is a traveler who has learned something about this particular kind of patience. The waiting is not failure. The waiting is information about what kind of mover you are.`,
          },
        ],
      },
      milestone: `Fifteen mornings. The Fogmere is behind them, and that sentence contains the whole story.

The Fogmere does not fail campaigns dramatically. This is the thing about it that the cartographers note and travelers tend not to believe until they're in it. There is no single terrible morning, no obvious breaking point, no moment you could point to afterward and say: that was where it ended. Instead there is a slowdown. One miss, the road still there. Another miss, still fine, nothing permanent about it. And then the misses have accumulated enough weight that continuing feels like the strange choice and stopping feels like coming to your senses, and by then it is already over and the fog has simply absorbed the campaign without anyone noticing the exact moment it happened.

That did not happen.

The Emberstone is still lit on the other side of the Fogmere. That is the entirety of what making it through looks like. The stone was still lit.

An environmental consultant who knows what lives in fog — who could tell you, specifically, which insects work the grey hours, what the damp does to soil composition, what the visibility means for the creatures that depend on it — walked through the stretch where most campaigns quietly stop, because the interesting things do not stop just because you cannot see them, and at some level Chip has always known that.

Brent had been sitting on something since morning and sent it at noon: he had been wrong about this stretch and he was keeping a list of the ways he was wrong about this campaign and the list was getting longer. Will replied in the group that Brent's list and his ledger were the same document. Kevin sent a laughing emoji and then said that was genuinely beautiful. Will did not respond to this, which is how Will accepts something he agrees with but will not say out loud.

The air on the other side is different. Not better. Just different in the way air feels when you have moved through something without knowing what it cost until after.`,

      milestone_attribution: null,


    },

    // ── Chapter 4 ─────────────────────────────────────────────────────────────
    {
      number:   4,
      title:    'Thornwick',
      location: 'Thornwick',
      days:     [16, 20],

      scheduled: [
        {
          id:           'c4_arrive',
          quest_day:    16,
          pull_appears: false,
          text:         `Thornwick smells like woodsmoke and old paper — the smell of a place that has been keeping records for long enough that the records have become part of the architecture. The buildings are low. The streets are narrow. Every surface has been labeled by someone who thought the labeling mattered, and in Thornwick, they were right.

Chip's arrival generated conversation in the group about whether the records were real, whether Will's ledger counted, and whether the cartographers would have anything to say about previous campaigns. Will noted the ledger was already a primary document. Brent said: "Papi Chulo has arrived in Thornwick." Kevin, from a timestamp suggesting he had been awake since before the conversation began, said there was an entry in the Thornwick ledger that stopped at day forty-seven with no explanation. Nobody asked how Kevin knew this. By now the group had learned that with Kevin, sometimes you just receive the information.

There is a name carved into the waypost at Thornwick's eastern edge: Elara. No family name, no date. Below it, a symbol the cartographers say means: passed through, continued. Her route extends further than most. Nobody knows how far she got.`,
        },
        {
          id:           'c4_s1',
          quest_day:    17,
          pull_appears: false,
          text:         `The Dreaming Pull in Thornwick has less to work with than it did in the Fogmere. Villages are harder for it than open roads — there is too much specificity, too many things that are clearly what they are and not something else. The Pull operates best in the ambiguous hours and the undifferentiated grey. Thornwick is neither.

What it tried this morning was the records — the evidence of everyone who had stopped before day twenty, the weight of all that precedent. Look, it said, in the way it says things. Look at how many entries end here. The Emberstone caught anyway.

The cartographers noted the time without comment and added a mark to their current survey. The detail they were working on — a bridge two days east — gained another confirmed measurement. The map gets more accurate one morning at a time. So does the road.`,
        },
      ],


      missed: `A blank in the Thornwick records today. The cartographers leave space for these. They have seen enough campaigns to know that a blank is not an ending unless the traveler decides it is.

Will sent a text describing Chip's choices with the clinical precision of someone who has been watching this pattern for years. Brent said: "Papi, tomorrow is still on the map." Kevin said: "Don't let one blank become the chapter. Get up."

The road will be there. The compass still points.`,

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
      artifact_awarded: 'compass',


      milestone: `Twenty mornings. Thornwick has been watching.

The cartographers keep entries going back further than this quest — different travelers, different campaigns, the same road. The entries that extend furthest do not belong to the travelers who seemed most certain at the start. They belong to the ones who kept showing up after certainty would have been reasonable to abandon, after the road stopped feeling like an adventure and started feeling like a commitment, after the Wednesday in week three arrived with its ordinary face and its specific offer.

One entry in the Thornwick ledger stops at day forty-seven. No explanation. The cartographer's margin note says only: further than expected.

The Emberstone burns with a steadiness in Thornwick that it did not carry through the Fogmere. Not brighter. More settled. Something that has decided what it is burns differently from something still figuring it out. That difference is visible in the stone if you know what to look for. The cartographers noticed on the first morning. They noted it without comment, the way they note everything — because the details are the map, and the map is the point.

A cartographer pressed a compass into the pack at the twenty-day mark. No explanation. It does not point north. It points at something. The cartographer offered no clarification and seemed to expect none would be needed.

Chip told the group about the compass. He thought it was broken. Will replied that the cartographers of Thornwick do not give broken compasses to travelers and suggested Chip read the room. Brent translated: "Papi it's not broken, it's significant, hold onto it." Chip said so he should hold onto it. Kevin replied: yes, Chip. Hold onto it.`,

      milestone_attribution: null,
    },

    // ── Chapter 5 ─────────────────────────────────────────────────────────────
    {
      number:   5,
      title:    'The Greywood',
      location: 'The Greywood forest',
      days:     [21, 25],

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

The Emberstone lit. That is what matters today.`,
        },
      ],


      missed: `The Greywood held a morning in its roots. The silence here is too comfortable, the case too familiar.

Will sent something clipped and accurate. Brent said: "Papi the trees don't care either way. The road does." Kevin said: "The Greywood is where it gets quiet enough to hear the wrong voice. You heard it. Hear the other one tomorrow."

The road will still be there.`,

      decision: {
        prompt:  `The Greywood is deep and old. The trees have been here long enough to have watched other travelers come through this same path.`,
        choices: [
          {
            id:          'c5_quick',
            label:       'Move quickly through',
            consequence: `Some places work on you less if you don't give them time. The Greywood is old and patient and will be here long after the quest is finished — it does not require your attention in order to do what it does to travelers. Moving fast through it is a reasonable choice. The Emberstone burns cleanly when the pace is urgent.`,
          },
          {
            id:          'c5_slow',
            label:       'Move slowly and listen',
            consequence: `The Greywood records those who rush and forgets them at the same rate. Slow travelers it keeps something of — not a memory exactly, more like a shape, an impression left in the air by someone who was paying attention. The trees have been recording travelers long enough that they know the difference. So does the stone.`,
          },
        ],
      },
      milestone: `Twenty-five mornings. A quarter of the road behind, though the road does not announce how much is left.

The Greywood has a patience that is not passive — it has been here long enough that it has stopped needing to be. The old trees have watched enough travelers come through, certain ones and uncertain ones, and they have reached no conclusions about which kind arrives further. They record. They don't distinguish.

The Emberstone burns differently in the Greywood. Not brighter. More focused. Like the forest is giving it something to push against, and the push is making the stone more certain of its own light.

Kevin sent something during the Greywood stretch. The timestamp said something about his morning before the message did. It said: "Twenty-five. The part where it stops being a thing you're doing and starts being a thing you are takes longer than people think. You're in that part now." No elaboration. Kevin doesn't elaborate. The message was complete when he sent it.

Chip said: did Kevin just go deep? Brent replied: Kevin goes deep approximately once every nine days. You learn to wait for it. Kevin replied: I was just awake and had a thought. Don't make it a thing. Will replied: Day 25. Documented. Kevin replied: Thank you Will. Will replied: That's what the ledger is for.`,

      milestone_attribution: null,


    },

    // ── Chapter 6 ─────────────────────────────────────────────────────────────
    {
      number:   6,
      title:    'The Hollow Pass',
      location: 'The Hollow Pass',
      days:     [26, 30],

      scheduled: [
        {
          id:           'c6_arrive',
          quest_day:    26,
          pull_appears: false,
          text:         `The Hollow Pass arrives as cold before it arrives as anything else — not weather cold, structural cold, the kind that has been sitting in canyon stone long enough to become part of the stone. The sound in the Pass is different. Contained. Like the walls are deciding what to do with it before they let it go anywhere.

Chip sent a check-in to the group noting the temperature. Will confirmed the documentation and agreed with the temperature assessment. Brent replied: "Papi is in the Pass." Kevin was already in a cold car for reasons involving his children and their morning schedules and offered no sympathy on the cold, then mentioned that one of his kids had woken him up to ask if bugs dream, which he had not been able to answer, and that Chip might have thoughts on this given his line of work. Chip said he had several thoughts on this actually and would report back. Kevin said of course he would.

The compass needle, which has been gesturing at a direction since Thornwick without settling, went still in the Pass. Pointed cleanly. Has not moved.

The hollow stone from the wall — smooth, heavier than it looks, warmer than the temperature of the Pass has any right to allow. It went into the pack without a decision being made about it. It is simply there now.`,
        },
        {
          id:           'c6_s1',
          quest_day:    28,
          pull_appears: true,
          text:         `The hollow stone has been in the pack since the Pass wall, which is to say it went in without a decision and has stayed without one. Smooth. Heavier than its size suggests. Warmer than the temperature of the Pass has any business allowing. Most of the time it is just weight.

This morning the Dreaming Pull assembled what may have been its most structurally sound argument since Downers Grove. Cold air. The Pass still dark. The specific logic of a warm bed in a cold place presented without embellishment, because the Pull does not embellish. It finds the real thing and offers the real thing, and the real thing here was accurate and well-constructed and landed with the precision of something that has been waiting for the right conditions.

The hollow stone was warm in the pocket.

That is all it did. It was simply warm in the exact place where warmth was the Pull's entire argument, and something about that made the argument's footing uncertain, and the answer came, and the Dreaming Pull withdrew to prepare something new for tomorrow.

The stone is still in the pack. Still warm.`,
        },
      ],


      missed: `One morning lost in the cold of the Pass. The Dreaming Pull found its argument in the temperature and made it without a single word it didn't need. Cold is real. The Dreaming Place is warm. The case practically assembles itself in a canyon at dawn.

Will sent a text that did not mince anything. Brent said: "Papi the Pass will still need crossing and the stone is still in the pack." Kevin sent: "The compass doesn't change direction because you had a bad morning. Get up tomorrow."

The Pass will still need crossing. That is not a comfort. That is just the Pass.`,

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
      artifact_awarded: 'hollow_stone',


      milestone: `Thirty mornings.

The Hollow Pass offers no scenery and no revelation. It offers passage, and passage is what it gave. Thirty is a number that means something — not because of what the number is, but because of what thirty consecutive mornings cost and what they built in the building.

The Emberstone burns at its clearest in the Pass. Not its brightest. Its clearest. The Pass strips things to what they actually are. What they actually are, thirty mornings in, is a traveler who has continued past the point where stopping would have been reasonable.

The compass from Thornwick stopped moving in the Pass. It had been pointing with conviction since day twenty, but here the needle settled into certainty. Whatever it is pointing at, the Pass is where the direction became fixed.

Will's ledger entry for day thirty: "Thirty. I had twenty-two in the pool." He did not explain who else had entries, or what they guessed. He noted that thirty was not the consensus. Nothing else. Brent replied to Will in the group: "For anyone curious, Will's 'nothing else' here is doing a lot of work. He's extremely pleased." Kevin sent: "I had thirty-one, for the record." Will replied: "You had the highest number." Kevin replied: "I believed in the guy." A pause. "Still do."

Some things get documented because they should be.`,

      milestone_attribution: null,
    },

    // ── Chapter 7 ─────────────────────────────────────────────────────────────
    {
      number:   7,
      title:    'The Sanctuary of Halvard',
      location: 'The Sanctuary',
      days:     [31, 35],

      scheduled: [
        {
          id:           'c7_arrive',
          quest_day:    31,
          pull_appears: true,
          text:         `The Sanctuary smells like woodsmoke and something underneath it that has no name — something that has been accumulating in the stones of this place for longer than the road has been a road, pressed into the walls by every traveler who has stopped here and sat by the fire and listened. It is warmer than outside by more than the fire should account for. Halvard is already at the fire when the morning arrives. He does not look up.

Nobody in the Fellowship had heard of Halvard before the road brought them here. Brent had asked around in the group before the chapter started — did anyone know anything about this stop, what to expect, whether the Sanctuary had a reputation. Will said the cartographers in Thornwick had a record of it going back further than their other entries and had declined to add commentary. Kevin said he'd heard of it. Just that — heard of it. Brent asked from where. Kevin said: just around. Different roads. Something in the way Kevin said it closed the subject without closing it.

Halvard has been at this fire for a long time. He has seen the Dreaming Pull work this stretch more times than he has counted, and he knows what it uses here — the warmth, the genuine rest, the entirely reasonable suggestion that a waystation exists for exactly this purpose. He has watched travelers arrive certain and leave carrying something they could not have described on arrival.

He did not look up. But he noticed the Emberstone.

The Dreaming Pull was already here. It has always done well at the Sanctuary. It is making itself comfortable.`,
        },
        {
          id:           'c7_s1',
          quest_day:    33,
          pull_appears: true,
          text:         `Halvard spoke about the Dreaming Pull once during the Sanctuary days. Not a lecture. One thing, said without setup or conclusion, at the fire.

He said the Pull doesn't want to keep anyone. That is a common misunderstanding. It wants to offer the Dreaming Place because the Dreaming Place is genuinely good and it genuinely believes this. The danger is not in the offer. The danger is in the door.

The Pull doesn't lock the door. It stops mentioning it. And the Dreaming Place becomes comfortable enough that the door stops mattering. And then one morning it's stiff from disuse and you think: it was always going to be difficult to leave.

He said the only thing that keeps the door easy is using it every morning whether you want to or not. He still uses it. After all this time.

What he said after that is what's in the pack.`,
        },
      ],


      missed: `The Sanctuary held a morning. The Dreaming Pull had its best material on the entire road here — warmth, genuine rest, the reasonable case for a waystation doing exactly what a waystation is designed for — and it used all of it.

Will sent a text. Halvard said nothing, which at the Sanctuary means he noticed and is keeping it. The road will be there when the door opens.`,

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
      artifact_awarded: 'halvard_word',


      milestone: `Thirty-five mornings, and the Sanctuary.

Halvard does not make speeches. He sits at his fire and he watches the stone and at some point during the days a traveler stays, he says one thing. Once. Without setup, without conclusion, in the register of things that are offered rather than explained. What he said this time will not be recorded here. Some things lose something essential when they are written down — the specific weight of them, the particular quality of silence that follows. What it does is get carried. In the pack, alongside the compass and the hollow stone, it goes into the road ahead and it will be there when the road gets hard enough to need it.

The Emberstone burns quietly at the Sanctuary. Not dimly. Quietly. The way a fire burns when it is not competing with anything.

Chip told the group a rough shape of what Halvard said — not the full thing, a suggestion of it. Will replied, after a pause that felt chosen: that tracks. Brent said: "Papi, I need the full version." Kevin said he was not going to get the full version. Chip confirmed this.

Kevin said he knew. Because he'd been here before.

Different road, he said. Different year. You carry it or you don't, and you can't give the full version to anyone who wasn't there.

The timestamps show a gap after that. Long enough that Brent, who processes things out loud and in real time, had to sit with something in silence, which is not his natural state. He came back with: so Kevin has actually been to the Sanctuary. Kevin replied: different road. That was all he said. The subject didn't close exactly. It just ran out of questions anyone knew how to ask.

Some information changes the room just by arriving. Kevin does this sometimes. Then he acts like he was just clearing his throat.`,

      milestone_attribution: null,
    },

    // ── Chapter 8 ─────────────────────────────────────────────────────────────
    {
      number:   8,
      title:    'The Ashfields',
      location: 'The Ashfields',
      days:     [36, 40],

      scheduled: [
        {
          id:           'c8_arrive',
          quest_day:    36,
          pull_appears: false,
          text:         `The Ashfields arrive as a flattening. The trees end. The sound ends. What remains is grey grass and grey sky and the compass bearing and the Emberstone's light, which is the only color for as far ahead as the road goes in any direction.

The Dreaming Pull had been expecting this stretch to be useful. It finds, arriving here, that the Ashfields have given it less to work with than anticipated. The absence of warmth and comfort was supposed to make the Dreaming Place sound better by contrast. What the Pull had not accounted for was that the absence of warmth and comfort also makes argument harder. The grey is neutral and the neutral is, for once, not working in the Pull's favor. It is recalibrating.

Chip sent a photo to the group. The photo was entirely grey. Brent replied: "Papi is that a photo or did your camera break." Will said that was what the Ashfields looked like and to keep moving, then noted that the Emberstone was visible in the photo, bottom left, small and warm against all of it. Everyone looked. Kevin said: look at that. Nothing else. Sometimes Kevin's brevity is the whole response.

The compass points steadily ahead. More clearly now that the horizon is flat and there is nothing between here and what the compass has been pointing at. Something is there. Not close. But there.`,
        },
        {
          id:           'c8_s1',
          quest_day:    38,
          pull_appears: true,
          text:         `The Dreaming Pull in the Ashfields has been recalibrating since the first morning here. It has worked grey stretches before — the Fogmere was grey and the Fogmere was very useful — but the Fogmere had texture, had the specific comfort of enclosed space, had something for the dreaming place to sound better than. The Ashfields have nothing. They are genuinely neutral, which the Pull has discovered is harder to use than it expected.

What it has settled on, by day thirty-eight, is not argument. It is simply presence. It does not make the case for stopping — it just stays close, the way something stays close when it knows the argument isn't needed, when endurance alone is the whole game.

The Emberstone held anyway. It has held every morning of the grey, small and warm against the flat horizon, visible in every photograph sent from this stretch.

The Pull notes this. It is keeping its own ledger.`,
        },
      ],


      missed: `The grey claimed a morning. The Dreaming Pull in the Ashfields does not argue — it simply offers what the grey already is, which is the absence of any particular reason to get up, which is a more effective argument than most of what it usually deploys.

Will sent: "The Ashfields required only that you walk through them. Get up tomorrow." Brent said: "Papi the slope is right there on the other side, visible from here." Kevin said: "One morning. Not a trend. Don't let it become one."

The compass still points. The road will be there.`,

      decision: {
        prompt:  `The Ashfields open ahead. No landmarks. Grey to the horizon. Only the compass bearing and the Emberstone's light.`,
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
      milestone: `Forty mornings. The Ashfields are behind them.

The Ashfields prepare the traveler for nothing. That is their particular function. Everything after the Sanctuary — after the warmth and the quiet and Halvard's single observation — arrives here as a stripping. Not threat. Not cold. Just the grey, and the road, and the question of whether the Emberstone still burns when the landscape offers no argument for burning.

It still burns.

On the far side of the Ashfields the road changes. The slope becomes visible for the first time. Not close. But there — something the compass has been pointing toward since the Hollow Pass, finally catching the stone's light.

Brent sent something at the forty-day mark: "I'm going to tell you something I didn't say at the start because saying it at the start would have jinxed it. I had a message ready. The one I was going to send when this fell apart. I had it ready since day twelve. I deleted it this morning." A pause. "You made it through the Ashfields. Will didn't think you would. I didn't either, but I wanted to be wrong. I was. I'm keeping track." Will replied, in the group, thirty seconds later: "My prediction was not pessimism. It was prior data." Kevin replied: "Will." Will replied: "The data has been updated." Brent replied: "That's the nicest thing Will has ever said." Will replied: "That is not what I said." It was exactly what he said.`,

      milestone_attribution: null,


    },

    // ── Chapter 9 ─────────────────────────────────────────────────────────────
    {
      number:   9,
      title:    'The Ridge of the Unremembered',
      location: 'The Ridge of the Unremembered',
      days:     [41, 45],

      scheduled: [
        {
          id:           'c9_arrive',
          quest_day:    41,
          pull_appears: false,
          text:         `The Ridge arrives as altitude. The air is thinner here — not cold exactly, just less of everything, as if the atmosphere is being economical at this elevation. The road on the Ridge is harder than the road below it in a way that shows in the stride rather than in any single obstacle. The Emberstone burns clean up here. No fog to push through, no grey absorbing the light. Just the burn and the road and the horizon, which is further away than it has been at any point in the campaign.

Chip sent a check-in noting that you could see far from up here. Brent replied: "Papi Chulo on the RIDGE." Will entered it in the ledger: something visible on the horizon, day forty-one. Kevin said that was what the compass had been for. Chip asked if Kevin thought that was actually Ashen Peak. Kevin replied: you have been walking toward it for forty-one days. What else would it be.

The shapes the Ridge holds are not physical. They are the altitude of campaigns that stopped here — the height travelers reached before the comfortable life reasserted its gravity, before the reasonable voice said this was enough, before they came down without knowing they had decided to. The Ridge holds the shape of those almost-arrivals in the air above where they stopped.

Standing on the Ridge means standing above most of those shapes. That is a specific kind of information. The question of whether to name what you can see on the horizon, or keep it a direction a little longer.`,
        },
        {
          id:           'c9_s1',
          quest_day:    43,
          pull_appears: false,
          text:         `Will's ledger entry for a morning on the Ridge arrived with an annotation in the margin: "Note: the traveler whose entry stops at day forty-seven stopped somewhere in this stretch. Chip is past that mark."

No comment on what this means. Will records the thing and allows the thing to mean what it means.

Brent replied in the group: "Papi. That's a big deal." Will said it was a data point. Kevin said it was a big deal. A pause — longer than Will's pauses usually are. Then Will: "The ledger notes it." Brent said that meant yes.

Kevin said: "You were a giant dumb bitch at the start of this. From where we're standing right now you're a medium dumb bitch at best. Don't ruin it."

Chip replied: I'll take it. Will replied: Documented.`,
        },
        {
          id:           'c9_s2',
          quest_day:    44,
          pull_appears: true,
          text:         `The Dreaming Pull tried something on the Ridge this morning that it does not usually try.

Not the warmth of the bed. Not the silence. Not the reasonable argument about an hour from now and nothing being different. It went back further.

It found a morning from Madison — a specific one, not invented, accurately remembered. An apartment Chip no longer has, windows he no longer looks through, a morning before the life that is good and real and built and his had accumulated its current weight. A morning when nothing was owed and nothing was required and the day had not decided yet what it wanted from him. Before the career. Before Stevie. Before the group chat and the ledger and the road. The Pull found this morning and offered it with the care of something that knows the difference between what works and what almost works.

It was a real thing. The Pull does not manufacture. It finds the real thing and opens the door to it.

What it cannot explain — what it has never been able to explain in all the years it has been doing this — is why that morning requires the Dreaming Place to access. The memory belongs to Chip. The Pull simply found it first and is using it as a door.

The Emberstone held. The answer came.

Outside on the Ridge, at the exact hour the answer came, something was moving in the early light — some small creature doing something in the thin air at elevation that it has been doing every morning of this campaign, whether or not anyone was awake to see it. Chip was awake to see it. The Pull cannot account for this variable. It never has.`,
        },
      ],


      missed: `One morning lost on the Ridge. The Dreaming Pull found the memory it needed — specific, accurate, from the right year — and it used it with precision.

Will sent: "Embarrassing. Get up tomorrow." He did not add anything else, which was its own kind of comment. Kevin sent, an hour later: "The Ridge is where most of these end. You know that. Don't let it be yours." Brent said: "Papi. The thing on the horizon is still there."

Some missed days are different from others. This was one of those. Get up tomorrow.`,

      decision: {
        prompt:  `The destination is visible on the horizon for the first time. Just barely. The compass has been pointing at it since the Hollow Pass.`,
        choices: [
          {
            id:          'c9_name',
            label:       'Name what you\'re seeing',
            consequence: `Naming the destination makes it real in a way the compass never quite did. It also makes the distance real, and the doubt, and the specific weight of forty-one answered mornings that were working toward something you could only call "the direction." You name it anyway. Ashen Peak. The Emberstone burns a little different after that — not brighter. Steadier. Like it heard.`,
          },
          {
            id:          'c9_silent',
            label:       'Don\'t name it yet',
            consequence: `The Unremembered travelers — the ones whose shapes the Ridge holds — most of them named it when they saw it. The naming made it feel close. Closeness made it feel achievable. Achievable made rest feel reasonable, and the reasonable kind of rest is where campaigns end. You keep it a direction. A direction has no weight yet. You can walk toward a direction without having to believe in it.`,
          },
        ],
      },
      milestone: `Forty-five mornings.

The Ridge of the Unremembered does not offer comfort. It offers clarity. The Emberstone burns cleanly here — no fog, no grey, nothing absorbing the light. Just the burn and the road and how far the light reaches on a given morning, which on a good morning at this elevation is further than it has been at any point since Downers Grove.

On the horizon: something. Not named yet. Not close. But the compass has been pointing at it since the Hollow Pass and the stone's light reached it this morning for the first time, briefly, before settling back to its normal range. It was there. Yesterday it was not there.

The Ridge was named for the campaigns that stopped here. Not failed — stopped. The travelers who got this far are not gone. They are in the comfortable life, which is real and not wrong, not remembering clearly what the air felt like at this altitude. The Ridge holds the shapes of their almost. The view they were about to have.

Kevin sent something during the Ridge stretch at a timestamp that described what his morning had required before any of this. His older one had asked why he gets up before it's light. Kevin told him: because the morning is better before anyone else gets to it. The kid thought about it. Then he got up with Kevin. Kevin said he went back to sleep twenty minutes later. Chip said: still. Kevin said: he does that, like you.

Will put it in the ledger. Kevin said not to. It was already in there.`,

      milestone_attribution: null,


    },

    // ── Chapter 10 ────────────────────────────────────────────────────────────
    {
      number:   10,
      title:    'The Forgetting',
      location: 'The Forgetting',
      days:     [46, 50],

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


      missed: `The bridge requires crossing at dawn. Dawn came and went without a crossing. The Dreaming Pull at the Forgetting used the gorge's particular silence well today — the specific suggestion that the other side was not materially different from this side, which is technically accurate and entirely beside the point.

Will sent something that did not leave room for interpretation. Brent said: "Papi the flask is still on the railing." Kevin said: "The Forgetting works on everyone. It worked today. Cross it tomorrow."

The bridge offers the same crossing tomorrow.`,

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
      artifact_awarded: 'flask',


      milestone: `Fifty mornings. The Forgetting is behind them.

The Forgetting is a gorge and a bridge and a thing that happens to travelers who stop and look down too long. Not forgetting the destination — the Dreaming Place is still warm, Ashen Peak is still real, the compass still points. What the Forgetting does is subtler: it makes the weight of all of that feel permanent. Makes the distance feel like it has always been there and will always be there and crossing the bridge does not change it. The campaign continues on the other side, it tells you, but the campaign continues as what you already are, not as something different. The crossing is just geography.

The Emberstone blazed on the crossing. Not the steady burn of the Amber Road or the clear burn of the Ridge. Blazed, the way it hasn't blazed since the road started, like it had an opinion about what the Forgetting had just tried.

Among the marks on the railing: a flask. Old. Sealed. A note: water from below. In case you need to remember what you're crossing for. It went into the pack.

Will sent one thing at fifty days: "I had you for the Valley. I was wrong. I am updating my assessment." A pause. Then: "Halfway. Don't make me write another one of these." Brent replied: "Papi Chulo. Will updating his assessment is Will giving a standing ovation, for the record." Kevin said: "I know." Will said: "The assessment has been updated. That is all." Will did not respond to Brent's interpretation. The Emberstone was blazing when all of it arrived.`,

      milestone_attribution: null,
    },

    // ── Chapter 11 ────────────────────────────────────────────────────────────
    {
      number:   11,
      title:    'The Valley Below the Peak',
      location: 'The Valley Below the Peak',
      days:     [51, 55],

      scheduled: [
        {
          id:           'c11_arrive',
          quest_day:    51,
          pull_appears: false,
          text:         `The Valley arrives as the end of the grey and the beginning of something that does not have a clean name. The Peak is above — not inference, not the compass's direction, not something on the horizon. The actual shape of the thing the road has been moving toward for fifty mornings, visible, in the light.

The Emberstone burns warmer than it has since Thornwick. Something about proximity does this.

Chip sent a photo. The Peak in the background, half in cloud, the road going up toward it. Brent replied: "PAPI CHULO." Will noted the day, the location, the visibility — then paused in a way that felt like he was choosing what to add — then noted that the Peak was visible in the photo and added nothing further, which from Will meant he was looking at it too and did not have a ledger entry for what that felt like.

Kevin said: look at that. Just look at it. Then: keep looking. Then: start walking. Chip said he was walking. Kevin said: I know.

The compass still points at the Peak. It has found the end of its function. It points anyway.`,
        },
        {
          id:           'c11_s1',
          quest_day:    53,
          pull_appears: true,
          text:         `The Dreaming Pull that arrives in the Valley Below the Peak is not the same one that left Downers Grove.

It will not say this. The Pull does not perform self-awareness — it is not that kind of thing. But something has shifted in the architecture of what it offers here versus what it offered on day one, and the shift is not in the offer. The offer is the same. The Dreaming Place is still warm and real and asking nothing and it is as available today as it was at the beginning.

What has changed is the receiver.

Fifty mornings of answered alarms have done something that the Pull does not have a word for, because the Pull has no vocabulary for the thing a person becomes after fifty consecutive choices in the same direction. It is reaching for material it has not deployed since Madison.

The answer keeps coming. The Pull will be there tomorrow. The difference, from the Valley, is that Chip knows its voice now — knows the texture of it, the specific quality of warmth it offers. Familiarity does not make the offer less real. It makes the source recognizable. And recognition, it turns out, is enough.`,
        },
      ],


      missed: `The Valley claimed a morning in sight of the Peak. The Dreaming Pull used the altitude — made the summit look like something that would still be there, made the bed look sufficient, made both things feel true simultaneously, which they were, which is the most dangerous version of the argument.

Will sent: "You can see the summit from where you are sleeping. Think about that. Get up tomorrow." Brent said: "Papi the SUMMIT is RIGHT THERE." Kevin sent, after a longer pause than usual: "You know what you're doing. Do the other thing tomorrow."

The Peak is still there. The road continues tomorrow.`,

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
      milestone: `Fifty-five mornings, in sight of the Peak.

The Valley Below the Peak is not comfortable. The name is wrong about it. The Valley is hard — the altitude makes the Emberstone's light feel exposed, the road offers nothing in the way of warmth or cover or the pleasant fiction that the destination is still far enough away to approach gradually. The destination is directly above. The road goes there. That is the situation in the Valley and it has been that way every morning of this chapter.

The compass that settled in the Hollow Pass has reached the end of its job. It still points at the Peak because it has pointed at the Peak since the Pass and it does not know how to stop. The direction is no longer information. It is confirmation.

What Halvard said at the Sanctuary became useful in the Valley in a way it had not been useful before. The Valley is where it became clear why he said it when he did, and not earlier, when it would have seemed like advice rather than recognition.

Brent sent something on a morning when the Peak was visible through low cloud. He said he knew this stretch — not this one specifically, but the stretch where there is nothing to confirm you are doing the right thing except the fact that you are doing it. He said Will would tell Chip the ledger confirmed it. He said he would tell Chip something different: he already knew. He had known since the Fogmere. He had just needed enough elevation to see it clearly.

Will replied in the group: I would also tell him that. Brent said: I know. I was being diplomatic. Kevin said: the summit is up there. Go get it. Chip replied: yeah. A pause. Yeah, okay. Kevin replied: that's the one.`,

      milestone_attribution: null,


    },

    // ── Chapter 12 ────────────────────────────────────────────────────────────
    {
      number:   12,
      title:    'Ashen Peak Slope',
      location: 'Ashen Peak',
      days:     [56, 60],

      scheduled: [
        {
          id:           'c12_arrive',
          quest_day:    56,
          pull_appears: false,
          text:         `The slope of Ashen Peak is ash and old stone and the specific silence of a place that has been waiting for this particular traveler for sixty days without knowing it. The air is different at altitude — clean in a way the road below isn't, the kind of clean that has no smell, just the absence of everything that accumulates at lower elevation. The Emberstone in the pack blazes. Not warm. Blazing.

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
          text:         `The Dreaming Pull on the slope of Ashen Peak is quieter than it has been at any point in this campaign. Not gone — it is never gone, the Dreaming Place is permanent and real and necessary and will be there tonight as it has been every night. But something has changed in the ratio between its voice and everything else.

Chip knows what the Pull sounds like now. He knows the texture of its arguments, the specific comfort it offers, the exact quality of warmth it promises. He has heard it sixty mornings in a row. At some point, familiarity changes the equation — not by making the offer less real, but by making the source recognizable. The Pull is still the Pull. It is simply no longer a surprise.

One morning left.`,
        },
      ],


      missed: `The slope recorded a blank today. The ash here is patient — it will hold tomorrow's step when it comes.

The summit is still there.`,

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
      artifact_awarded:      'ash_mark',


      milestone: `Sixty mornings.

The Waking Fire is at the summit. The Emberstone, which has been sitting on a nightstand and going into a pack and coming back out every morning for sixty days, ends its campaign here.

The ash on the slope records the ascent. Every step. The ash of the high trail is mixed with the residue of the Waking Fire, and what the Waking Fire touches, it marks. Looking back down — sixty mornings of footprints, all the way to where the slope begins, all the way to where the road started, back through the Valley and the Forgetting and the Ridge and the Ashfields and the Sanctuary and the Pass and the Greywood and Thornwick and the Fogmere and the Amber Road and a house in Downers Grove where none of this was inevitable.

Will sent the ledger entry for day sixty. Below the timestamp, in the small precise hand: "Campaign complete. Sixty mornings. One road." A pause — longer than usual. Then a third line, smaller than the others: "I didn't think you'd make it past the Valley. I've been wrong about this since chapter three. For the record: I'm glad I was wrong." Nothing after that. For Will, admitting he was glad is the whole thing.

Brent's message arrived an hour later. It said: "I've been thinking about what to send for day sixty since about day thirty, which tells you something about where my head has been. Here's what I've got: I showed up skeptical and I'm leaving a believer. Not in the quest — in you. The quest was just the shape it took." A pause. Then: "Will wrote something nice too, right? In his way? Tell him I said good job translating."

Kevin's message came at a time that said something about what his morning had already required of him. It said: "I've watched a lot of people try to change something about themselves. Most of them pick the wrong thing to change. You picked the right thing." A pause. "My kids were still asleep when I sent this. First morning in a while. I stayed up to watch the sun come in. Thought of you."

{{decision_echo_1}}

{{decision_echo_2}}

{{decision_echo_3}}

The road back to Downers Grove looks different from up here.

Not because Downers Grove changed.

Because the person looking at it did.`,

      milestone_attribution: null,
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

// ── Decision echoes (day 60 milestone resolution) ─────────────────────────────

const DECISION_ECHOES = {
  c9: {
    c9_name:   `He named it when he saw it from the Ridge. Said it out loud or just thought it — the record doesn't say which. Ashen Peak. The stone burned steadier after that, like something had been waiting for the word.`,
    c9_silent: `He kept it a direction for as long as he could. Didn't name it when he saw it from the Ridge, just marked the bearing and kept moving. Some things are easier to walk toward before they have weight.`,
  },
  c10: {
    c10_open:  `The flask from the Forgetting is empty. He opened it on the bridge at the halfway point — the water tasted like nothing in particular, which turned out to be the most clarifying thing on the road. He crossed the second half knowing exactly what he was crossing for.`,
    c10_carry: `The flask from the Forgetting is still sealed. He carried it all the way here without opening it, which turned out to be its own answer — a record of a man who didn't need to remember because he hadn't forgotten.`,
  },
  c12: {
    c12_read:    `He read the full chronicle before the last morning. Sat with the whole road — every entry, the ones that cost something and the ones that didn't. The shape of it looked different from the outside than it felt from inside it. He went up afterward knowing what he'd done.`,
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
  renderText,
  // helpers still used by server.js / routes
  getChapter,
  isMilestoneDay,
  getQuestAdvance,
  appendToLog,
};