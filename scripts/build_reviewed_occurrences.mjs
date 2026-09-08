// Reproducible analysis export. Prints JSON; does not write files or publish.
// Every listed group was inspected in full, with exclusions below. No frequency
// cutoff is applied to a supported occurrence of an approved canonical entity.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { normalizeMatchText } from '../src/entityMatching.js';
const raw = fs.readFileSync(new URL('../analysis/ner/source-records.json', import.meta.url));
assert.equal(createHash('sha256').update(raw).digest('hex'), '889f7d9c72113fec97f70535be8b02d13dd59cc7e272dcf384a5918b14d61afd');
const records = new Map(JSON.parse(raw).map(r=>[r.id,r]));
const decisions = JSON.parse(fs.readFileSync(new URL('../analysis/ner/user-confirmations-evidence-2026-09-08.json', import.meta.url))).decisions;
const rows = new Map();
function add(id, entityId) {
  const record = records.get(id);
  assert.ok(record);
  if (!rows.has(id)) rows.set(id, {id, text:normalizeMatchText(record.text), entityIds:[]});
  if (!rows.get(id).entityIds.includes(entityId)) rows.get(id).entityIds.push(entityId);
}
function group(groupId, entityId, exclude=[]) {
  const decision = decisions.find(d=>d.reviewGroupId===groupId);
  assert.ok(decision);
  for (const id of decision.modelRecordIds) if (!exclude.includes(id)) add(id,entityId);
}
group(39,'wilson-hall'); group(43,'miller-hall',[2212]); group(44,'wampler-hall');
group(35,'eagle-hall'); group(72,'warren-hall'); group(74,'chesapeake-hall',[10682]);
group(49,'barack-obama'); group(150,'jmu-board-of-visitors');
group(52,'steelers'); group(77,'eagles'); group(48,'ics-bus-service');
group(47,'bill-clinton',[5917]); group(116,'friends-tv-series',[3762]);
group(53,'arboretum'); group(60,'converse-hall'); group(108,'coca-cola-drink');
group(177,'it-help-desk',[9897]); group(223,'jersey-shore-tv-series');
group(107,'chandler-hall',[1542]); group(126,'the-mill');
group(132,'washington-football-team-historical-redskins-references');
group(209,'washington-football-team-historical-redskins-references');
group(141,'taylor-hall',[1251,7021]);
group(171,'forbes-center',[7842,8585,9234]);
group(28,'dave-s-taverna',[1114,2431]);
group(32,'harrison-hall',[9191,9955]);
for (const id of [9191,9955]) add(id,'the-harrison');
for (const id of [2997,3117,4418,4686]) add(id,'george-w-bush');
add(284,'george-h-w-bush');
for (const id of [2848,4480,5615,5814,6449,10051]) add(id,'james-madison');
// Low-frequency building alias, verified against both original entries.
for (const id of [265,9562]) add(id,'d-hall');
console.log(JSON.stringify([...rows.values()].sort((a,b)=>a.id-b.id),null,2));
