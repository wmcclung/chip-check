const successQuotes = [
  // Gandalf
  { text: "All we have to decide is what to do with the time that is given us.", speaker: "Gandalf" },
  { text: "End? No, the journey doesn't end here. Death is just another path — one that we all must take.", speaker: "Gandalf" },
  { text: "The world is not in your books and maps; it's out there.", speaker: "Gandalf" },
  { text: "A wizard is never late, nor is he early. He arrives precisely when he means to.", speaker: "Gandalf" },
  { text: "Do not be too eager to deal out death in judgment. Even the very wise cannot see all ends.", speaker: "Gandalf" },
  { text: "I am a servant of the Secret Fire, wielder of the flame of Anor. The dark fire will not avail you.", speaker: "Gandalf" },
  { text: "Courage is found in unlikely places.", speaker: "Gandalf" },

  // Samwise
  { text: "There is some good in this world, and it's worth fighting for.", speaker: "Samwise Gamgee" },
  { text: "Even darkness must pass. A new day will come, and when the sun shines it will shine out the clearer.", speaker: "Samwise Gamgee" },
  { text: "Folk in those stories had lots of chances of turning back, only they didn't. Because they were holding on to something.", speaker: "Samwise Gamgee" },
  { text: "It's like in the great stories, Mr. Frodo. The ones that really mattered, full of darkness and danger they were — and sometimes you didn't want to know the end.", speaker: "Samwise Gamgee" },
  { text: "Don't you lose him, Samwise Gamgee.", speaker: "Samwise Gamgee" },
  { text: "Share the load.", speaker: "Samwise Gamgee" },

  // Frodo
  { text: "I will take the Ring, though I do not know the way.", speaker: "Frodo Baggins" },
  { text: "I am glad you are here with me. Here at the end of all things.", speaker: "Frodo Baggins" },
  { text: "I know what I must do. It's just... I'm afraid to do it.", speaker: "Frodo Baggins" },
  { text: "Go back, Sam. I'm going to Mordor alone.", speaker: "Frodo Baggins" },

  // Aragorn
  { text: "A day may come when the courage of men fails, when we forsake our friends and break all bonds of fellowship — but it is not this day.", speaker: "Aragorn" },
  { text: "There is always hope.", speaker: "Aragorn" },
  { text: "Hold your ground! Hold your ground! Sons of Gondor, of Rohan — my brothers!", speaker: "Aragorn" },
  { text: "Not all those who wander are lost.", speaker: "Tolkien" },

  // Galadriel
  { text: "This task was appointed to you, and if you do not find a way, no one will.", speaker: "Galadriel" },
  { text: "May it be a light to you in dark places, when all other lights go out.", speaker: "Galadriel" },
  { text: "The quest stands upon the edge of a knife. Stray but a little, and it will fail, to the ruin of all.", speaker: "Galadriel" },

  // Éowyn
  { text: "I am no man.", speaker: "Éowyn" },
  { text: "The women of this country learned long ago — those without swords can still die upon them.", speaker: "Éowyn" },

  // Théoden
  { text: "Arise, arise, Riders of Théoden! Fell deeds awake! Fear no darkness!", speaker: "Théoden" },
  { text: "Ride now! Ride now! Ride! Ride to ruin and the world's ending! Death!", speaker: "Théoden" },
  { text: "Where now the horse and the rider? Where is the horn that was blowing?", speaker: "Théoden" },

  // Gimli
  { text: "Certainty of death. Small chance of success. What are we waiting for?", speaker: "Gimli" },
  { text: "Nobody tosses a Dwarf.", speaker: "Gimli" },
  { text: "I never thought I'd die fighting side by side with an Elf.", speaker: "Gimli" },

  // Legolas
  { text: "You have my bow.", speaker: "Legolas" },
  { text: "That still only counts as one!", speaker: "Legolas" },

  // Treebeard
  { text: "We have come to it at last — the great battle of our time.", speaker: "Treebeard" },
  { text: "We Ents do not like being roused — but we never are roused unless it is clear our trees and our lives are in danger.", speaker: "Treebeard" },

  // Elrond
  { text: "Nine companions. So be it. You shall be the Fellowship of the Ring.", speaker: "Elrond" },
  { text: "This is the hour of the Shire-folk, when they arise from their quiet fields to shake the towers and counsels of the Great.", speaker: "Elrond" },

  // Pippin & Merry
  { text: "I didn't think it would end this way.", speaker: "Pippin" },
  { text: "You can trust us to stick with you through thick and thin — to the bitter end.", speaker: "Merry" },
  { text: "What about second breakfast?", speaker: "Pippin" },

  // Faramir
  { text: "War must be, while we defend our lives against a destroyer who would devour all; but I do not love the bright sword for its sharpness.", speaker: "Faramir" },

  // Bilbo
  { text: "I'm going on an adventure!", speaker: "Bilbo Baggins" },
  { text: "The greatest adventure is what lies ahead. Today and tomorrow are yet to be said.", speaker: "Bilbo Baggins" },
  { text: "There is nothing like looking, if you want to find something.", speaker: "Bilbo Baggins" },

  // Tom Bombadil
  { text: "Old Tom Bombadil is a merry fellow! Bright blue his jacket is, and his boots are yellow!", speaker: "Tom Bombadil" },
  { text: "None has ever caught old Tom walking in the forest, wading in the water, leaping on the hill-tops under light and shadow.", speaker: "Tom Bombadil" },
];

