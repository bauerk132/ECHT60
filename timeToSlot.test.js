const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

// Read the index.html file
const htmlContent = fs.readFileSync('index.html', 'utf8');

// Extract the timeToSlot function
const match = htmlContent.match(/function\s+timeToSlot\s*\([^)]*\)\s*\{[^}]*\}/);

if (!match) {
  console.error("Function timeToSlot not found in index.html");
  process.exit(1);
}

const functionCode = match[0];

// Execute the extracted code in a sandbox to make the function available
const script = new vm.Script(`${functionCode}\nmodule.exports = timeToSlot;`);
const sandbox = { module: {} };
vm.createContext(sandbox);
script.runInContext(sandbox);
const timeToSlot = sandbox.module.exports;

test('timeToSlot basic conversions', () => {
  assert.strictEqual(timeToSlot('00:00'), 0);
  assert.strictEqual(timeToSlot('01:00'), 4);
  assert.strictEqual(timeToSlot('12:30'), 50); // 12 * 60 = 720, + 30 = 750, / 15 = 50
  assert.strictEqual(timeToSlot('23:45'), 95); // 23 * 60 = 1380, + 45 = 1425, / 15 = 95
});

test('timeToSlot rounding behavior', () => {
  assert.strictEqual(timeToSlot('00:07'), 0); // 7 / 15 = 0.466 -> 0
  assert.strictEqual(timeToSlot('00:08'), 1); // 8 / 15 = 0.533 -> 1
  assert.strictEqual(timeToSlot('00:14'), 1);
  assert.strictEqual(timeToSlot('00:22'), 1); // 22 / 15 = 1.466 -> 1
  assert.strictEqual(timeToSlot('00:23'), 2); // 23 / 15 = 1.533 -> 2
});

test('timeToSlot edge cases', () => {
  assert.strictEqual(timeToSlot('24:00'), 96);
});
