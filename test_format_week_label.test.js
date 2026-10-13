const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadFormatWeekLabel() {
  const htmlPath = path.join(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Match the formatWeekLabel function declaration in index.html
  const match = htmlContent.match(/function\s+formatWeekLabel\s*\([\s\S]*?\n}/);
  if (!match) {
    throw new Error('formatWeekLabel function not found in index.html');
  }

  const context = {};
  vm.createContext(context);
  vm.runInContext(match[0], context);

  return context.formatWeekLabel;
}

const formatWeekLabel = loadFormatWeekLabel();

test('formatWeekLabel - standard week within a single month', () => {
  // Oct 14, 2024 (Monday) to Oct 20, 2024 (Sunday)
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 9, 14 + i));
  const result = formatWeekLabel(dates);
  assert.equal(result, 'Oct 14 — Oct 20, 2024');
});

test('formatWeekLabel - week spanning across two months in the same year', () => {
  // Sep 30, 2024 (Monday) to Oct 6, 2024 (Sunday)
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 8, 30 + i));
  const result = formatWeekLabel(dates);
  assert.equal(result, 'Sep 30 — Oct 6, 2024');
});

test('formatWeekLabel - week spanning across year boundary', () => {
  // Dec 30, 2024 (Monday) to Jan 5, 2025 (Sunday)
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 11, 30 + i));
  const result = formatWeekLabel(dates);
  // formatWeekLabel uses dates[0].getFullYear() for the year suffix
  assert.equal(result, 'Dec 30 — Jan 5, 2024');
});

test('formatWeekLabel - leap year week crossing Feb/Mar boundary', () => {
  // Feb 26, 2024 (Monday) to Mar 3, 2024 (Sunday) in 2024 (leap year)
  const dates = Array.from({ length: 7 }, (_, i) => new Date(2024, 1, 26 + i));
  const result = formatWeekLabel(dates);
  assert.equal(result, 'Feb 26 — Mar 3, 2024');
});
