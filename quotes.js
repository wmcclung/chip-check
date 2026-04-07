const successQuotes = [
  { text: "Even the smallest person can change the course of the future.", speaker: "Galadriel" },
  { text: "There is some good in this world, and it's worth fighting for.", speaker: "Samwise Gamgee" },
  { text: "I would rather share one lifetime with you than face all the ages of this world alone.", speaker: "Arwen" },
  { text: "It's a dangerous business, Frodo, going out your door. You step onto the road, and if you don't keep your feet, there's no knowing where you might be swept off to.", speaker: "Bilbo Baggins" },
  { text: "You shall not pass!", speaker: "Gandalf" },
  { text: "All we have to decide is what to do with the time that is given us.", speaker: "Gandalf" },
  { text: "The world is not in your books and maps; it's out there.", speaker: "Gandalf" },
  { text: "Courage is found in unlikely places.", speaker: "Gildor" },
  { text: "I am no man.", speaker: "Éowyn" },
  { text: "End? No, the journey doesn't end here.", speaker: "Gandalf" },
];

const failureQuotes = [
  { text: "So it is that darkness claims its newest servant.", speaker: "Gandalf" },
  { text: "The ring has awoken. It's heard its master's call.", speaker: "Gandalf" },
  { text: "What has it got in its pocketses?", speaker: "Gollum" },
  { text: "Hope is not in your nature today.", speaker: "Denethor" },
  { text: "They're taking the hobbits to Isengard!", speaker: "Legolas" },
  { text: "One does not simply wake up on time.", speaker: "Boromir" },
  { text: "Even darkness must pass. A new day will come.", speaker: "Samwise" },
  { text: "You cannot pass. The dark fire will not avail you — and neither did your alarm.", speaker: "Balrog" },
];

// Milestone overrides: streak → quote
const milestoneQuotes = {
  5:   { text: "All we have to decide is what to do with the time that is given us.", speaker: "Gandalf" },
  10:  { text: "There is always hope.", speaker: "Aragorn" },
  20:  { text: "Even the smallest person can change the course of the future.", speaker: "Galadriel" },
  30:  { text: "YOU SHALL NOT PASS!", speaker: "Gandalf", milestone: true },
  50:  { text: "I can't carry it for you, but I can carry you.", speaker: "Samwise" },
  100: { text: "One hundred mornings. The ring is destroyed. You have won.", speaker: "The Legend" },
};

function getSuccessQuote(streak) {
  if (milestoneQuotes[streak]) return milestoneQuotes[streak];
  return successQuotes[Math.floor(Math.random() * successQuotes.length)];
}

function getFailureQuote() {
  return failureQuotes[Math.floor(Math.random() * failureQuotes.length)];
}

module.exports = { getSuccessQuote, getFailureQuote, milestoneQuotes };
