const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadHtmlScriptContext() {
  const htmlPath = path.resolve(__dirname, '../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Could not find <script> tag in index.html');
  }

  const scriptContent = scriptMatch[1];

  const sandbox = {
    Math,
    console,
    document: {
      addEventListener: () => {},
      getElementById: () => ({ addEventListener: () => {}, style: {}, value: '' }),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => ({ style: {}, classList: { add: () => {} }, appendChild: () => {} }),
    },
    window: {
      addEventListener: () => {},
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    Date,
    Array,
    String,
    Number,
    JSON,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(scriptContent, context);

  return {
    context,
    yToSlot: (y) => vm.runInContext(`yToSlot(${y})`, context),
    getConstant: (name) => vm.runInContext(name, context),
  };
}

test('yToSlot - Lower boundary clamping (negative Y values)', () => {
  const { yToSlot } = loadHtmlScriptContext();
  assert.equal(yToSlot(-1), 0, 'Negative Y (-1) should clamp to slot 0');
  assert.equal(yToSlot(-100), 0, 'Large negative Y (-100) should clamp to slot 0');
  assert.equal(yToSlot(-Infinity), 0, '-Infinity Y should clamp to slot 0');
  assert.equal(yToSlot(0), 0, 'Y = 0 should return slot 0');
});

test('yToSlot - Exact slot boundaries', () => {
  const { yToSlot, getConstant } = loadHtmlScriptContext();
  const SLOT_HEIGHT = getConstant('SLOT_HEIGHT'); // 20
  const TOTAL_SLOTS = getConstant('TOTAL_SLOTS'); // 96

  assert.equal(yToSlot(0), 0, 'Y = 0 maps to slot 0');
  assert.equal(yToSlot(SLOT_HEIGHT), 1, 'Y = SLOT_HEIGHT maps to slot 1');
  assert.equal(yToSlot(2 * SLOT_HEIGHT), 2, 'Y = 2 * SLOT_HEIGHT maps to slot 2');
  assert.equal(yToSlot(10 * SLOT_HEIGHT), 10, 'Y = 10 * SLOT_HEIGHT maps to slot 10');
  assert.equal(yToSlot((TOTAL_SLOTS - 1) * SLOT_HEIGHT), TOTAL_SLOTS - 1, 'Y at last slot start maps to TOTAL_SLOTS - 1');
});

test('yToSlot - Midpoint rounding threshold (Math.round behavior)', () => {
  const { yToSlot } = loadHtmlScriptContext();
  // SLOT_HEIGHT = 20
  // Slot 0 ranges from y = 0 to y < 10 (rounds to 0)
  assert.equal(yToSlot(0), 0, 'y = 0 maps to slot 0');
  assert.equal(yToSlot(9), 0, 'y = 9 should round down to slot 0');
  assert.equal(yToSlot(9.99), 0, 'y = 9.99 should round down to slot 0');

  // Midpoint 10 rounds up to slot 1
  assert.equal(yToSlot(10), 1, 'y = 10 (halfway) should round up to slot 1');
  assert.equal(yToSlot(11), 1, 'y = 11 should round to slot 1');
  assert.equal(yToSlot(29), 1, 'y = 29 should round to slot 1');

  // Midpoint 30 rounds up to slot 2
  assert.equal(yToSlot(30), 2, 'y = 30 should round up to slot 2');
});

test('yToSlot - Upper boundary clamping (Y values exceeding max slot height)', () => {
  const { yToSlot, getConstant } = loadHtmlScriptContext();
  const SLOT_HEIGHT = getConstant('SLOT_HEIGHT'); // 20
  const TOTAL_SLOTS = getConstant('TOTAL_SLOTS'); // 96
  const maxSlot = TOTAL_SLOTS - 1; // 95
  const maxY = maxSlot * SLOT_HEIGHT; // 1900

  assert.equal(yToSlot(maxY), maxSlot, 'Y at max slot start (1900) maps to maxSlot 95');
  assert.equal(yToSlot(maxY + 9), maxSlot, 'Y = 1909 maps to maxSlot 95');
  assert.equal(yToSlot(maxY + 10), maxSlot, 'Y = 1910 (would round to 96) clamps to maxSlot 95');
  assert.equal(yToSlot(maxY + 100), maxSlot, 'Y = 2000 clamps to maxSlot 95');
  assert.equal(yToSlot(100000), maxSlot, 'Large positive Y clamps to maxSlot 95');
  assert.equal(yToSlot(Infinity), maxSlot, 'Infinity Y clamps to maxSlot 95');
});

test('yToSlot - Behavior with customized global constants', () => {
  const htmlPath = path.resolve(__dirname, '../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
  const scriptContent = scriptMatch[1];

  // Substitute SLOT_HEIGHT and TOTAL_HOURS to verify dynamic constant dependencies
  const modifiedContent = scriptContent
    .replace('const SLOT_HEIGHT = 20;', 'const SLOT_HEIGHT = 50;')
    .replace('const TOTAL_HOURS = 24;', 'const TOTAL_HOURS = 10;'); // TOTAL_SLOTS = 40

  const sandbox = {
    Math,
    console,
    document: {
      addEventListener: () => {},
      getElementById: () => ({ addEventListener: () => {}, style: {}, value: '' }),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => ({ style: {}, classList: { add: () => {} }, appendChild: () => {} }),
    },
    window: { addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    Date,
    Array,
    String,
    Number,
    JSON,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(modifiedContent, context);

  const customSlotHeight = vm.runInContext('SLOT_HEIGHT', context); // 50
  const customTotalSlots = vm.runInContext('TOTAL_SLOTS', context); // 40

  assert.equal(customSlotHeight, 50);
  assert.equal(customTotalSlots, 40);

  const customYToSlot = (y) => vm.runInContext(`yToSlot(${y})`, context);

  assert.equal(customYToSlot(0), 0);
  assert.equal(customYToSlot(24), 0);
  assert.equal(customYToSlot(25), 1);
  assert.equal(customYToSlot(-50), 0);
  assert.equal(customYToSlot(39 * 50), 39);
  assert.equal(customYToSlot(5000), 39);
});
