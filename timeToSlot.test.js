import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function getTimeToSlot() {
  const html = fs.readFileSync('index.html', 'utf8');
  const match = html.match(/function timeToSlot\(timeStr\)\s*\{[\s\S]*?\n\}/);
  if (!match) {
    throw new Error('timeToSlot function definition not found in index.html');
  }
  return new Function(`${match[0]}; return timeToSlot;`)();
}

const timeToSlot = getTimeToSlot();

test('timeToSlot - basic hour boundaries', (t) => {
  assert.equal(timeToSlot('00:00'), 0);
  assert.equal(timeToSlot('01:00'), 4);
  assert.equal(timeToSlot('08:00'), 32);
  assert.equal(timeToSlot('12:00'), 48);
  assert.equal(timeToSlot('23:00'), 92);
});

test('timeToSlot - quarter-hour intervals', (t) => {
  assert.equal(timeToSlot('08:15'), 33);
  assert.equal(timeToSlot('08:30'), 34);
  assert.equal(timeToSlot('08:45'), 35);
  assert.equal(timeToSlot('14:30'), 58);
  assert.equal(timeToSlot('23:45'), 95);
});

test('timeToSlot - off-interval minutes and rounding behavior', (t) => {
  assert.equal(timeToSlot('08:07'), 32);
  assert.equal(timeToSlot('08:08'), 33);
  assert.equal(timeToSlot('00:07'), 0);
  assert.equal(timeToSlot('00:08'), 1);
  assert.equal(timeToSlot('23:59'), 96);
});
