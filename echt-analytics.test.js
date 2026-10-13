const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('node:vm');

const htmlContent = fs.readFileSync('echt-analytics.html', 'utf8');

// Extract the fmtH function
const match = htmlContent.match(/function fmtH\(min\) \{[\s\S]*?\n\}/);
if (!match) {
  throw new Error('Could not find function fmtH(min) in echt-analytics.html');
}

const functionCode = match[0];

// Evaluate the function in a sandbox
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(functionCode, sandbox);
const fmtH = sandbox.fmtH;

test('fmtH - duration formatting', async (t) => {
  await t.test('sub-hour durations', () => {
    assert.strictEqual(fmtH(0), '0m');
    assert.strictEqual(fmtH(5), '5m');
    assert.strictEqual(fmtH(45), '45m');
    assert.strictEqual(fmtH(59), '59m');
  });

  await t.test('exact hours', () => {
    assert.strictEqual(fmtH(60), '1h');
    assert.strictEqual(fmtH(120), '2h');
    assert.strictEqual(fmtH(600), '10h');
  });

  await t.test('mixed hours and minutes', () => {
    assert.strictEqual(fmtH(61), '1h 1m');
    assert.strictEqual(fmtH(90), '1h 30m');
    assert.strictEqual(fmtH(125), '2h 5m');
    assert.strictEqual(fmtH(150), '2h 30m');
  });

  await t.test('negative durations (edge case)', () => {
    // The function as written returns `${min}m` for min < 60, including negative numbers.
    assert.strictEqual(fmtH(-5), '-5m');
  });
});
