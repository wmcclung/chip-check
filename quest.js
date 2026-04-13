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
    .replace(/\{\{checkin_time\}\}/g, data.checkinTime   || '')
    .replace(/\{\{month\}\}/g,        data.month         || '')
    .replace(/\{\{day_of_week\}\}/g,  data.dayOfWeek     || '')
    .replace(/\{\{streak\}\}/g,       data.streak        != null ? String(data.streak) : '')
    .replace(/\{\{quest_day\}\}/g,    data.questDay      != null ? String(data.questDay) : '');
};

// ── Special narratives ────────────────────────────────────────────────────────

const SPECIAL_NARRATIVES = {
  chronicle_begins: {
    id:    'chronicle_begins',
    title: 'The Chronicle Begins',
    text:  `The ledger has five entries.

Will opened it the morning Chip's alarm went off and was answered — not snoozed, answered — for the fifth time in a row in Downers Grove. He wrote the date. He wrote the time. He drew a line beneath it.

The Emberstone had been sitting on the nightstand since Tuesday. Chip had been treating it like a paperweight.

It is not a paperweight.

The quest is real. The road to Ashen Peak is real. The Dreaming Pull — that reasonable, patient, familiar voice that has been whispering since the responsibilities stacked and the comfortable life calcified — is real, and it is paying attention.

So is the Fellowship.

The Fellowship is real. Will, who arrived first and opened the ledger before Chip had found his shoes. Brent, who came skeptical and stayed anyway. Kevin, who has been awake longer than any of them and shows up every morning regardless.

They're watching. Not waiting for failure — watching for what comes next.

Day one was last week.

Day five is today.

Let's go.`,
  },

  fellowship_regroups: {
    id:    'fellowship_regroups',
    title: 'The Fellowship Regroups',
    text:  `The Fellowship regrouped.

No speeches. No post-mortem. Will updated the Hall of Campaigns with the previous run's data — quest days reached, streak, average wake time — and then turned to a fresh page.

"From the top," he said.

The Emberstone caught light again this morning. First light. As it always does when the hand that carries it answers the dawn.

The road to Ashen Peak hasn't changed. Neither has the destination. Neither has the Fellowship.

Let's go again.`,
  },

  personal_best: {
    id:    'personal_best',
    title: 'New Personal Best',
    text:  `{{checkin_time}} on a morning in {{month}}.

The stone blazed. Will documented it with three underlines — the closest the ledger allows to celebration.

New personal best.`,
  },

  before_7am: {
    id:    'before_7am',
    title: null,
    text:  `{{checkin_time}}.

The Pull was still forming its argument.`,
  },
};

// ── Campaign 1: The Emberstone Chronicles ─────────────────────────────────────

