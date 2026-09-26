import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Load index.html script in VM context to test actual implementation
function loadIndexScript(mockNow) {
  const html = fs.readFileSync('index.html', 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Could not extract <script> from index.html');
  }
  const code = scriptMatch[1];

  // Custom Date constructor override if mockNow is supplied
  class MockDate extends Date {
    constructor(...args) {
      if (args.length === 0 && mockNow) {
        super(mockNow);
      } else {
        super(...args);
      }
    }
    static now() {
      return mockNow ? new Date(mockNow).getTime() : Date.now();
    }
  }

  const dummyElement = {
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    dataset: {},
  };

  const context = {
    document: {
      addEventListener: () => {},
      getElementById: () => dummyElement,
      querySelectorAll: () => [],
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    setTimeout: () => {},
    setInterval: () => {},
    Date: mockNow ? MockDate : Date,
  };

  vm.createContext(context);
  vm.runInContext(code, context);

  return context;
}

describe('getWeekDates week calculation tests', () => {
  describe('Standard week calculations with mock current date', () => {
    test('returns 7 dates starting from Monday to Sunday for a Wednesday', () => {
      // 2026-08-19 is a Wednesday
      const mockNow = new Date(2026, 7, 19, 10, 30, 0); // Aug 19, 2026
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      assert.equal(dates.length, 7);
      // Day 0 should be Monday (Aug 17, 2026)
      assert.equal(dates[0].getDay(), 1); // 1 = Mon
      assert.equal(dates[0].getDate(), 17);
      assert.equal(dates[0].getMonth(), 7); // August (0-indexed)
      assert.equal(dates[0].getFullYear(), 2026);

      // Day 6 should be Sunday (Aug 23, 2026)
      assert.equal(dates[6].getDay(), 0); // 0 = Sun
      assert.equal(dates[6].getDate(), 23);
      assert.equal(dates[6].getMonth(), 7);
      assert.equal(dates[6].getFullYear(), 2026);
    });

    test('correctly handles week calculation when current day is Monday (start of week)', () => {
      // 2026-08-17 is a Monday
      const mockNow = new Date(2026, 7, 17, 8, 0, 0);
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      assert.equal(dates.length, 7);
      assert.equal(dates[0].getDate(), 17);
      assert.equal(dates[0].getDay(), 1);
      assert.equal(dates[6].getDate(), 23);
      assert.equal(dates[6].getDay(), 0);
    });

    test('correctly handles week calculation when current day is Sunday (end of week)', () => {
      // 2026-08-23 is a Sunday
      const mockNow = new Date(2026, 7, 23, 23, 59, 59);
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      assert.equal(dates.length, 7);
      assert.equal(dates[0].getDate(), 17); // Should still belong to Monday Aug 17
      assert.equal(dates[0].getDay(), 1);
      assert.equal(dates[6].getDate(), 23);
      assert.equal(dates[6].getDay(), 0);
    });
  });

  describe('state.weekOffset handling', () => {
    test('positive weekOffset (+1 week ahead)', () => {
      const mockNow = new Date(2026, 7, 19); // Wed Aug 19, 2026
      const ctx = loadIndexScript(mockNow);
      vm.runInContext('state.weekOffset = 1', ctx);

      const dates = ctx.getWeekDates();

      assert.equal(dates[0].getDate(), 24); // Mon Aug 24
      assert.equal(dates[6].getDate(), 30); // Sun Aug 30
    });

    test('negative weekOffset (-1 week back)', () => {
      const mockNow = new Date(2026, 7, 19); // Wed Aug 19, 2026
      const ctx = loadIndexScript(mockNow);
      vm.runInContext('state.weekOffset = -1', ctx);

      const dates = ctx.getWeekDates();

      assert.equal(dates[0].getDate(), 10); // Mon Aug 10
      assert.equal(dates[6].getDate(), 16); // Sun Aug 16
    });

    test('large positive and negative weekOffset (+52 and -52 weeks)', () => {
      const mockNow = new Date(2026, 7, 19); // Wed Aug 19, 2026
      const ctx = loadIndexScript(mockNow);

      vm.runInContext('state.weekOffset = 52', ctx);
      const futureDates = ctx.getWeekDates();
      assert.equal(futureDates[0].getFullYear(), 2027);

      vm.runInContext('state.weekOffset = -52', ctx);
      const pastDates = ctx.getWeekDates();
      assert.equal(pastDates[0].getFullYear(), 2025);
    });
  });

  describe('Calendar edge cases & date boundaries', () => {
    test('month boundary transition (e.g. Feb 23 to Mar 1 in a non-leap year)', () => {
      // 2026-03-01 is a Sunday. The week started on Mon Feb 23, 2026.
      const mockNow = new Date(2026, 2, 1); // March 1, 2026
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      assert.equal(dates[0].getMonth(), 1); // Feb
      assert.equal(dates[0].getDate(), 23);
      assert.equal(dates[6].getMonth(), 2); // Mar
      assert.equal(dates[6].getDate(), 1);
    });

    test('leap year February handling (e.g. Feb 29, 2024)', () => {
      // 2024-02-29 was a Thursday in a leap year. Week: Mon Feb 26 -> Sun Mar 3
      const mockNow = new Date(2024, 1, 29);
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      assert.equal(dates[0].getDate(), 26);
      assert.equal(dates[0].getMonth(), 1); // Feb
      assert.equal(dates[3].getDate(), 29); // Thu Feb 29
      assert.equal(dates[3].getMonth(), 1); // Feb
      assert.equal(dates[6].getDate(), 3);  // Sun Mar 3
      assert.equal(dates[6].getMonth(), 2); // Mar
    });

    test('year boundary transition (e.g. Dec 31 / Jan 1)', () => {
      // 2026-12-31 is a Thursday. Week: Mon Dec 28, 2026 -> Sun Jan 3, 2027
      const mockNow = new Date(2026, 11, 31);
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      assert.equal(dates[0].getFullYear(), 2026);
      assert.equal(dates[0].getMonth(), 11); // Dec
      assert.equal(dates[0].getDate(), 28);

      assert.equal(dates[6].getFullYear(), 2027);
      assert.equal(dates[6].getMonth(), 0);  // Jan
      assert.equal(dates[6].getDate(), 3);
    });
  });

  describe('Sequential continuity & date integrity', () => {
    test('returned array elements are consecutive days with 24-hour spacing', () => {
      const mockNow = new Date(2026, 7, 19);
      const ctx = loadIndexScript(mockNow);

      const dates = ctx.getWeekDates();

      for (let i = 0; i < 6; i++) {
        const current = dates[i];
        const next = dates[i + 1];
        const diffMs = next.getTime() - current.getTime();
        assert.equal(diffMs, 24 * 60 * 60 * 1000, `Day ${i} to Day ${i+1} spacing should be exactly 24 hours`);
      }
    });
  });
});
