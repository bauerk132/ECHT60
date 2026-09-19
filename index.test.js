const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const test = require('node:test');

// Read and extract script from index.html
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
    throw new Error('Could not find <script> tag in index.html');
}
const scriptContent = scriptMatch[1];

// Set up mock context to avoid DOM errors
const context = vm.createContext({
    document: {
        addEventListener: () => {},
        getElementById: () => ({ addEventListener: () => {}, classList: {remove: () => {}} })
    },
    window: {},
    localStorage: { getItem: () => null, setItem: () => {} },
    console: console,
    setTimeout: setTimeout,
    setInterval: setInterval
});

// Run script in context
vm.runInContext(scriptContent, context);

// Extract function, hardcode SLOT_HEIGHT because const declarations aren't added to vm context object
const slotToY = context.slotToY;
const SLOT_HEIGHT = 20;

test('slotToY function', async (t) => {
    await t.test('calculates correct Y coordinate for whole slots', () => {
        assert.strictEqual(slotToY(0), 0, 'Slot 0 should be 0');
        assert.strictEqual(slotToY(1), SLOT_HEIGHT, 'Slot 1 should be 1 * SLOT_HEIGHT');
        assert.strictEqual(slotToY(5), 5 * SLOT_HEIGHT, 'Slot 5 should be 5 * SLOT_HEIGHT');
    });

    await t.test('calculates correct Y coordinate for fractional slots', () => {
        assert.strictEqual(slotToY(1.5), 1.5 * SLOT_HEIGHT, 'Slot 1.5 should be 1.5 * SLOT_HEIGHT');
        assert.strictEqual(slotToY(0.25), 0.25 * SLOT_HEIGHT, 'Slot 0.25 should be 0.25 * SLOT_HEIGHT');
    });

    await t.test('calculates correct Y coordinate for negative slots', () => {
        assert.strictEqual(slotToY(-1), -1 * SLOT_HEIGHT, 'Slot -1 should be -1 * SLOT_HEIGHT');
        assert.strictEqual(slotToY(-2.5), -2.5 * SLOT_HEIGHT, 'Slot -2.5 should be -2.5 * SLOT_HEIGHT');
    });

    await t.test('handles edge case inputs', () => {
        assert.ok(Number.isNaN(slotToY(undefined)), 'undefined input should return NaN');
        assert.strictEqual(slotToY(null), 0, 'null input should evaluate to 0 in math');
        assert.strictEqual(slotToY("5"), 5 * SLOT_HEIGHT, 'string number should be coerced');
        assert.ok(Number.isNaN(slotToY("invalid")), 'invalid string should return NaN');
    });
});
