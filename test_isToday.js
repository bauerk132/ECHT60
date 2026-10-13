const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/function isToday\(date\) \{[\s\S]*?\n\}/);
if (!match) throw new Error("Could not find isToday function");

const isTodayStr = match[0];
const isToday = new Function(`return ${isTodayStr}`)();

test('isToday returns true for the current date', () => {
    const today = new Date();
    assert.strictEqual(isToday(today), true);
});

test('isToday returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    assert.strictEqual(isToday(yesterday), false);
});

test('isToday returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    assert.strictEqual(isToday(tomorrow), false);
});

test('isToday handles global Date mocking', (t) => {
    const OriginalDate = global.Date;

    // Mock Date to a specific day
    const MOCK_DATE = new OriginalDate('2023-01-15T12:00:00Z');

    global.Date = class extends OriginalDate {
        constructor(...args) {
            if (args.length === 0) {
                return new OriginalDate(MOCK_DATE);
            }
            return new OriginalDate(...args);
        }
    };

    const mockToday = new global.Date();
    assert.strictEqual(isToday(mockToday), true, "mocked today should be true");

    const notToday = new OriginalDate('2023-01-16T12:00:00Z');
    assert.strictEqual(isToday(notToday), false, "not mocked today should be false");

    // restore
    global.Date = OriginalDate;
});
