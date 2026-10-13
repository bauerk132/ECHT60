const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract slotToHour from echt-analytics.html to ensure test directly targets source code implementation
const htmlPath = path.join(__dirname, '..', 'echt-analytics.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const match = htmlContent.match(/function slotToHour\([^)]*\)\s*\{[\s\S]*?\}/);
if (!match) {
  throw new Error('Could not find slotToHour function definition in echt-analytics.html');
}

// Evaluate function definition extracted from regex match
const evalFn = new Function(`
  ${match[0]}
  return slotToHour;
`);
const slotToHour = evalFn();

test('slotToHour converts 15-minute slots to hours correctly', async (t) => {
  await t.test('0 slots should equal 0 hours', () => {
    assert.strictEqual(slotToHour(0), 0);
  });

  await t.test('1 slot should equal 0.25 hours (15 mins)', () => {
    assert.strictEqual(slotToHour(1), 0.25);
  });

  await t.test('2 slots should equal 0.5 hours (30 mins)', () => {
    assert.strictEqual(slotToHour(2), 0.5);
  });

  await t.test('4 slots should equal 1 hour', () => {
    assert.strictEqual(slotToHour(4), 1);
  });

  await t.test('96 slots should equal 24 hours', () => {
    assert.strictEqual(slotToHour(96), 24);
  });

  await t.test('handles fractional slot values', () => {
    assert.strictEqual(slotToHour(0.5), 0.125);
  });

  await t.test('handles negative slot values', () => {
    assert.strictEqual(slotToHour(-4), -1);
  });
});
