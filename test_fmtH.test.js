import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function getFmtH() {
  const html = fs.readFileSync('echt-analytics.html', 'utf8');
  const match = html.match(/function fmtH\(min\)\s*\{[\s\S]*?\n\}/);
  if (!match) {
    throw new Error('fmtH function definition not found in echt-analytics.html');
  }
  return new Function(`${match[0]}; return fmtH;`)();
}

const fmtH = getFmtH();

test('fmtH - minute durations under 60 minutes', (t) => {
  assert.equal(fmtH(0), '0m');
  assert.equal(fmtH(1), '1m');
  assert.equal(fmtH(30), '30m');
  assert.equal(fmtH(59), '59m');
});

test('fmtH - exact hour durations', (t) => {
  assert.equal(fmtH(60), '1h');
  assert.equal(fmtH(120), '2h');
  assert.equal(fmtH(180), '3h');
});

test('fmtH - combinations of hours and minutes', (t) => {
  assert.equal(fmtH(61), '1h 1m');
  assert.equal(fmtH(90), '1h 30m');
  assert.equal(fmtH(145), '2h 25m');
  assert.equal(fmtH(305), '5h 5m');
});
