const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract slotToTime function from index.html
function loadSlotToTime() {
  const htmlPath = path.join(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Find slotToTime function in the HTML file
  const match = htmlContent.match(/function slotToTime\([\s\S]*?\n\}/);
  if (!match) {
    throw new Error('Could not find slotToTime function in index.html');
  }

  // Evaluate function in function scope and return reference
  return new Function(`${match[0]}; return slotToTime;`)();
}

const slotToTime = loadSlotToTime();

test('slotToTime converts slot numbers to HH:MM time strings correctly', async (t) => {
  await t.test('slot 0 returns midnight "00:00"', () => {
    assert.strictEqual(slotToTime(0), '00:00');
  });

  await t.test('slot 1 returns 15 minutes past midnight "00:15"', () => {
    assert.strictEqual(slotToTime(1), '00:15');
  });

  await t.test('slot 4 returns 1 hour "01:00"', () => {
    assert.strictEqual(slotToTime(4), '01:00');
  });

  await t.test('slot 36 returns 9 AM "09:00"', () => {
    assert.strictEqual(slotToTime(36), '09:00');
  });

  await t.test('slot 49 returns 12:15 PM "12:15"', () => {
    assert.strictEqual(slotToTime(49), '12:15');
  });

  await t.test('slot 95 returns 23:45 PM "23:45"', () => {
    assert.strictEqual(slotToTime(95), '23:45');
  });
});