const failureQuotes = [
  // Gollum
  { text: "My precious... and we missed it. We weren't careful enough, were we, precious?", speaker: "Gollum" },
  { text: "What has it got in its pocketses? Nothing. Not even a check-in.", speaker: "Gollum" },
  { text: "We hates it. We hates the morning, precious. We hates alarm clocks forever.", speaker: "Gollum" },
  { text: "Sneaky little hobbitses. They fell back asleep. And we let them.", speaker: "Gollum" },
  { text: "Lost! And alone and withered! But tomorrow... tomorrow we tries again, precious.", speaker: "Gollum" },

  // Saruman
  { text: "You did not seriously think that snoozing could defeat the Dark Power of the morning, did you?", speaker: "Saruman" },
  { text: "The age of accountability is over. The time of the snooze button has come.", speaker: "Saruman" },
  { text: "I gave you the chance of aiding me willingly, but you have elected the way of — failure.", speaker: "Saruman" },
  { text: "Against the will of the morning, there can be no victory. But perhaps tomorrow tests your resolve.", speaker: "Saruman" },

  // Denethor
  { text: "This city has fallen. Go back to your bed and your oblivion.", speaker: "Denethor" },
  { text: "Hope is an illusion, and so was your commitment to waking. The board is set against you.", speaker: "Denethor" },
  { text: "I will not bow to this accountability. And today — I was right not to.", speaker: "Denethor" },
  { text: "Peregrin Took — I thought you had more fire in you. It seems I was wrong.", speaker: "Denethor" },

  // Boromir
  { text: "One does not simply walk into Mordor. One does not simply wake up on time, either.", speaker: "Boromir" },
  { text: "Is there not here some earnest of good faith? One morning! Is that too much to ask?", speaker: "Boromir" },
  { text: "It is not this day. It was not today. Perhaps it will be tomorrow.", speaker: "Boromir" },
  { text: "I would have followed you, my brother. I would have gone with you — to the alarm clock's end.", speaker: "Boromir" },

  // Sauron-flavor
  { text: "Three alarms for the sleepy-kings under the sky. One alarm to rule them all — and in the darkness, silence it.", speaker: "The Dark Lord" },
  { text: "I see you. Your streak is zero. Your shame is recorded in the Eye.", speaker: "Sauron" },
  { text: "There is no life in the void. Only... snooze.", speaker: "Sauron" },

  // Shelob-flavor
  { text: "In her lair there is no light, no warmth, no mercy — and no morning routine.", speaker: "Narrator" },
  { text: "Something lurks in the dark before dawn. And today, it won.", speaker: "Narrator" },

  // Dark humor
  { text: "They're taking the hobbits to Isengard! Which is where your streak went.", speaker: "Legolas (adapted)" },
  { text: "The Ring was unmade. Your streak was, too. At least one was intentional.", speaker: "Narrator" },
  { text: "You cannot pass. The dark fire will not avail you — and neither did your alarm.", speaker: "The Balrog" },
  { text: "Fly, you fools! Fly — back to your bed, apparently.", speaker: "Gandalf (adapted)" },

  // Redemption-framed
  { text: "Even darkness must pass. A new day will come, and when the sun shines it will shine out the clearer. That day is tomorrow.", speaker: "Samwise Gamgee" },
  { text: "Not all those who wander are lost — but you lost today. The road goes ever on. Take the next step tomorrow.", speaker: "Tolkien (adapted)" },
  { text: "All we have to decide is what to do with the time that is given us. Tomorrow, decide to rise.", speaker: "Gandalf" },
  { text: "The greatest glory is not in never falling, but in rising every time. The sun will return.", speaker: "Gandalf" },
];

// ── Milestone definitions ─────────────────────────────────────────────────────
// Each entry: { text, speaker, badge, cssClass, bigMoment?, bigCelebration? }