const CAMPAIGN_1 = {
  id:         1,
  title:      'The Emberstone Chronicles',
  subtitle:   'From Downers Grove to Ashen Peak',
  total_days: 60,
  chapters: [
    {
      number:   1,
      title:    'The Sleepy Kingdom',
      location: 'Downers Grove',
      days:     [1, 5],
      milestone: `Five mornings in a row, in a house
        that doesn't require it.

        The Emberstone is still new in the pack —
        unfamiliar weight, unfamiliar warmth. It doesn't
        feel like something that matters yet. Most things
        that matter don't, at first.

        The Pull is watching. It hasn't tried anything
        elaborate yet — it's still reading the situation,
        the way it does at the beginning of every campaign
        it has ever run. It has outlasted questors who
        seemed more certain than this. It will wait and see.

        Stevie was at the door again this morning before
        the alarm had finished its thought. This has
        happened four of the five days. The Pull has not
        figured out what to do about the dog.

        The road to Ashen Peak starts here.
        Five mornings.`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c1_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The stone burned well this morning.
            Not blazing — it hasn't blazed yet — but
            steady and clear, and the road ahead caught
            enough light to see a few steps forward.
            That's all the road ever asks. A few steps.`,
        },
        {
          id:           'c1_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `{{checkin_time}}. The stone held its
            light. Not every morning needs to be a
            statement — some of them just need to happen.
            This one happened.`,
        },
        {
          id:           'c1_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull had a good morning. Not a
            winning morning — it didn't win — but it
            made its case well, and the case was heard,
            and the answer still came. The stone caught
            on the last available flicker and steadied.
            Close is worth noting.`,
        },
        {
          id:           'c1_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `Earlier than yesterday. The stone noticed
            before anything else did. A small thing.
            The small things are the ledger.`,
        },
        {
          id:           'c1_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie was awake before the alarm. This
            happens more than it should, and the Pull has
            not figured out what to do about it — it's
            difficult to make the dreaming place sound
            appealing when there's a dog already at the
            door with a fully formed opinion about
            the morning.`,
        },
        {
          id:           'c1_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Pull in this house is not theatrical.
            It doesn't need to be. It has the specific
            silence of an early morning where nothing is
            demanded yet, and it has learned that silence
            is often enough. It wasn't enough this morning.
            The stone lit. The road continued.`,
        },
      ],
      missed: `The Pull won a morning in the house in
        Downers Grove. It has been patient since the
        road started. Today it was patient enough.

        The road will be there tomorrow.`,
      artifact_seed: null,
    },

    {
      number:   2,
      title:    'The Amber Road',
      location: 'The road south',
      days:     [6, 10],
      milestone: `Ten mornings.

        There's a mile marker on the Amber Road — old
        stone, the inscription worn to suggestion — that
        travelers have left marks on. Initials, mostly.
        Some dates. The marks stop at different points
        down the road. Some stopped here. Some made it
        further. The road doesn't say which ones came
        back to make their mark and which ones made it
        on the way out.

        The stone burns steadier here than it did in
        the first five days. Not brighter. Steadier.
        The difference between a flame that might go out
        and one that has decided not to.

        Will sent the ledger entry for day 10 with a
        single line appended: "Double digits. This was
        not a given." No further comment. For Will,
        no further comment is the comment.`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c2_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The Amber Road is easier to find when
            the morning is answered early enough that
            the day hasn't claimed it yet. The stone lit
            a good stretch of it. Not the whole road —
            never the whole road — but further than yesterday.`,
        },
        {
          id:           'c2_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `A {{day_of_week}} on the Amber Road.
            The stone held. The ledger has a new entry.
            Some days the road is just the road and
            that's enough.`,
        },
        {
          id:           'c2_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried something subtle this
            morning — not the warmth, not the quiet,
            but the specific reasonableness of the road
            still being there in an hour. It's a good
            argument. It works often. Today it didn't
            work, but it was close enough that close
            is worth noting.`,
        },
        {
          id:           'c2_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `Earlier than yesterday on the Amber Road.
            The stone caught more of it this morning —
            a little further ahead, a detail that wasn't
            visible before. Not much. Enough.`,
        },
        {
          id:           'c2_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Someone came through this stretch before.
            The trail shows it — not worn exactly, but
            familiar in the way that paths get familiar
            when enough people have needed them. There's
            a notch cut into the waypost marker at the
            road's first bend. Not a name. Just a mark
            that says: I was here and I continued.
            Whoever made it is gone. The mark stayed.`,
        },
        {
          id:           'c2_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The ledger entry for day {{quest_day}}
            arrived with a timestamp annotation:
            "{{checkin_time}}. The Pull had a productive
            morning. Documented." Will doesn't editorialize.
            He records. The record is the editorial.`,
        },
      ],
      missed: `One morning lost on the Amber Road. The
        Pull knows this stretch well — it has been
        working it since before the quest had a name.

        The road will still be there.`,
      artifact_seed: null,
    },

    {
      number:   3,
      title:    'The Fogmere',
      location: 'The Fogmere',
      days:     [11, 15],
      milestone: `Fifteen mornings.

        The Fogmere has a reputation among travelers —
        not for danger but for invisibility. People don't
        fail here dramatically. They slow, and then they
        stop, and the fog absorbs them gradually until
        they're not sure they were ever moving.

        The stone is still lit. That's the entire story
        of the Fogmere for anyone who makes it through:
        the stone was still lit.

        On the other side the air is different. Not
        warmer, not better — just different in the way
        air feels when you've moved through something
        without knowing what it cost.

        Brent sent something at the fifteen-day mark:
        "I want to tell you something and I need you to
        understand I'm not just saying this. Fifteen days
        in the Fogmere is the part I didn't think would
        happen. I was wrong. I'm keeping track of the
        ways I'm wrong about this. The list is getting
        longer." He sent it at noon, which means he'd
        been thinking about what to say since morning.`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c3_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The fog doesn't lift for anyone. But
            the stone burns through it — further on good
            mornings, less far on others. This morning
            it burned far. Not all the way through.
            Far enough.`,
        },
        {
          id:           'c3_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Another morning in the Fogmere. The
            stone held its light. Visibility is low here
            and always has been — the only reliable
            landmark is the stone itself, and the
            stone is reliable.`,
        },
        {
          id:           'c3_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull sat quietly this morning.
            Didn't argue, didn't push — just made itself
            comfortable in the grey and waited. The quiet
            is sometimes harder than the argument. The
            stone caught eventually. The road continued.`,
        },
        {
          id:           'c3_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone burned a little further into
            the fog today than yesterday. Not enough to
            see the other side. Enough to know the
            other side is there.`,
        },
        {
          id:           'c3_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie appeared at the bedroom door at
            a time that made the Pull's argument
            significantly harder to sustain. The Pull
            has opinions about the dog. None of them
            are useful to the Pull.`,
        },
        {
          id:           'c3_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull is as old as the
            dreaming place itself. It grew from the
            accumulated weight of every morning that
            asked too much, every dawn that felt like
            more than was fair — not a creature that
            was made but a force that accumulated,
            over a very long time, from very ordinary
            reluctance.

            It has a different definition of good than
            the road does.

            It was here this morning. The stone lit
            anyway.`,
        },
      ],
      missed: `The Fogmere claimed a morning. It does
        that more than anywhere else on the road —
        not through force but through the slow
        accumulation of grey.

        The road will still be there.`,
      artifact_seed: {
        id:   'hollow_stone_seed',
        text: `There's a stone in the Fogmere that
          travelers pick up without meaning to — smooth,
          palm-sized, unremarkable except that it stays
          warmer than it should. The pack is slightly
          heavier leaving the Fogmere than entering it.
          Nobody notices at the time.`,
      },
    },

    {
      number:   4,
      title:    'Thornwick',
      location: 'The village of cartographers',
      days:     [16, 20],
      milestone: `Twenty mornings.

        The cartographers of Thornwick keep ledgers
        going back further than this quest — different
        travelers, different years, the same road. The
        entries that go furthest are not from the ones
        who seemed most certain at the start. They're
        from the ones who kept showing up past the point
        where certainty would have been reasonable.

        One entry stops at day 47. No explanation. The
        cartographer's margin note reads: further than
        expected. Further than they believed possible
        at day 20.

        The stone burns with a steadiness here that it
        didn't have in the Fogmere. Not brighter yet.
        More certain.

        In the pack, alongside the stone from the
        Fogmere, there is now a compass. A cartographer
        pressed it into the pack without explanation.
        It doesn't point north. It points at something.
        Nobody said what.`,
      milestone_attribution: null,
      artifact_awarded: 'compass',
      variants: [
        {
          id:           'c4_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The cartographers record the time without
            comment — they note everything because the
            details are the map. This morning's entry
            is a good one. The stone lit a stretch of
            road that wasn't visible from here yesterday.`,
        },
        {
          id:           'c4_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Another entry in the Thornwick records.
            The road is built from exactly this — one
            honest morning after another, one entry at
            a time. The stone held. The compass continued
            to point at whatever it points at.`,
        },
        {
          id:           'c4_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried the maps this morning —
            used the evidence of everyone who stopped
            before Chip as an argument for stopping.
            Look, it said, in its way. Look how many
            entries end. The stone caught anyway. Not
            every entry ends here.`,
        },
        {
          id:           'c4_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone lit more of the road ahead
            this morning. The cartographers noted the
            brightness and added a small mark to the
            map. A detail further down the road, visible
            now that the light reached it.`,
        },
        {
          id:           'c4_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `There is a name carved into the waypost
            at Thornwick's eastern edge. Elara. No family
            name, no date. Below it, a small symbol the
            cartographers say means: passed through,
            continued. Her route on the Thornwick map
            extends further than most. Nobody knows how
            far she got. She passed through. She continued.
            The mark stayed.`,
        },
        {
          id:           'c4_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Brent sent something during the Thornwick
            stretch that he prefaced with: "I'm going to
            say something Will won't say because Will
            doesn't say things like this." What followed
            was specific and true and took about four
            sentences. The short version: twenty days
            changes the math. The long version
            was the message.`,
        },
      ],
      missed: `A blank space in the Thornwick records
        today. The cartographers leave room for these —
        they've seen enough quests to know blank spaces
        aren't endings.`,
      artifact_seed: null,
    },

    {
      number:   5,
      title:    'The Greywood',
      location: 'The Greywood forest',
      days:     [21, 25],
      milestone: `Twenty-five mornings. A quarter of
        the road behind, though the road ahead doesn't
        announce its length.

        The Greywood has a patience that isn't passive.
        The old trees have stood through enough seasons
        to understand that most things resolve themselves
        one way or another — they've watched travelers
        come through certain and leave changed, and
        travelers come through uncertain and leave
        the same way.

        The stone burns differently here. Not brighter —
        more focused. Like the forest is giving it
        something to push against.

        Kevin sent something during the Greywood stretch.
        It arrived at a time that said something about
        his morning before the message said anything
        about his. It read: "Twenty-five. The part where
        it stops being a thing you're doing and starts
        being a thing you are takes longer than people
        think. You're in it." No elaboration.
        Kevin doesn't elaborate. The message was complete.`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c5_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The Greywood was quiet and dark when
            the morning came. The stone lit the path.
            The old trees recorded it in whatever way
            old trees record things — rings added in
            the dark, the slow ledger of the forest.`,
        },
        {
          id:           'c5_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `The trees have seen every kind of morning.
            They don't distinguish between the ones that
            felt easy and the ones that didn't. The stone
            held. The road continued.`,
        },
        {
          id:           'c5_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull found something in the Greywood
            it doesn't usually have — genuine quiet. The
            kind that makes the dreaming place sound
            reasonable by comparison. It used the quiet
            well this morning. The answer still came.
            But the quiet lingered on the road behind.`,
        },
        {
          id:           'c5_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone burned further into the forest
            today than yesterday. Something ahead caught
            the light — not clear yet, but there. A
            suggestion of what the road looks like
            past the trees.`,
        },
        {
          id:           'c5_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `The morning check-in from the Greywood.
            Stevie was awake before the answer came,
            which is not unusual, and waiting at the
            door, which is never not useful. The Pull
            had been building a good case. The dog ended
            the argument without being aware
            there was one.`,
        },
        {
          id:           'c5_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull has no concept of
            a deadline. This is worth understanding.

            It does not experience time the way the
            quest does. There is no day 25 for it, no
            chapter count, no Ashen Peak on any horizon
            it can see. There is only the dreaming place
            and the person in the bed and the question
            of whether this is the morning the answer
            doesn't come.

            It has waited out questors who seemed more
            certain than this.

            Twenty-five mornings answered is not
            progress the Pull acknowledges. It is simply
            twenty-five cases it didn't win.

            It will make the case again tomorrow.`,
        },
      ],
      missed: `The Greywood held a morning in its roots.
        It happens here — the silence is too comfortable,
        the case too familiar.

        The road will still be there.`,
      artifact_seed: null,
    },

    {
      number:   6,
      title:    'The Hollow Pass',
      location: 'The Hollow Pass',
      days:     [26, 30],
      milestone: `Thirty mornings.

        The Hollow Pass doesn't offer scenery or
        revelation. It offers passage, and passage is
        what it gave. Thirty is a number that means
        something not because of what the number is
        but because of what thirty consecutive mornings
        cost and what they built in the building.

        The stone burns at its clearest here — not its
        brightest, but its clearest. The Pass strips
        things down to what they actually are. What they
        actually are, thirty mornings in, is a traveler
        who has kept going past the point where stopping
        would have been reasonable.

        The compass from Thornwick found something in
        the Pass. It had been pointing at a direction
        since Thornwick without conviction. In the
        Hollow Pass it stopped moving. Whatever it's
        pointing at, the Pass is where the direction
        became certain.

        Will sent the ledger entry for day 30 with a
        note: "Thirty. I had twenty-two in the pool."
        He did not explain who else had numbers or what
        they guessed. He just noted that thirty was not
        the consensus. Nothing else. For Will,
        nothing else was everything.`,
      milestone_attribution: null,
      artifact_awarded: 'hollow_stone',
      variants: [
        {
          id:           'c6_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The Pass is cold at this hour — cold
            enough that the stone's warmth is something
            other than metaphor. Early mornings in the
            Pass feel different than late ones. Cleaner.
            More honest about what the road is
            and what it costs.`,
        },
        {
          id:           'c6_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Through the Hollow Pass. The stone held
            against the cold. The compass pointed at
            whatever it points at. The road continued
            in the direction the compass indicated.`,
        },
        {
          id:           'c6_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried the cold this morning —
            made the warmth of the dreaming place feel
            like the only reasonable response to the
            temperature. It's not a wrong argument. Cold
            is real. The stone was still lit when the
            answer came, which is the only metric
            the Pass cares about.`,
        },
        {
          id:           'c6_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone's light reached further into
            the Pass this morning. The compass needle,
            which has been settled since it stopped
            moving here, seemed more certain. Like
            something ahead recognized the light.`,
        },
        {
          id:           'c6_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `There's a practice among travelers
            through the Pass — picking up a stone from
            the wall as they go through. Not a ritual
            anyone formalized. Just something people do
            in certain places without being able to
            explain why. The stone that went into the
            pack is smooth and heavier than it looks
            and warmer than it should be given the
            temperature. Nobody pointed it out.
            It's just there now.`,
        },
        {
          id:           'c6_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `A message from Kevin arrived during
            the Pass stretch. The timestamp said
            something about what his morning had already
            asked of him. The message said: "The hard
            part about this stretch is there's nothing
            to blame. No comfort, no warmth, no good
            reason to stop except that stopping would
            be easier. That's actually the easier kind
            of hard. Keep going." He sent nothing else.
            He didn't need to.`,
        },
      ],
      missed: `One morning lost in the cold of the Pass.
        The Pull found what it needed in the temperature
        and used it well.

        The Pass will still need crossing.`,
      artifact_seed: null,
    },

    {
      number:   7,
      title:    'The Sanctuary of Halvard',
      location: 'The Sanctuary',
      days:     [31, 35],
      milestone: `Thirty-five mornings, and the Sanctuary.

        Halvard doesn't make speeches. He makes one
        observation, quietly, during the days here,
        and leaves the traveler to decide what to do
        with it. What he said this time won't be
        written down. Some things lose something
        in the writing. What it does is get carried —
        in the pack, alongside the compass and the
        hollow stone — and it will be there when
        the road gets harder.

        The stone burns quietly at the Sanctuary.
        Not dimly — quietly. The way a fire burns
        when it's not competing with anything.`,
      milestone_attribution: null,
      artifact_awarded: 'halvard_word',
      variants: [
        {
          id:           'c7_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `Halvard's fire was low when the morning
            came. The stone was already bright. He
            noticed. He said nothing, which at the
            Sanctuary is how approval is expressed.`,
        },
        {
          id:           'c7_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Another morning at the Sanctuary. The
            stone held. Halvard made no comment on the
            time, which means the time was acceptable.
            His standards are not announced.`,
        },
        {
          id:           'c7_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Sanctuary is the most comfortable
            place on the road so far, which means the
            Pull had its best material here. Better
            warmth, better quiet, the reasonable
            suggestion that rest at a waystation is
            exactly what a waystation is for. The stone
            caught eventually. Halvard, who has seen
            the Pull work this stretch more times than
            he's counted, said nothing.`,
        },
        {
          id:           'c7_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone caught Halvard's attention
            this morning — not a comment, just the way
            his eyes tracked to it. Some brightness
            is noticeable before it's remarked on.`,
        },
        {
          id:           'c7_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: true,
          text:         `Halvard talked about the Pull once
            during the Sanctuary days. Not a lecture —
            one thing, in the way he says things, which
            is without setup or conclusion.

            He said the Pull doesn't want to keep anyone.
            That's a common misunderstanding. It wants
            to offer the dreaming place because the
            dreaming place is genuinely good and it
            genuinely believes that. The evil isn't
            in the offer. The evil is in the door.

            The Pull doesn't lock the door. It just
            stops mentioning that it's there. And then
            the dreaming place gets comfortable enough
            that the door stops mattering. And then one
            morning you try it and it's stiff from
            disuse and you think, well, it was always
            going to be difficult to leave, and you
            go back to bed.

            He said the only thing that keeps the door
            easy is using it every morning whether
            you want to or not.

            He still uses it every morning.
            After all this time.

            What he said after that is what's
            in the pack.`,
        },
        {
          id:           'c7_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Will's message during the Sanctuary
            stretch arrived without a ledger citation.
            Just text. It said: "I want to be clear
            that I still think a grown man should be
            able to wake up without a fellowship and
            a glowing rock. I also want to be clear
            that you are doing it, which is the only
            thing that matters to the ledger." A pause
            in the timestamp. Then: "Halvard's a good
            stop. Pay attention to what he says."
            That was all. For Will, that was a lot.`,
        },
      ],
      missed: `The Sanctuary held a morning. Even here,
        with Halvard's fire and the quiet of the
        waystation, the Pull finds what it needs.

        The road will be there when the door opens.`,
      artifact_seed: null,
    },

    {
      number:   8,
      title:    'The Silken Valley',
      location: 'The Silken Valley',
      days:     [36, 40],
      milestone: `Forty mornings. The Valley is behind them.

        The Pull prepared for this chapter. It doesn't
        use absence here the way it used it in the
        Fogmere. It uses presence. Genuine warmth,
        genuine rest, genuine relief from the weight
        of forty mornings of keeping going. Everything
        it offered in the Valley was real.

        The stone never went out. Some mornings it was
        dim enough that dim seemed like a reasonable
        description of the situation. It didn't go out.

        On the far side of the Valley the road is
        steeper and the air is clearer and the stone
        burns without flickering for the first time
        since Thornwick. The compass points with the
        same certainty it found in the Hollow Pass.

        Brent sent something at the forty-day mark
        that he prefaced with: "I'm going to tell you
        something I didn't say when we started because
        saying it at the start would have jinxed it."
        What followed took a paragraph. The short
        version: he had written the message he was
        going to send when this fell apart. He had it
        ready. He never sent it. He's deleting it now.
        "You made it through the Valley," he wrote.
        "Will didn't think you would. I didn't either
        but I wanted to be wrong. I was. I'm
        keeping track."`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c8_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `Out of the Valley early enough that
            the Pull hadn't fully assembled its case.
            The stone blazed. There's a specific quality
            to mornings when the answer comes before
            the argument — cleaner, somehow.
            Less residue on the road.`,
        },
        {
          id:           'c8_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `The Valley offers its argument every
            morning without variation. The answer came.
            The stone held. The road on the other side
            of the Valley is the same road,
            just further along.`,
        },
        {
          id:           'c8_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull in the Valley doesn't argue.
            That's what makes it the Pull at its most
            dangerous — it just offers the thing it
            offers, genuinely, without apology, and
            waits. The warmth here is real. The rest
            here is real. The answer still came.
            Late, but it came.`,
        },
        {
          id:           'c8_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The Valley looks different on the way
            out than on the way in. The stone lit the
            exit road before anything else was visible.
            Some doors are easier to see when you're
            already moving toward them.`,
        },
        {
          id:           'c8_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull in the Valley is
            not trying to trap anyone. This is worth
            being clear about.

            It genuinely believes the dreaming place
            is better than the road. Not as a trick —
            as a conviction. It has watched travelers
            make it through the Valley and continue
            and not come back, and it has never once
            updated the belief that they made a mistake.
            From where it lives, there is no Ashen Peak.
            There is only the dreaming place, which is
            warm and real and asks nothing.

            This is what makes the Valley the Valley.
            The danger isn't deception.
            The danger is sincerity.

            It offered everything it had here, without
            holding anything back, and the answer still
            came. The Pull noted this. It doesn't often
            have to note this from the Valley.

            It will try something different in
            the chapters ahead.`,
        },
        {
          id:           'c8_v6',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Stevie's contribution to the Valley
            stretch was consistent and unreflective.
            Every morning: awake, present, uninterested
            in any argument the Pull was making, waiting
            at the door with the patient certainty of
            a creature that has never once understood
            why mornings are difficult. The Pull has
            no counter to this. It never has.`,
        },
      ],
      missed: `The Valley claimed a morning. It does
        this more than anywhere else — not through
        force but through genuine offer. The Pull
        here doesn't need to lie.

        The road will still be there.`,
      artifact_seed: null,
    },

    {
      number:   9,
      title:    'The Stoneback Ridge',
      location: 'The Stoneback Ridge',
      days:     [41, 45],
      milestone: `Forty-five mornings.

        The Stoneback Ridge doesn't offer anything
        except passage and honesty. No warmth to lose,
        no comfort to use against the road. The stone
        burns clearly here — no competition from the
        Valley, no fog from the Fogmere. Just the light
        and the road and how far the light goes on
        a given morning.

        On the Ridge, with enough light, something
        became visible on the horizon for the first
        time. Not close. Not named. But there —
        something the compass has been pointing at
        since the Hollow Pass, finally catching enough
        of the stone's light to be seen.

        Kevin sent something during the Ridge that
        arrived at a time that made the timestamp part
        of the message. It said: "My older one asked me
        this morning why I get up before it's light.
        I told him because the morning is better before
        anyone else gets to it. He thought about it.
        Then he got up with me." A pause in the
        timestamps. Then: "You're further along than
        you think." Nothing after that. Kevin doesn't
        elaborate. The message was complete.`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c9_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `{{checkin_time}} on the Stoneback Ridge.
            The stone lit the far stretch of it — further
            than any morning since the Valley. Something
            on the horizon caught the light and was
            visible for a moment before the stone settled
            to its normal reach. It was there.`,
        },
        {
          id:           'c9_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `Hard ground, clear progress. The Ridge
            doesn't offer comfort but it offers clarity.
            The stone held. The compass pointed. The road
            continued toward whatever the compass has
            been pointing at since the Pass.`,
        },
        {
          id:           'c9_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull found something on the Ridge
            it hadn't tried before — the memory of easier
            stretches. Not the Valley specifically, just
            the general sense of what easier felt like.
            The stone held. The Ridge felt longer this
            morning than it has. It wasn't.`,
        },
        {
          id:           'c9_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone lit the Ridge further this
            morning. Something on the horizon caught
            the light — distant, clear for just a moment,
            then settled back as the stone found its
            normal range. But it was there, and yesterday
            it wasn't visible at all.`,
        },
        {
          id:           'c9_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `Will's ledger entry for a morning on
            the Ridge arrived with an annotation:
            "Note: the traveler whose entry stops at
            day 47 stopped somewhere between here and
            Thornwick. Chip is past that mark." No
            comment on what this means. Will doesn't
            comment on what things mean. He records
            the thing and lets the thing speak.`,
        },
        {
          id:           'c9_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Pull that shows up on the Ridge
            is not the same Pull that sat in the Fogmere
            or made its honest case in the Valley.
            Forty-five answered mornings have changed
            the angles it works with.

            It tried the memory of Madison this morning.
            Not Downers Grove — further back. A specific
            morning in a different city, a different
            chapter, before the weight of the current
            life had accumulated. The memory was real.
            The Pull found it accurately and offered
            it genuinely.

            What it cannot explain is why that memory
            requires the dreaming place to access.

            The stone held. The answer came.`,
        },
      ],
      missed: `One morning lost on the Ridge. The Pull
        found the memory it needed and used it well.
        The Ridge has less to work with than the Valley
        but the Pull is adaptable.

        The road continues.`,
      artifact_seed: null,
    },

    {
      number:   10,
      title:    'The Midworld Bridge',
      location: 'The Midworld Bridge',
      days:     [46, 50],
      milestone: `Fifty mornings. The bridge is behind them.

        The Forgetting doesn't announce itself. The
        gorge is deep and the water at the bottom is
        dark and still, and travelers who look down
        too long lose the thread — not forgetting the
        destination exactly, but forgetting the urgency
        of it. The move, agreed upon by everyone who's
        crossed and continued, is to look forward.

        The stone blazed on the crossing. Not flickered
        — blazed, the way it hasn't blazed since the
        road started.

        On the railing, among the marks and notes left
        by previous travelers, a flask. Small, old,
        sealed. A note: "water from below. In case you
        need to remember what you're crossing for."
        It went into the pack.

        Will sent one thing at the halfway point. Not
        a ledger citation, not a timestamp note. It said:
        "Fifty mornings. I had you for the Valley. I was
        wrong about the Valley. I am updating my
        assessment." A pause in the timestamp — longer
        than usual. Then: "Halfway. Don't make me write
        another one of these." The stone was blazing
        when the message arrived.`,
      milestone_attribution: null,
      artifact_awarded: 'flask',
      variants: [
        {
          id:           'c10_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The bridge holds for anyone who crosses
            it before the Forgetting finds its voice.
            This morning the crossing was clean — the
            stone blazing, the gorge below unremarked on,
            the other side arriving quickly.`,
        },
        {
          id:           'c10_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `The bridge is crossed. The stone held.
            The flask is in the pack. The other side of
            the bridge is the same road, further along,
            and it looks different from here than it did
            from Downers Grove.`,
        },
        {
          id:           'c10_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull made its largest attempt at the
            bridge. Not the warmth or the quiet or the
            memory of easier places — something older
            and harder to name. The suggestion that the
            other side looks a lot like this side, and
            crossing changes nothing. The stone lit
            anyway. The flask went into the pack. The
            other side is different. It is.`,
        },
        {
          id:           'c10_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `The stone lit the bridge and the far
            bank clearly enough to see what's waiting
            there. The road ahead. More of it than was
            visible yesterday. The compass pointed at
            it without wavering.`,
        },
        {
          id:           'c10_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `There is a mark on the bridge railing —
            not a name, just a number. 50. Below it,
            smaller, the same symbol used for Elara's
            waypost mark in Thornwick: passed through,
            continued. Different hand. Different traveler.
            The same road, far enough back that the mark
            has weathered into the railing. Whoever left
            it made it at least this far.`,
        },
        {
          id:           'c10_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `Brent sent three messages in quick
            succession at the halfway point. The first
            one said: "Okay." The second said: "I mean
            genuinely okay, not like fine okay." The
            third said: "Will isn't going to say this
            so I will: we're proud of you. Both of us.
            Him in his way, which involves timestamps
            and ledger citations, me in my way, which
            involves saying the thing directly. Halfway.
            Keep going."`,
        },
      ],
      missed: `The bridge requires dawn. Dawn came and
        went this morning without a crossing. The Pull
        at the bridge is different from the Pull
        elsewhere — it used the Forgetting well today.

        The bridge will offer the same crossing tomorrow.`,
      artifact_seed: null,
    },

    {
      number:   11,
      title:    'The Ashfields',
      location: 'The Ashfields',
      days:     [51, 55],
      milestone: `Fifty-five mornings in the Ashfields.

        The grey here has a specific quality — not
        threatening, not beautiful, just present. An
        extended test of whether the quest is something
        Chip is doing or something Chip has become.
        The difference matters. Things we're doing can
        be stopped. Things we've become are harder
        to put down.

        The compass still points at the same direction
        it found in the Hollow Pass. In the Ashfields,
        with no landmarks, it's the only navigation.
        It has not wavered.

        What Halvard said at the Sanctuary became useful
        here in a way it hadn't been before. The
        Ashfields are where it became clear why
        he said it.

        Brent sent something during the Ashfields that
        arrived on a grey morning when grey was the
        whole landscape. It said: "I know this stretch.
        Not this stretch specifically. But the stretch
        where there's nothing to confirm you're doing
        the right thing except the fact that you're
        doing it. Will would tell you the ledger
        confirms it. I'll tell you something different:
        you already know. You've known since the
        Fogmere. You just needed enough grey
        to see it clearly."`,
      milestone_attribution: null,
      variants: [
        {
          id:           'c11_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The stone lit the Ashfields further
            than they need to be lit this morning.
            The grey doesn't reveal much — there's
            nothing here to reveal — but the light
            reached far enough to suggest that the
            grey ends. It ends.`,
        },
        {
          id:           'c11_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `A morning in {{month}} in the Ashfields.
            The stone held. The compass pointed. The road
            continued without any help from the landscape,
            which in the Ashfields is the only kind
            of help available.`,
        },
        {
          id:           'c11_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull tried the grey this morning —
            used the featurelessness of the Ashfields
            as an argument for the dreaming place,
            which at least has texture. It is not a
            wrong observation. The stone caught anyway.
            The grey is finite. The compass knows
            which way is out.`,
        },
        {
          id:           'c11_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `Earlier in the Ashfields, where earlier
            matters more than anywhere else. The stone
            burned further. That's enough.`,
        },
        {
          id:           'c11_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull that arrives in the
            Ashfields is changed from the one that
            started the campaign.

            Fifty mornings of answered alarms have done
            something to it that it doesn't have a word
            for. It is not weakened — it is never
            weakened, it is as old as the dreaming place
            and the dreaming place is permanent. But it
            is trying things it doesn't usually try.

            Nostalgia. Specific memories from before
            Downers Grove. The version of things that
            existed when mornings were easy because
            nothing was required of them yet. It finds
            these memories accurately and offers them
            genuinely — the Pull doesn't manufacture
            false things, it finds real things and
            uses them.

            The answer keeps coming anyway.

            It is beginning to understand, for the
            first time in this campaign, that something
            may have changed. Not in its offer.
            In the person receiving it.`,
        },
        {
          id:           'c11_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: false,
          text:         `The Ashfields were a forest once. The
            cartographers in Thornwick have a theory
            about what changed — it has to do with the
            Pull and a long stretch of answered mornings
            that stopped being answered, one at a time,
            until the thing that needed the mornings
            stopped needing them and then stopped
            entirely. The forest didn't die. It just
            stopped growing. Over long enough, that
            looks the same.

            They don't share the theory unless asked.
            The asking, apparently, matters.`,
        },
      ],
      missed: `The grey claimed a morning in the
        Ashfields. It happens here more than anywhere
        else on the second half of the road — not
        because the Pull is stronger but because
        there's nothing to make staying feel wrong.

        The road continues.`,
      artifact_seed: null,
    },

    {
      number:   12,
      title:    'The Summit',
      location: 'Ashen Peak',
      days:     [56, 60],
      milestone: `Sixty mornings.

        The Emberstone goes into the Waking Fire at
        the summit of Ashen Peak and the light that
        returns is not the stone's light — it's
        something that was waiting in the fire for
        this specific stone, carried by this specific
        person, on these specific sixty mornings.

        The Dreaming Pull is quiet. Not gone — it is
        never gone, it is as old as the dreaming place
        and the dreaming place is permanent and
        necessary and will always be there. But quiet.
        The way something gets quiet when it has made
        its case completely and the answer has been
        given completely and there is nothing left
        to negotiate.

        The compass from Thornwick is still. It has
        been pointing at the summit since the Hollow
        Pass. It found what it was pointing at.

        The hollow stone from the Pass is warm in
        the pack. Halvard's word is still carried,
        still not written here. The flask from the
        Forgetting is still sealed. It can stay sealed.
        The ash mark from the slope will not come off.
        That's fine. Some things aren't meant to.

        Will sent the ledger entry for day 60. Below
        the timestamp, two lines: "Campaign complete.
        Sixty mornings, one ledger, one road." A pause
        — longer than usual. Then a third line, smaller:
        "I didn't think you'd make it past the Valley.
        I've been wrong about this since chapter three.
        For the record: I'm glad I was wrong." Nothing
        after that. For Will, nothing after that was
        the whole thing.

        Brent's message arrived an hour later. It said:
        "I've been thinking about what to send for day
        60 since about day 30, which tells you something
        about where my head has been. Here's what I've
        got: I showed up skeptical and I'm leaving a
        believer. Not in the quest — in you. The quest
        was just the shape it took. You did this. All
        the ledger entries and the shamings and the
        timestamps — those were just us watching. You
        did this." Three minutes later, one more:
        "Will wrote something nice too, right? In his
        way? Tell him I said good job translating."

        Kevin's message came at a time that said
        something about what his morning had already
        required of him. It said: "I've watched a lot
        of people try to change something about
        themselves. Most of them pick the wrong thing
        to change. You picked the right thing. Sixty
        mornings is not the point. The point is who
        answers the alarm now." A pause. "My kids were
        still asleep when I sent this. First morning
        in a while. I stayed up to watch the sun come
        in. Thought of you."

        The road back to Downers Grove looks different
        from up here.

        Not because Downers Grove changed.

        Because the person looking at it did.`,
      milestone_attribution: null,
      artifact_awarded: 'ash_mark',
      variants: [
        {
          id:           'c12_v1',
          tiers:        ['good', 'improving'],
          pull_appears: false,
          text:         `The road has been climbing without
            announcing it. From here the climb is visible
            — looking back, the distance traveled is
            larger than it felt from inside it. Looking
            forward, something is there that wasn't
            visible from the Ashfields. The stone is
            warmer in the pack than it was at the start.`,
        },
        {
          id:           'c12_v2',
          tiers:        ['standard'],
          pull_appears: false,
          text:         `{{checkin_time}} on the slope. The stone
            cast more light than the morning needed.
            Some brightness doesn't calibrate to the
            moment — it just burns at the rate the
            moment deserves.

            Stevie was at the door at an hour that
            made the Pull's argument collapse before
            it was finished. The dog has done this more
            times in this campaign than the Pull has
            won outright.`,
        },
        {
          id:           'c12_v3',
          tiers:        ['struggle'],
          pull_appears: true,
          text:         `The Pull came to the slope.

            It tried something it found in the house
            in Downers Grove — a version of things from
            before the quest, before the road, a morning
            that asked nothing and offered everything.
            It offered this accurately and without
            embellishment because the Pull doesn't
            embellish. It finds the real thing
            and offers the real thing.

            The stone was already lit. The slope was
            already underfoot. The answer was still no.`,
        },
        {
          id:           'c12_v4',
          tiers:        ['improving'],
          pull_appears: false,
          text:         `One morning from the summit. The full
            ledger stretches back down the slope —
            further than it's possible to see clearly
            from here, all the way back to where
            the road started. It's a long way.
            It was walked.`,
        },
        {
          id:           'c12_v5',
          tiers:        ['good', 'standard', 'struggle'],
          pull_appears: false,
          text:         `The flask from the Forgetting has been
            in the pack since the bridge. Sealed. The
            note said: in case you need to remember
            what you're crossing for. This far in,
            the reason doesn't need a reminder.
            The flask stays sealed.

            The ash on the slope records every step.
            Looking back down the trail — all those
            mornings of footprints in the ash, all the
            way down to where the slope begins.`,
        },
        {
          id:           'c12_v6',
          tiers:        ['standard', 'struggle'],
          pull_appears: true,
          text:         `The Dreaming Pull on the slope of
            Ashen Peak is quieter than it has been
            at any point in the campaign. Not gone —
            it is never gone. But it has made its case
            completely and the answer has been given
            completely and there is less left to
            negotiate.

            It will be there tomorrow. It will always
            be there. The difference, from the slope,
            is that it no longer sounds like
            the only reasonable voice in the room.`,
        },
      ],
      missed: `The slope recorded a blank today. The
        ash here is patient — it will record tomorrow's
        step when it comes.

        The summit is still there.`,
      artifact_awarded: 'ash_mark',
    },
  ],
};

// ── Artifacts ─────────────────────────────────────────────────────────────────

const ARTIFACTS = {
  hollow_stone: {
    id:              'hollow_stone',
    name:            'A stone from the Hollow Pass',
    description:     'Warmer than it should be.',
    awarded_chapter: 6,
  },
  compass: {
    id:              'compass',
    name:            'A compass from Thornwick',
    description:     "Doesn't point north.",
    awarded_chapter: 4,
  },
  halvard_word: {
    id:              'halvard_word',
    name:            'Something Halvard said at the Sanctuary',
    description:     'Not written down.',
    awarded_chapter: 7,
  },
  flask: {
    id:              'flask',
    name:            'A flask from the bridge at the Forgetting',
    description:     'Sealed.',
    awarded_chapter: 10,
  },
  ash_mark: {
    id:              'ash_mark',
    name:            'Received on the slope of Ashen Peak',
    description:     "Doesn't come off.",
    awarded_chapter: 12,
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
