import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { filterArchive, archiveCoverage, initArchiveExplorer } from '../src/archiveExplorer.js';
import { recognizeEntities } from '../src/entityDictionary.js';
import { recognizeTopics, topicCounts, TOPICS } from '../src/topics.js';

const source = JSON.parse(fs.readFileSync(new URL('../public/data/records.json',import.meta.url)));
const records = source.filter(r=>['DART','PAT'].includes(r.kind)).map(r=>({...r,entities:recognizeEntities(r),topics:recognizeTopics(r)}));
assert.equal(filterArchive(source).length,10860);
assert.equal(filterArchive(records).length,10860);
const coverage=archiveCoverage(records);
assert.deepEqual(coverage,{total:10860,matched:6047,unmatched:4813});
const withEntity=filterArchive(records,{recognition:'matched'});
const withoutEntity=filterArchive(records,{recognition:'unmatched'});
assert.equal(new Set([...withEntity,...withoutEntity].map(r=>r.id)).size,10860);
assert.ok(!withEntity.some(r=>withoutEntity.some(n=>n.id===r.id)));
assert.ok(filterArchive(records,{query:'Dukes Dining',year:'2026',kind:'DART'}).some(r=>r.id===10827));
assert.equal(filterArchive([{id:1,kind:'PAT',year:2000,text:'Café',target:'roommate',sender:'student',entities:[]}],{query:'CAFE roommate'}).length,1);
assert.equal(filterArchive(records,{query:'[not-a-regex]'}).length,0);
assert.ok(filterArchive(records,{year:1991,kind:'PAT',recognition:'unmatched'}).every(r=>r.year===1991&&r.kind==='PAT'&&!r.entities.length));
assert.ok(filterArchive(records,{topic:'parking'}).every(r=>r.topics.some(t=>t.id==='parking')));
assert.deepEqual(recognizeTopics({text:'chair',target:'noise'}).map(t=>t.id),['courtesy']);
assert.equal(recognizeTopics({text:'The bus bus bus was late.'}).find(t=>t.id==='transit').matchedTerms.length,1);
assert.ok(!recognizeTopics({text:'Dr. Snowman spoke.'}).some(t=>t.id==='weather'),'Whole-token matching');
assert.equal(new Set(TOPICS.map(t=>t.id)).size,TOPICS.length);
const counts=topicCounts(records);
assert.ok(counts.every(t=>t.count===t.darts+t.pats));
const topicCovered=records.filter(r=>r.topics.length).length;
assert.ok(counts.reduce((n,t)=>n+t.count,0)>topicCovered,'Topic overlap is not added as coverage');

// Exercise real controller events with lightweight DOM doubles, not browser QA.
class Element {
  constructor(value='') { this.value=value;this.hidden=false;this.innerHTML='';this.textContent='';this.handlers={};this.attrs={};this.dataset={}; }
  addEventListener(name,fn) { this.handlers[name]=fn; }
  setAttribute(k,v) { this.attrs[k]=v; }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  querySelector() { return {focus(){}}; }
}
const keys=['archive-panel','archive-filters','archive-records','archive-results-status','archive-coverage','archive-more','archive-query','archive-year','archive-kind','archive-recognition','archive-reset','topics-panel','topic-buttons','topic-status','topic-rules','archive-title','entities-panel'];
const els=Object.fromEntries(keys.map(k=>[k,new Element()]));
for(const k of ['year','kind','recognition']) els[`archive-${k}`].value='all';
els['archive-more'].hidden=true;
const views=['archive','entities','topics'].map(view=>{const e=new Element();e.dataset.explorerView=view;e.attrs['aria-controls']=view==='entities'?'entities-panel':'archive-panel';return e;});
globalThis.document={querySelector:s=>els[s.slice(1)],querySelectorAll:()=>views};
let entitySwitches=0;
const controller=initArchiveExplorer({recordCard:r=>`<article data-id="${r.id}"></article>`,escapeHtml:s=>String(s).replaceAll('<','&lt;'),onShowEntities:()=>entitySwitches++});
controller.setRecords(records);
assert.match(els['archive-results-status'].textContent,/10,860 matching entries/);
assert.equal((els['archive-records'].innerHTML.match(/<article/g)||[]).length,30);
els['archive-more'].handlers.click();
assert.equal((els['archive-records'].innerHTML.match(/<article/g)||[]).length,60);
els['archive-query'].value='Dukes Dining';els['archive-query'].handlers.input();
assert.match(els['archive-records'].innerHTML,/data-id="10827"/);
els['archive-recognition'].value='unmatched';els['archive-recognition'].handlers.change();
assert.ok(!els['archive-records'].innerHTML.includes('data-id="10827"'));
els['archive-query'].value='there-is-no-such-query-abcdefxyz';els['archive-query'].handlers.input();
assert.match(els['archive-results-status'].textContent,/No entries match/);
els['archive-reset'].handlers.click();
assert.match(els['archive-results-status'].textContent,/10,860 matching entries/);
views[1].handlers.click();assert.equal(els['archive-panel'].hidden,true);assert.equal(els['entities-panel'].hidden,false);assert.equal(entitySwitches,1);
views[2].handlers.click();assert.equal(els['archive-panel'].hidden,false);assert.equal(els['topics-panel'].hidden,false);assert.match(els['topic-buttons'].innerHTML,/data-topic="parking"/);
els['topic-buttons'].handlers.click({target:{closest:()=>({dataset:{topic:'parking'}})}});
assert.match(els['archive-results-status'].textContent,new RegExp(filterArchive(records,{topic:'parking'}).length.toLocaleString('en-US')+' matching entries'));
views[0].handlers.click();assert.equal(els['topics-panel'].hidden,true);assert.match(els['archive-results-status'].textContent,/10,860 matching entries/);
// Every page is reachable, and the final page ends pagination.
for(let i=0;i<Math.ceil(records.length/30);i++) els['archive-more'].handlers.click();
const shown=[...els['archive-records'].innerHTML.matchAll(/data-id="(\d+)"/g)].map(m=>Number(m[1]));
assert.equal(shown.length,10860);assert.equal(new Set(shown).size,10860);assert.equal(els['archive-more'].hidden,true);
// A live refresh recomputes coverage and includes a new eligible row immediately.
controller.setRecords([...records,{id:20000,kind:'PAT',year:2027,text:'A new entry with no names.',entities:[]}]);
assert.match(els['archive-results-status'].textContent,/10,861 matching entries/);
assert.match(els['archive-records'].innerHTML,/data-id="20000"/);
assert.match(els['archive-year'].innerHTML,/value="2027"/);
delete globalThis.document;

const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const funcs=['escapeHtml','formatDate','recordCard'].map(name=>{const start=app.indexOf(`function ${name}(`);const end=app.indexOf('\nfunction ',start+1);return app.slice(start,end);}).join('\n');
const ctx=vm.createContext({Intl,Date});vm.runInContext(funcs,ctx);
const html=ctx.recordCard({id:1,kind:'PAT',year:2000,date:'" onmouseover="bad',text:'<img src=x onerror=bad>',target:'<script>bad</script>',sourcePdf:'<svg onload=bad>'});
assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<svg'));assert.ok(html.includes('&quot; onmouseover='));
console.log(JSON.stringify({allEntries:records.length,entityCovered:coverage.matched,topicCovered,topics:TOPICS.length,checks:'filter combinations, pagination to every row, view independence, topic evidence, live refresh, escaping'}));