const milestones = {
  5: {
    text: "Even the smallest person can change the course of the future.",
    speaker: "Galadriel",
    badge: "First Fellowship Week 🌱",
    cssClass: "milestone-green",
  },
  10: {
    text: "It's a dangerous business, Frodo, going out your door. You step onto the road, and if you don't keep your feet, there's no knowing where you might be swept off to.",
    speaker: "Bilbo Baggins",
    badge: "Ten Doors Opened 🚪",
    cssClass: "milestone-copper",
  },
  15: {
    text: "Faithless is he that says farewell when the road darkens.",
    speaker: "Gimli",
    badge: "Unwavering 🪨",
    cssClass: "milestone-stone",
  },
  20: {
    text: "The board is set. The pieces are moving. We come to it at last.",
    speaker: "Gandalf",
    badge: "Three Weeks Strong ⚡",
    cssClass: "milestone-white",
  },
  25: {
    text: "There is some good in this world, and it's worth fighting for.",
    speaker: "Samwise Gamgee",
    badge: "A Quarter Century 🌻",
    cssClass: "milestone-gold",
  },
  30: {
    text: "YOU SHALL NOT PASS!",
    speaker: "Gandalf",
    badge: "One Month. The Bridge Held. 🔥",
    cssClass: "milestone-fire",
    bigMoment: true,
  },
  40: {
    text: "I would rather share one lifetime with you than face all the ages of this world alone.",
    speaker: "Arwen",
    badge: "Forty Days of Dawn 🌅",
    cssClass: "milestone-dawn",
  },
  50: {
    text: "I can't carry it for you, but I can carry you.",
    speaker: "Samwise Gamgee",
    badge: "Halfway to Mordor 💍",
    cssClass: "milestone-ring",
  },
  75: {
    text: "All we have to decide is what to do with the time that is given us.",
    speaker: "Gandalf",
    badge: "75 Mornings Decided ⏳",
    cssClass: "milestone-silver",
  },
  100: {
    text: "One does not simply walk into Mordor... but you walked out of bed 100 times. The Ring is destroyed. You have won.",
    speaker: "The Legend",
    badge: "THE RING IS DESTROYED 👑",
    cssClass: "milestone-legendary",
    bigCelebration: true,
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

function getMilestone(streak) {
  if (milestones[streak]) return milestones[streak];
  // Recycled milestones past 100: every 25 days uses the 100-day entry
  if (streak > 100 && streak % 25 === 0) {
    return {
      ...milestones[100],
      badge: `THE RING IS DESTROYED (×${Math.floor(streak / 100)}) 👑`,
    };
  }
  return null;
}

function getSuccessQuote(streak) {
  const m = getMilestone(streak);
  if (m) return { text: m.text, speaker: m.speaker };
  return successQuotes[Math.floor(Math.random() * successQuotes.length)];
}

function getFailureQuote() {
  return failureQuotes[Math.floor(Math.random() * failureQuotes.length)];
}

// ── Time-based milestone definitions ─────────────────────────────────────────
// key, threshold (minutes since midnight), and quote shown on unlock.
// Evaluated once per check-in; stored permanently in time_milestones DB table.

const timeMilestones = [
  {
    key:       'before_830',
    label:     'First check-in before 8:30 AM',
    threshold: 510,
    text:      'The road goes ever on and on, down from the door where it began.',
    speaker:   'Bilbo Baggins',
    badge:     '🌅 Up Before 8:30',
  },
  {
    key:       'before_800',
    label:     'First check-in before 8:00 AM',
    threshold: 480,
    text:      'All we have to decide is what to do with the time that is given us.',
    speaker:   'Gandalf',
    badge:     '⏰ Up Before 8:00',
  },
  {
    key:       'before_730',
    label:     'First check-in before 7:30 AM',
    threshold: 450,
    text:      'Even the smallest person can change the course of the future.',
    speaker:   'Galadriel',
    badge:     '🌄 Up Before 7:30',
  },
  {
    key:       'before_700',
    label:     'First check-in before 7:00 AM',
    threshold: 420,
    text:      'YOU SHALL NOT PASS! ...into the realm of the sleeping.',
    speaker:   'Gandalf (probably)',
    badge:     '🔥 Up Before 7:00',
  },
  {
    key:       'personal_best',
    label:     'Personal best beaten',
    threshold: null, // evaluated dynamically
    text:      'The world is changed. I feel it in the water, I feel it in the earth, I smell it in the air.',
    speaker:   'Galadriel',
    badge:     '🏆 New Personal Best',
  },
  {
    key:       'avg_7day_800',
    label:     '7-day average before 8:00 AM',
    threshold: 480, // avg threshold
    text:      "A day may come when you sleep in, when you forsake the morning — but it is not this day.",
    speaker:   'Aragorn',
    badge:     '📈 7-Day Avg Before 8:00',
  },
];

module.exports = { getSuccessQuote, getFailureQuote, getMilestone, milestones, timeMilestones };
