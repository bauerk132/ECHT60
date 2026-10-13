const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract formatWeekLabel function from index.html
const htmlPath = path.join(__dirname, '../index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const match = htmlContent.match(/function\s+formatWeekLabel\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
if (!match) {
  throw new Error('Could not find formatWeekLabel function definition in index.html');
}

// Evaluate function definition
const formatWeekLabel = new Function(`return (${match[0]})`)();

test('formatWeekLabel formats a standard week within the same month', () => {
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i)); // Jan 1 - Jan 7, 2024
  assert.strictEqual(formatWeekLabel(dates), 'Jan 1 — Jan 7, 2024');
});

test('formatWeekLabel formats a week spanning across month boundaries', () => {
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 3, 29 + i)); // Apr 29 - May 5, 2024
  assert.strictEqual(formatWeekLabel(dates), 'Apr 29 — May 5, 2024');
});

test('formatWeekLabel formats a week spanning across year boundaries', () => {
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 11, 30 + i)); // Dec 30, 2024 - Jan 5, 2025
  assert.strictEqual(formatWeekLabel(dates), 'Dec 30 — Jan 5, 2024');
});

test('formatWeekLabel formats a week during a leap year in February', () => {
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 1, 26 + i)); // Feb 26 - Mar 3, 2024 (2024 is leap year)
  assert.strictEqual(formatWeekLabel(dates), 'Feb 26 — Mar 3, 2024');
});

test('formatWeekLabel correctly handles double-digit day numbers', () => {
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 9, 14 + i)); // Oct 14 - Oct 20, 2024
  assert.strictEqual(formatWeekLabel(dates), 'Oct 14 — Oct 20, 2024');
});
