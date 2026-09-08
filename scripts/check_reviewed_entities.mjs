import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENTITY_DICTIONARY, ENTITY_TYPE_COLORS, recognizeEntities } from '../src/entityDictionary.js';
import { REVIEWED_ENTITIES } from '../src/reviewedEntities.js';

const records = JSON.parse(readFileSync(new URL('../public/data/records.json', import.meta.url), 'utf8'))
  .filter(record => ['DART', 'PAT'].includes(record.kind));
const byId = new Map(records.map(record => [record.id, record]));
const matches = new Map(records.map(record => [record.id, new Set(recognizeEntities(record).map(entity => entity.id))]));
assert.equal(REVIEWED_ENTITIES.length, 71);
assert.equal(ENTITY_DICTIONARY.length, 281);
assert.equal(new Set(ENTITY_DICTIONARY.map(entity => entity.id)).size, ENTITY_DICTIONARY.length);
assert.equal(new Set(ENTITY_DICTIONARY.map(entity => entity.name)).size, ENTITY_DICTIONARY.length);
for (const entity of REVIEWED_ENTITIES) {
  assert.ok(ENTITY_TYPE_COLORS[entity.type], `Missing type color: ${entity.type}`);
  assert.ok(entity.reviewNote && entity.evidence.length >= 2);
  for (const id of entity.evidence) {
    assert.ok(byId.has(id), `Missing evidence record ${id}`);
    assert.ok(matches.get(id).has(entity.id), `${entity.name} not matched in evidence record ${id}`);
  }
  const repeated = recognizeEntities({ text: `${entity.name} and ${entity.name}`, target: entity.name });
  assert.equal(repeated.filter(match => match.id === entity.id).length, 1, 'One count per entity per record');
}
const misc = REVIEWED_ENTITIES.filter(entity => entity.type === 'Misc.');
assert.equal(misc.length, 12);
for (const name of ['Springfest', 'VAX', 'Potty Mouth', 'GCOM', 'Darts & Pats', 'Homecoming', 'iPod', 'FLEX', 'Greek Sing', 'Jeep', 'Star Wars', 'Canvas']) {
  assert.ok(misc.some(entity => entity.name === name), `${name} was included in the original reviewed catalogue`);
}
for (const name of ['Springfest', 'Homecoming', 'Greek Sing']) assert.equal(ENTITY_DICTIONARY.find(e=>e.name===name).type,'Events');
const generic = new Set(recognizeEntities({ text: "Please take care of the canvas and flex your muscles; let's go home. We send darts and pats." }).map(entity => entity.id));
for (const id of ['care', 'canvas', 'flex', 'let-s-go', 'darts-and-pats']) assert.ok(!generic.has(id), `Generic words must not match ${id}`);
assert.ok(!recognizeEntities({ text: 'Gifford', target: 'Hall' }).some(entity => entity.id === 'gifford-hall'), 'Names cannot cross field boundaries');
assert.ok(recognizeEntities({ text: 'Chick-fil-A, Dunkin’ and Darts and Pats' }).some(entity => entity.id === 'darts-and-pats'));
const usedIds = new Set([...matches.values()].flatMap(ids => [...ids]));
assert.equal(usedIds.size, 278);
console.log(`Reviewed catalogue checks passed: ${REVIEWED_ENTITIES.length} additions, ${misc.length} Misc., ${usedIds.size} entities in ${records.length} eligible records.`);
