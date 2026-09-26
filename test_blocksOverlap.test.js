import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function getBlocksOverlap(filename = 'index.html') {
  const html = fs.readFileSync(filename, 'utf8');
  const match = html.match(/function blocksOverlap\(a, b\)\s*\{[\s\S]*?\n\}/);
  if (!match) {
    throw new Error(`blocksOverlap function definition not found in ${filename}`);
  }
  return new Function(`${match[0]}; return blocksOverlap;`)();
}

const blocksOverlap = getBlocksOverlap('index.html');
const blocksOverlapAnalytics = getBlocksOverlap('echt-analytics.html');

test('blocksOverlap - index.html and echt-analytics.html match implementation', () => {
  const blockA = { day: 1, startSlot: 2, endSlot: 6 };
  const blockB = { day: 1, startSlot: 4, endSlot: 8 };
  assert.equal(blocksOverlap(blockA, blockB), blocksOverlapAnalytics(blockA, blockB));
});

test('blocksOverlap - adjacent boundary touching (no overlap)', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 5 };
  const blockB = { day: 1, startSlot: 5, endSlot: 10 };

  // Block A ends at slot 5, Block B starts at slot 5 -> exact boundary touching, no overlap
  assert.equal(blocksOverlap(blockA, blockB), false);
  assert.equal(blocksOverlap(blockB, blockA), false);
});

test('blocksOverlap - 1-slot boundary overlap', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 5 };
  const blockB = { day: 1, startSlot: 4, endSlot: 9 };

  // Block A (0..5) and Block B (4..9) overlap on slot 4
  assert.equal(blocksOverlap(blockA, blockB), true);
  assert.equal(blocksOverlap(blockB, blockA), true);
});

test('blocksOverlap - exact identical boundaries', () => {
  const blockA = { day: 2, startSlot: 10, endSlot: 20 };
  const blockB = { day: 2, startSlot: 10, endSlot: 20 };

  assert.equal(blocksOverlap(blockA, blockB), true);
  assert.equal(blocksOverlap(blockB, blockA), true);
});

test('blocksOverlap - fully enclosed block', () => {
  const outer = { day: 1, startSlot: 2, endSlot: 12 };
  const inner = { day: 1, startSlot: 4, endSlot: 8 };

  assert.equal(blocksOverlap(outer, inner), true);
  assert.equal(blocksOverlap(inner, outer), true);
});

test('blocksOverlap - disjoint blocks on same day', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 4 };
  const blockB = { day: 1, startSlot: 6, endSlot: 10 };

  assert.equal(blocksOverlap(blockA, blockB), false);
  assert.equal(blocksOverlap(blockB, blockA), false);
});

test('blocksOverlap - same slot range on different days', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 5 };
  const blockB = { day: 2, startSlot: 0, endSlot: 5 };

  assert.equal(blocksOverlap(blockA, blockB), false);
  assert.equal(blocksOverlap(blockB, blockA), false);
});

test('blocksOverlap - boundary touching at start (b ends when a starts)', () => {
  const blockA = { day: 'Monday', startSlot: 10, endSlot: 15 };
  const blockB = { day: 'Monday', startSlot: 5, endSlot: 10 };

  assert.equal(blocksOverlap(blockA, blockB), false);
  assert.equal(blocksOverlap(blockB, blockA), false);
});
