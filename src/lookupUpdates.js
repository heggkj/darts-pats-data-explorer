// Approved September 8 review. Full phrases are enabled; unresolved short forms
// are deliberately absent. This file is the shared lookup for live and cached rows.
export const LOOKUP_VERSION = '2026-09-08';
export const EVENT_NAMES = new Set(['Springfest', 'Homecoming', 'Greek Sing', 'Super Bowl', 'Alternative Spring Break', "Parents' Weekend", 'Family Weekend', 'Relay for Life', 'Take Back the Night', 'Purple Out', 'Easter', 'Holocaust Remembrance Day', "St. Patrick's Day", "Valentine's Day", 'Spring Break']);

const additions = [
  ['Super Bowl', 'Events'],
  ['Madison Grill', 'Business', ['Madison Grill', 'Madison Grille']],
  ['Barack Obama', 'Person', ['Barack Obama', 'President Obama']],
  ['NFL', 'Organization'], ['Roop Hall', 'Building'], ['Door 4 Subs', 'Business'],
  ['Food Lion', 'Business'], ['J-lot', 'Place'], ['Kappa Alpha', 'Organization'],
  ['Instagram', 'Business'], ['Mason Street', 'Place'],
  ['McGraw-Long Hall', 'Building', ['McGraw-Long Hall', 'McGraw-Long']],
  ['Subway', 'Business'], ['Alternative Spring Break', 'Events'],
  ['ROTC', 'Organization'], ['Sigma Alpha Epsilon', 'Organization'],
  ['Taylor Hall', 'Building'], ['Weaver Hall', 'Building'], ['Britney Spears', 'Person'],
  ['University of Virginia', 'University', ['University of Virginia', 'U.Va.', 'U. Va.', 'UVa', 'UVA']],
  ['ESPN', 'Business'], ['Airport Lounge', 'Place'],
  ["Parents' Weekend", 'Events', ["Parents' Weekend", 'Parents Weekend']],
  ['Cantrell Avenue', 'Place'], ['Overtones', 'Organization'],
  ["Dave's Taverna", 'Business'], ['Relay for Life', 'Events'],
  ['Shenandoah Hall', 'Building'], ['Sigma Sigma Sigma', 'Organization'],
  ['Take Back the Night', 'Events'], ['YouTube', 'Business'],
  ['Old Dominion University', 'University', ['Old Dominion University', 'ODU']],
  ['Family Weekend', 'Events'], ['Purple Out', 'Events'], ['William & Mary', 'University'],
  ['JMU Board of Visitors', 'Organization'], ['Habitat for Humanity', 'Organization'],
  ['Title IX', 'Misc.'], ['Steelers', 'Organization', ['Pittsburgh Steelers']],
  ['ICS bus service', 'Misc.', ['ICS bus', 'ICS buses', 'ICS driver', 'ICS drivers']],
  ['Charleston', 'Place'], ['Easter', 'Events'], ['Mother Nature', 'Misc.'],
  ['The Zoo Cage', 'Group', ['Zoo Cage', 'Zoo Cagers']],
  ['Eagles', 'Organization', ['Philadelphia Eagles']],
  ['Harry Potter', 'Misc.'],
  ['Friends (TV series)', 'Misc.', ['Friends TV series']],
  ["Kinko's", 'Business', ["Kinko's", 'Kinko']],
  ['Arboretum', 'Place', ['the arboretum', 'campus arboretum']],
  ['Converse Hall', 'Building'], ['Uggs', 'Misc.'],
  ['Coca-Cola (drink)', 'Misc.', ['Coca-Cola', 'Coke machine', 'Coke machines', 'Coke product']],
  ['Theatre II', 'Building'], ['IT Help Desk', 'Organization', ['IT Help Desk', 'Miller Help Desk']],
  ['Jesus', 'Person'], ['Macklemore', 'Person'],
  ['Jersey Shore (TV series)', 'Misc.', ['Jersey Shore TV series']],
  ['Disney', 'Business'], ['Friendship House', 'Organization'],
  ['United States', 'Place', ['United States', 'U.S.']],
  ['The Mill', 'Housing', ['The Mill', 'Mill residents']],
  ['Washington football team (historical Redskins references)', 'Organization', ['Washington Redskins']],
  ['First Amendment', 'Misc.'], ['Braves', 'Organization', ['Atlanta Braves']],
  ['Buffalo Wild Wings', 'Business'], ['Burger King', 'Business'], ['Chi Phi', 'Organization'],
  ['D-Hub', 'Building'], ["JM's", 'Business'],
  ["McDonald's", 'Business', ["McDonald's", 'McDonalds']],
  ['Philadelphia', 'Place', ['Philadelphia', 'Philly']], ['Snapchat', 'Business'],
  ['AAA', 'Organization'], ['Alpha Phi', 'Organization'],
  ['Campus Crusade for Christ', 'Organization'],
  ['Delta Gamma', 'Organization', ['Delta Gamma', 'Delta Gammas']],
  ['Dingledine Hall', 'Building'], ['Fox Hill', 'Housing'],
  ['Holocaust Remembrance Day', 'Events'], ['Kappa Alpha Theta', 'Organization'],
  ['Mr. Chips', 'Business'], ["St. Patrick's Day", 'Events'], ['Taylor Swift', 'Person'],
  ['JMU community (Dukes)', 'Group', ['fellow Duke', 'fellow Dukes', 'proud Duke', 'proud Dukes', 'JMU community']],
  ["Valentine's Day", 'Events'],
  ['JACard', 'Misc.', ['JACard', 'JACards', 'JAC card', 'JAC cards']],
  ['James Madison', 'Person', ['President James Madison', 'James Madison himself']],
  ['James Madison statue', 'Place'], ['The Harrison', 'Housing', ['The Harrison apartments', 'apartment in The Harrison']],
  ['Bill Clinton', 'Person', ['Bill Clinton', 'President Clinton']],
  ['George H. W. Bush', 'Person'], ['George W. Bush', 'Person'],
  ['Spring Break', 'Events'], ['GPA', 'Misc.'],
  ['Warsaw parking facilities', 'Place', ['Warsaw parking deck', 'Warsaw parking garage', 'Warsaw parking lot']],
];

