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

test('timeToSlot - standard 15-minute slot times', (t) => {
  assert.equal(timeToSlot('00:00'), 0);
  assert.equal(timeToSlot('00:15'), 1);
  assert.equal(timeToSlot('00:30'), 2);
  assert.equal(timeToSlot('00:45'), 3);
  assert.equal(timeToSlot('01:00'), 4);
  assert.equal(timeToSlot('08:00'), 32);
  assert.equal(timeToSlot('12:00'), 48);
  assert.equal(timeToSlot('14:30'), 58);
  assert.equal(timeToSlot('23:45'), 95);
});

test('timeToSlot - unaligned minutes with rounding', (t) => {
  // 7 mins -> 7/15 = 0.4667 -> rounds to 0
  assert.equal(timeToSlot('00:07'), 0);
  // 8 mins -> 8/15 = 0.5333 -> rounds to 1
  assert.equal(timeToSlot('00:08'), 1);
  // 22 mins -> 22/15 = 1.4667 -> rounds to 1
  assert.equal(timeToSlot('00:22'), 1);
  // 23 mins -> 23/15 = 1.5333 -> rounds to 2
  assert.equal(timeToSlot('00:23'), 2);
  // 14:37 -> (14 * 60 + 37) / 15 = 877 / 15 = 58.4667 -> rounds to 58
  assert.equal(timeToSlot('14:37'), 58);
  // 14:38 -> (14 * 60 + 38) / 15 = 878 / 15 = 58.5333 -> rounds to 59
  assert.equal(timeToSlot('14:38'), 59);
});

test('timeToSlot - boundary values', (t) => {
  // Start of day
  assert.equal(timeToSlot('00:00'), 0);
  // End of day minute (23*60 + 59 = 1439 mins / 15 = 95.933 -> 96)
  assert.equal(timeToSlot('23:59'), 96);
});
