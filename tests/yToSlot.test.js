const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('yToSlot boundary and calculation tests', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Extract function yToSlot(y)
  const funcRegex = /function yToSlot\(y\) \{([\s\S]*?)\}/;
  const funcMatch = html.match(funcRegex);

  if (!funcMatch) {
    throw new Error('yToSlot function not found in index.html');
  }

  const sandbox = {};
  vm.createContext(sandbox);

  // Define constants matching index.html
  vm.runInContext(`
    const SLOT_HEIGHT = 20;
    const SLOTS_PER_HOUR = 4;
    const TOTAL_HOURS = 24;
    const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR;
  `, sandbox);

  // Define the extracted function
  vm.runInContext(`function yToSlot(y) { ${funcMatch[1]} }`, sandbox);

  // Test below minimum boundary (negative values)
  assert.strictEqual(sandbox.yToSlot(-100), 0, 'Negative values should clamp to 0');
  assert.strictEqual(sandbox.yToSlot(-1), 0, '-1 should clamp to 0');

  // Test absolute minimum valid boundary
  assert.strictEqual(sandbox.yToSlot(0), 0, 'y=0 should return slot 0');

  // Test rounding logic (SLOT_HEIGHT = 20)
  assert.strictEqual(sandbox.yToSlot(9), 0, 'y=9 (9/20 = 0.45) should round down to 0');
  assert.strictEqual(sandbox.yToSlot(10), 1, 'y=10 (10/20 = 0.5) should round up to 1');
  assert.strictEqual(sandbox.yToSlot(29), 1, 'y=29 (29/20 = 1.45) should round down to 1');
  assert.strictEqual(sandbox.yToSlot(30), 2, 'y=30 (30/20 = 1.5) should round up to 2');

  // Test max valid boundary: (TOTAL_SLOTS - 1) = 95
  const maxValidY = 95 * 20; // 1900
  assert.strictEqual(sandbox.yToSlot(maxValidY - 11), 94, 'y=1889 should round down to 94');
  assert.strictEqual(sandbox.yToSlot(maxValidY - 10), 95, 'y=1890 should round up to 95');
  assert.strictEqual(sandbox.yToSlot(maxValidY), 95, 'max valid Y should return 95');

  // Test above maximum boundary (large positive values)
  assert.strictEqual(sandbox.yToSlot(maxValidY + 100), 95, 'Values above max Y should clamp to 95');
  assert.strictEqual(sandbox.yToSlot(999999), 95, 'Very large values should clamp to 95');
});
