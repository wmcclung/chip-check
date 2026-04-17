'use strict';

const RIVIAN_DAYS = [9, 14, 19, 29, 37, 49, 54];

// Entries fire in order, one per Rivian day.
// Sequential — no band logic, no randomness, no repeats.

const RIVIAN_ENTRIES = [

  // Entry 1 — Day 9 — Jefe / Spanish
  `Four messages from Brent, 5:48 to 5:51am.

"buenos días"

"RIVIAN ESTÁ EN {{rivian_price}}. ESTOY MUY BIEN. TENGO UN BIGGIE EN MIS PANTOLONES AHORA MISMO. GRACIAS A DIOS."

"I just called my boss. I said jefe I'm taking the day. He said Brent it's quest day {{quest_day}}. I said sí jefe. He said you can't just — I said jefe por favor I need you to meter {{rivian_price}} en la garganta right now because I am NOT okay and I cannot be in an office. He said are you speaking Spanish to me. I said estoy speaking FEELINGS jefe. He said go home Brent. I said I'm already home jefe. He said then stay there. I said con mucho gusto."

"Papi tú eres increíble. Will tú eres INCREÍBLE. Kevin tus niños son los más increíbles niños en el mundo entero. I want to run through a wall for all of you. I want to carry this quest on my BACK. I want to put Ashen Peak en mi boca. VAMOS AHORA."

Kevin replied: "are you having a stroke"

Brent replied: "no Kevin I am having the BEST MORNING OF MY ENTIRE VIDA and I need you to receive that."

Kevin replied: "I'm not going to receive that"

Will replied: "Day {{quest_day}}. Jefe knows. Documented."

Brent replied: "CORRECTO WILL. HE FOLLOWS THE LEDGER. HE BELIEVES."

Chip replied: "papi does your jefe actually follow the ledger"

Brent replied: "Chip I have told everyone. Rivian, Papi. It's always Rivian. Te amo a todos. Let's go."`,


  // Entry 2 — Day 14 — Norm at the meetup
  `Brent sent a message that said: "I want to address something that happened last weekend."

Nobody had asked. Chip replied: "okay"

Brent replied: "I went to a Rivian owners meetup. I'm not an owner. I know that. But I wanted to be around the vehicles and I thought I'd be respectful and just observe. And things were going fine. And then a 2023 R1S pulled into the lot and I got jizzy. I didn't realize how jizzy I was being. I thought I was being normal. I was not being normal."

Kevin replied: "oh no"

Brent replied: "a man named Norm came over. Very calm. He said only registered owners get to jizz at the meetups and I needed to show registration if I was going to jizz that much because it was distracting and against the posted rules. I said Norm I don't own a Rivian but this isn't even jizz yet, this is pre cum, I know the rules. He said no way that is way too big of a spot on your khakis to be pre cum that is jizz. I said Norm that is just my drips, imagine how much of a leader I'm going to be here once I actually own one, you should be scared of what's coming. He said sir you need to leave. I said Norm I'm not even at full capacity. He said I'm going to need you to gather yourself and exit the premises. I said Norm listen to me. Rivian is {{rivian_price}}. It moved {{rivian_change_pct}}% today. He went quiet for a second. Then he said you made me shoot. Then he said you're a bad guy for making me shoot, you know that, you should go, fuck you, and fuck you I didn't ask you to make me shoot the way I shot right here."

Chip replied: "wow that's neat"

Brent replied: "Norm's a cool dude. Has a Rivian."

Will replied: "Day {{quest_day}}. Norm. Documented."`,


  // Entry 3 — Day 19 — My Strange Addiction
  `Brent sent a message at 7:04am that said: "I watched My Strange Addiction last night. The episode where the guy is sexually attracted to his car. My wife put it on as a joke. We were laughing at first. And then I got quiet. And she looked at me. And I looked at her. And she said Brent. And I said I'm fine. And she said Brent. And I said I'M FINE."

Kevin replied: "you're not fine"

Brent replied: "I see a picture of an R1T and something happens to me that I can't explain. The show was supposed to be funny but it was actually just a mirror held up to my face and I didn't like what I saw in that mirror and also I liked it very much and I need to talk to someone about that separately. Rivian is {{rivian_price}}. It moved {{rivian_change_pct}}% today and I felt it."

Chip replied: "papi"

Brent replied: "I'm getting help. Besides they don't even have exhaust anyway so you'd have to find something else if you were going to go all the way."

Will replied: "Day {{quest_day}}. Documented."`,


  // Entry 4 — Day 29 — Towel rack / seven faces
  `Brent sent at 8:23am: "I need to tell the group what happened this morning."

Chip replied: "okay"

Brent replied: "I was in the shower thinking about Rivian. Normal morning. And I got a situation going. And my wife opened the curtain and without saying anything just hung a towel on it and walked out."

Kevin replied: "on what"

Brent replied: "Kevin, I'm speaking."

Kevin replied: "oh"

Brent replied: "I said hey I was gonna use that erection, why did you put it on there and she said from the hallway — she was already in the hallway — she said Brent it's either a towel rack or it's nothing and I said NOTHING? and she said Rivian is {{rivian_price}} and I said how did you know and she said because that's your {{rivian_price}} face and closed the bathroom door."

Chip replied: "she knows your Rivian faces"

Brent replied: "she has named them. There are seven. I've only seen the list once. I'm not supposed to know about the list. My wife is an extraordinary woman and I do not deserve her. Papi let's go."

Will replied: "Day {{quest_day}}. Seven faces. Documented."

Brent replied: "Will if she finds the ledger I'm a dead man."

Will replied: "Day {{quest_day}}. Dead man. Documented."`,


  // Entry 5 — Day 37 — Brian in the bathroom
  `Brent started the day with: "I need to tell the group something."

Chip replied: "okay"

Brent replied: "I've been hanging around the bathroom at work. I thought I was being discreet. My jackass coworker Brian wanted to see who's in the stall. I was just chilling there fully clothed refreshing the earnings. He ducked his head under the door and looked at me. I looked at him. He looked at my phone. He looked at me again. He said Brent what are you doing. I said nothing. He said your pants are on. I said I know my pants are on Brian. He said then what are you doing in here. I said I'm working up to a fat shit, I'm getting in the zone. He said you're refreshing a lot, I can see it reflecting off the toilet paper dispenser, is this Rivian stock. I said no it's not. He said I can see it right now. I said occupado Brian go try the ladies room. He said you can't hold the stall all day others want to use it too. So I started bunching up toilet paper and tried to put it in his mouth but he kept closing his mouth and moving his head so I just piled it up and blocked him with my foot."

Chip replied: "how'd you get rid of him"

Brent replied: "I told him Rivian is {{rivian_price}}. It moved {{rivian_change_pct}}% today. He left immediately."

Will replied: "Day {{quest_day}}. Brian. Documented."`,


  // Entry 6 — Day 49 — Why is your wang out
  `Chip replied to a photo Brent sent at 6:04am: "brent why can I see your wang at the moment"

Will replied: "why is your dong out dude"

Brent replied: "Rivian is {{rivian_price}}. Papi up big too."

Kevin replied: "put your pecker away"

Brent replied: "ya youd like that papi chulo. look my papi does the helicopter dance now. no mi digas."

Will replied: "Day {{quest_day}}. Documented."`,


  // Entry 7 — Day 54 — Wife and parents leaving (finale)
  `Brent sent at 9:15am: "my wife is at her parents."

Chip replied: "is she okay"

Brent replied: "she's fine. She needed space from me specifically. Because I told her Rivian was going to go up. I showed her the Reddit thread where everyone agreed and she asked if that was my financial research and I said it was my CONFIRMATION and she started packing a bag."

Kevin replied: "that's not good"

Brent replied: "so I went to my parents. Just to have someone around. To be with family."

Chip replied: "that's good"

Brent replied: "they left."

Chip replied: "what"

Brent replied: "I showed them the chart. My dad said Brent we trusted you. I said Dad it's going to go up. He said you said that last time. I said IT'S GOING TO GO UP DAD and he went and packed a bag and now both my parents are staying at my wife's parents' house. My wife texted me and said your parents are here and I said I know and she said there are now six people at my parents' house because of you and I said how's the food over there and she said it's actually really good. Rivian is {{rivian_price}}."

Will replied: "Day {{quest_day}}. Six people. Documented."

Brent replied: "I'm alone in my house. Papi please wake up tomorrow. I genuinely need this."`,

];

function getNextRivianEntry(entryIndex) {
  const idx = entryIndex.master || 0;
  const entry = RIVIAN_ENTRIES[idx % RIVIAN_ENTRIES.length];
  const newIndex = { master: idx + 1 };
  return { entry, newIndex };
}

function populateRivianEntry(entry, { price, changePct, questDay }) {
  return entry
    .replace(/\{\{rivian_price\}\}/g, `$${price}`)
    .replace(/\{\{rivian_change_pct\}\}/g,
      Math.abs(parseFloat(changePct)).toFixed(1))
    .replace(/\{\{quest_day\}\}/g, String(questDay));
}

module.exports = {
  RIVIAN_DAYS,
  RIVIAN_ENTRIES,
  getNextRivianEntry,
  populateRivianEntry,
};
