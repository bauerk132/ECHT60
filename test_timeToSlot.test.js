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

test('timeToSlot - standard time strings (15-min interval aligned)', (t) => {
  assert.equal(timeToSlot('00:00'), 0);
  assert.equal(timeToSlot('00:15'), 1);
  assert.equal(timeToSlot('01:00'), 4);
  assert.equal(timeToSlot('08:00'), 32);
  assert.equal(timeToSlot('14:30'), 58);
  assert.equal(timeToSlot('23:45'), 95);
});

test('timeToSlot - unaligned times with rounding behavior', (t) => {
  // 00:07 -> (0 + 7)/15 = 0.4667 -> rounds to 0
  assert.equal(timeToSlot('00:07'), 0);
  // 00:08 -> (0 + 8)/15 = 0.5333 -> rounds to 1
  assert.equal(timeToSlot('00:08'), 1);
  // 12:07 -> (720 + 7)/15 = 48.4667 -> rounds to 48
  assert.equal(timeToSlot('12:07'), 48);
  // 12:22 -> (720 + 22)/15 = 49.4667 -> rounds to 49
  assert.equal(timeToSlot('12:22'), 49);
});

test('timeToSlot - single digit hour and minute strings', (t) => {
  assert.equal(timeToSlot('0:0'), 0);
  assert.equal(timeToSlot('8:5'), 32); // (480 + 5)/15 = 32.33 -> 32
  assert.equal(timeToSlot('8:10'), 33); // (480 + 10)/15 = 32.66 -> 33
});