const aliasUpdates = {
  'student-success-center': ['SSC'],
  'main-street': ['South Main'],
  'dominos': ["Domino's"],
  'jacard': ['Card Services'],
  'i-81': ['Interstate 81'],
  'jmu-dining': ['Dukes Dining'],
  'd-hall': ['Gibbons breezeway', 'Gibbons bathroom', 'Gibbons rest room'],
  'wilson-hall': ['Wilson breezeway', 'Wilson steps', 'Wilson bell tower'],
  'miller-hall': ['Miller 101', 'Miller computer lab'],
  'eagle-hall': ['Eagle residents', 'Eagle resident'],
  'chandler-hall': ['Chandler computer lab'],
  'harrison-hall': ["Harrison's SMAD labs"],
};

export function applyLookupUpdates(base) {
  const result = base.map(entity => ({...entity, aliases: [...entity.aliases], type: EVENT_NAMES.has(entity.name) ? 'Events' : entity.type}));
  // Product mentions are not automatically mentions of the services office.
  result.find(e => e.id === 'jacard').aliases = ['JACard Services', 'Card Services', 'One Card Services'];
  // A bare surname is not always a library. Keep full-name and place-context forms.
  result.find(e => e.id === 'carrier-library').aliases = ['Carrier Library', 'Carrier computer lab', 'Carrier stacks'];
  result.find(e => e.id === 'choices').caseSensitive = true;
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const [name, type, aliases = [name]] of additions) {
    const existing = result.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.type = type;
      existing.aliases = [...new Set([...existing.aliases, ...aliases])];
    } else result.push({id: name === 'JACard' ? 'jacard-card' : slug(name), name, type, aliases, reviewVersion: LOOKUP_VERSION});
  }
  for (const [id, aliases] of Object.entries(aliasUpdates)) {
    const entity = result.find(e => e.id === id);
    if (entity) entity.aliases = [...new Set([...entity.aliases, ...aliases])];
  }
  return result;
}
