const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert');

const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/function blocksOverlap\s*\([^)]*\)\s*\{([\s\S]*?)\}/);

if (!match) {
    throw new Error("Could not find blocksOverlap in index.html");
}

const blocksOverlap = new Function('a', 'b', match[1]);

test('blocksOverlap logic', async (t) => {
    await t.test('different days never overlap', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 10, endSlot: 20 }, { day: 1, startSlot: 10, endSlot: 20 }), false);
    });

    await t.test('same day, no overlap (b after a)', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 10, endSlot: 20 }, { day: 0, startSlot: 20, endSlot: 30 }), false);
    });

    await t.test('same day, no overlap (b before a)', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 20, endSlot: 30 }, { day: 0, startSlot: 10, endSlot: 20 }), false);
    });

    await t.test('same day, exact same time', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 10, endSlot: 20 }, { day: 0, startSlot: 10, endSlot: 20 }), true);
    });

    await t.test('same day, partial overlap (b starts during a)', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 10, endSlot: 20 }, { day: 0, startSlot: 15, endSlot: 25 }), true);
    });

    await t.test('same day, partial overlap (a starts during b)', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 15, endSlot: 25 }, { day: 0, startSlot: 10, endSlot: 20 }), true);
    });

    await t.test('same day, one inside another', () => {
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 10, endSlot: 30 }, { day: 0, startSlot: 15, endSlot: 20 }), true);
        assert.strictEqual(blocksOverlap({ day: 0, startSlot: 15, endSlot: 20 }, { day: 0, startSlot: 10, endSlot: 30 }), true);
    });
});
