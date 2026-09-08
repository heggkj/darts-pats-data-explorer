import assert from 'node:assert/strict';
import { layoutEntityCloud } from '../src/cloudLayout.js';
import { ENTITY_DICTIONARY } from '../src/entityDictionary.js';

// Geometry tests with deterministic text measurements. No browser required.
const canvas = () => ({ getContext: () => ({ font: '', measureText(text) {
  const size = Number(this.font.match(/(\d+)px/)[1]);
  return { width: text.length * size * 0.55, actualBoundingBoxAscent: size * 0.8, actualBoundingBoxDescent: size * 0.2 };
} }) });
for (const width of [288, 576, 960]) {
  for (const spotlightId of ['jmu', 'canvas', 'duke-dog']) {
    let result;
    const entities = ENTITY_DICTIONARY.map((entity, i) => ({ ...entity, count: 1 + (i * 71) % 1000 }));
    layoutEntityCloud(entities, { width, spotlightId, canvas, seed: 123, onEnd: value => { result = value; } });
    assert.equal(result.words.length, entities.length);
    assert.equal(new Set(result.words.map(word => word.id)).size, entities.length);
    const anchor = result.words.find(word => word.id === spotlightId);
    assert.ok(anchor.top > 30 && anchor.top < 100, 'Anchor stays about two text rows from the top, regardless of total height');
    assert.ok(result.words.some(word => word.top + word.boxHeight <= anchor.top), 'Words above the selected entity');
    assert.ok(result.words.some(word => word.top >= anchor.top + anchor.boxHeight), 'Words below the selected entity');
    if (width >= 576 && spotlightId === 'canvas') {
      assert.ok(result.words.some(word => word.id !== spotlightId && word.top < anchor.top + anchor.boxHeight && word.top + word.boxHeight > anchor.top), 'Words beside the selected entity');
    }
    for (const word of result.words) {
      assert.ok(word.left >= 0 && word.left + word.boxWidth <= result.width + 0.01);
      assert.ok(word.top + word.boxHeight <= result.height);
      for (const other of result.words) {
        if (word === other) continue;
        const overlap = word.left < other.left + other.boxWidth - 0.001 && word.left + word.boxWidth > other.left + 0.001 && word.top < other.top + other.boxHeight - 0.001 && word.top + word.boxHeight > other.top + 0.001;
        assert.ok(!overlap, `${word.name} overlaps ${other.name}`);
      }
    }
  }
}
console.log('Anchored cloud geometry passed at 288, 576 and 960px: every entity retained, near-third-row placement, surrounding words, no rectangle overlaps.');
