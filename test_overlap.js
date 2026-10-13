const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

// Extract blocksOverlap function from index.html
const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/function blocksOverlap\(a, b\)\s*\{[\s\S]*?\}/);

if (!match) {
  throw new Error('Could not find blocksOverlap function in index.html');
}

// Evaluate function definition to get blocksOverlap reference
const blocksOverlap = new Function(`
  ${match[0]}
  return blocksOverlap;
`)();

test('blocksOverlap - Exact boundary touching (endSlot === startSlot) should NOT overlap', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 4 };
  const blockB = { day: 1, startSlot: 4, endSlot: 8 };

  assert.strictEqual(blocksOverlap(blockA, blockB), false);
  assert.strictEqual(blocksOverlap(blockB, blockA), false);
});

test('blocksOverlap - Partial overlap across boundary should overlap', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 5 };
  const blockB = { day: 1, startSlot: 4, endSlot: 8 };

  assert.strictEqual(blocksOverlap(blockA, blockB), true);
  assert.strictEqual(blocksOverlap(blockB, blockA), true);
});

test('blocksOverlap - Identical start and end slots should overlap', () => {
  const blockA = { day: 1, startSlot: 2, endSlot: 6 };
  const blockB = { day: 1, startSlot: 2, endSlot: 6 };

  assert.strictEqual(blocksOverlap(blockA, blockB), true);
});

test('blocksOverlap - Subset block completely within another should overlap', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 10 };
  const blockB = { day: 1, startSlot: 2, endSlot: 5 };

  assert.strictEqual(blocksOverlap(blockA, blockB), true);
  assert.strictEqual(blocksOverlap(blockB, blockA), true);
});

test('blocksOverlap - Different days with same time slots should NOT overlap', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 5 };
  const blockB = { day: 2, startSlot: 0, endSlot: 5 };

  assert.strictEqual(blocksOverlap(blockA, blockB), false);
});

test('blocksOverlap - Disjoint blocks separated by a gap should NOT overlap', () => {
  const blockA = { day: 1, startSlot: 0, endSlot: 2 };
  const blockB = { day: 1, startSlot: 4, endSlot: 6 };

  assert.strictEqual(blocksOverlap(blockA, blockB), false);
  assert.strictEqual(blocksOverlap(blockB, blockA), false);
});
