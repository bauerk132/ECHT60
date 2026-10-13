const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadSlotToHour() {
  const htmlPath = path.join(__dirname, '..', 'echt-analytics.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/function slotToHour\s*\([^)]*\)\s*\{[\s\S]*?\}/);
  if (!match) {
    throw new Error('slotToHour function not found in echt-analytics.html');
  }
  const context = {};
  vm.runInNewContext(`${match[0]}; globalThis.slotToHour = slotToHour;`, context);
  return context.slotToHour;
}

describe('slotToHour utility function', () => {
  const slotToHour = loadSlotToHour();

  test('converts standard slot numbers to hours correctly', () => {
    assert.strictEqual(slotToHour(0), 0);
    assert.strictEqual(slotToHour(1), 0.25);
    assert.strictEqual(slotToHour(2), 0.5);
    assert.strictEqual(slotToHour(3), 0.75);
    assert.strictEqual(slotToHour(4), 1);
    assert.strictEqual(slotToHour(8), 2);
    assert.strictEqual(slotToHour(40), 10);
    assert.strictEqual(slotToHour(96), 24);
  });

  test('handles fractional slots correctly', () => {
    assert.strictEqual(slotToHour(0.5), 0.125);
    assert.strictEqual(slotToHour(1.5), 0.375);
  });

  test('handles negative slots correctly', () => {
    assert.strictEqual(slotToHour(-4), -1);
    assert.strictEqual(slotToHour(-1), -0.25);
  });

  test('coerces string numbers to hours', () => {
    assert.strictEqual(slotToHour('4'), 1);
    assert.strictEqual(slotToHour('0'), 0);
    assert.strictEqual(slotToHour('12'), 3);
  });

  test('returns NaN when passed non-numeric values', () => {
    assert.ok(Number.isNaN(slotToHour(NaN)));
    assert.ok(Number.isNaN(slotToHour('abc')));
    assert.ok(Number.isNaN(slotToHour(undefined)));
  });
});
