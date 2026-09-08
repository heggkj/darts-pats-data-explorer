import { normalizeMatchText } from './entityMatching.js';

// A transparent exploratory keyword taxonomy, not model-discovered topics or
// validated sentiment. All rules and matched terms can be inspected by visitors.
export const TOPICS = [
  {id:'parking', name:'Parking & traffic', terms:['parking','parked','parking lot','traffic','drivers','driving','pedestrian','crosswalk','ticket']},
  {id:'transit', name:'Buses & transportation', terms:['bus','buses','bus driver','bus stop','shuttle','transit','ride home']},
  {id:'dining', name:'Food & dining', terms:['food','dining','dining hall','meal','meals','lunch','dinner','breakfast','coffee','restaurant','pizza','d hall','e hall']},
  {id:'housing', name:'Housing & roommates', terms:['roommate','roommates','suitemate','suite mate','dorm','dorms','apartment','apartments','landlord','residence hall']},
  {id:'teaching', name:'Classes & teaching', terms:['professor','professors','instructor','teacher','class','classes','homework','exam','exams','finals','lecture','assignment']},
  {id:'kindness', name:'Help & kindness', terms:['helped','helpful','kindness','kind','generous','good samaritan','returned my','found my','thank you','grateful']},
  {id:'relationships', name:'Relationships & friendship', terms:['friend','friends','friendship','boyfriend','girlfriend','dating','date night','break up','valentine','wedding']},
  {id:'courtesy', name:'Noise & courtesy', terms:['noise','noisy','loud','loudly','quiet','rude','manners','courtesy','inconsiderate','obnoxious']},
  {id:'weather', name:'Weather', terms:['weather','snow','snowing','rain','raining','ice','icy','freezing','sunshine','windy','snowstorm']},
  {id:'technology', name:'Technology', terms:['computer','computers','laptop','internet','wireless','wifi','wi fi','printer','printing','email','website','phone','canvas','blackboard']},
  {id:'sports', name:'Sports & recreation', terms:['football','basketball','soccer','baseball','softball','volleyball','tennis','swimming','athletics','athlete','athletes','gym','urec','team']},
  {id:'safety', name:'Safety & security', terms:['police','stole','stolen','theft','fire alarm','unsafe','security','assault','harassment','vandalism','emergency']},
  {id:'health', name:'Health & wellbeing', terms:['health','sick','illness','flu','injury','injured','hospital','counseling','mental health','stress','stressed']},
  {id:'environment', name:'Grounds & environment', terms:['trash','litter','recycling','recycle','grounds','landscaping','sustainability','earth day','garbage']},
  {id:'arts', name:'Arts & entertainment', terms:['music','concert','band','movie','movies','theatre','theater','television','tv','singing','performance']},
  {id:'costs', name:'Costs & money', terms:['tuition','fees','fee','scholarship','financial aid','expensive','afford','money','dollars','rent']},
];

export function recognizeTopics(record) {
  const fields = [record.text, record.target, record.sender].filter(Boolean).map(t=>` ${normalizeMatchText(t)} `);
  return TOPICS.flatMap(topic => {
    const matchedTerms = topic.terms.filter(term => fields.some(field=>field.includes(` ${term} `)));
    return matchedTerms.length ? [{id:topic.id,name:topic.name,matchedTerms}] : [];
  });
}

export function topicCounts(records) {
  return TOPICS.map(topic => {
    const matching = records.filter(r => r.topics?.some(t => t.id === topic.id));
    const darts = matching.filter(r=>r.kind==='DART').length;
    return {...topic,count:matching.length,darts,pats:matching.length-darts};
  });
}
