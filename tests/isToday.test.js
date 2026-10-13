const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadIsToday() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Extract script content from index.html or locate function isToday
  const match = htmlContent.match(/function isToday\s*\([\s\S]*?\n\}/);
  if (!match) {
    throw new Error('Could not find function isToday in index.html');
  }

  const context = { Date };
  vm.createContext(context);
  vm.runInContext(match[0], context);
  return { isToday: context.isToday, context };
}

test('isToday returns true for current date', () => {
  const { isToday } = loadIsToday();
  const now = new Date();
  assert.strictEqual(isToday(now), true);
});

test('isToday returns true for same day with different times', () => {
  const { isToday } = loadIsToday();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  assert.strictEqual(isToday(startOfDay), true);
  assert.strictEqual(isToday(endOfDay), true);
});

test('isToday returns false for yesterday and tomorrow', () => {
  const { isToday } = loadIsToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  assert.strictEqual(isToday(yesterday), false);
  assert.strictEqual(isToday(tomorrow), false);
});

test('isToday returns false for same day in different years', () => {
  const { isToday } = loadIsToday();
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  assert.strictEqual(isToday(lastYear), false);
  assert.strictEqual(isToday(nextYear), false);
});

test('isToday with mocked system time / Date using local time', () => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const match = htmlContent.match(/function isToday\s*\([\s\S]*?\n\}/);

  // Use local Date constructor to ensure timezone consistency
  const fixedNow = new Date(2025, 4, 15, 12, 0, 0); // May 15, 2025 12:00:00 local time

  // Custom Date mock
  class MockDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedNow);
      } else {
        super(...args);
      }
    }
    static now() {
      return fixedNow.getTime();
    }
  }

  const context = { Date: MockDate };
  vm.createContext(context);
  vm.runInContext(match[0], context);
  const isToday = context.isToday;

  assert.strictEqual(isToday(new MockDate(2025, 4, 15, 0, 0, 0)), true);
  assert.strictEqual(isToday(new MockDate(2025, 4, 15, 23, 59, 59)), true);
  assert.strictEqual(isToday(new MockDate(2025, 4, 14, 23, 59, 59)), false);
  assert.strictEqual(isToday(new MockDate(2025, 4, 16, 0, 0, 0)), false);
  assert.strictEqual(isToday(new MockDate(2024, 4, 15, 12, 0, 0)), false);
});
