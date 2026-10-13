const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

// Extract script from echt-analytics.html
const html = fs.readFileSync('echt-analytics.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'Script block found in echt-analytics.html');

const scriptContent = scriptMatch[1];

const domStub = `
const document = {
  getElementById: () => ({
    addEventListener: () => {},
    style: {},
    innerHTML: '',
    textContent: ''
  }),
  addEventListener: () => {}
};
const window = {
  addEventListener: () => {},
  devicePixelRatio: 1
};
const localStorage = {
  getItem: () => null
};
`;

const evalCode = domStub + '\n' + scriptContent + `
module.exports = { DATA, computeAll };
`;

const mod = { exports: {} };
const fn = new Function('module', 'exports', evalCode);
fn(mod, mod.exports);

const { DATA, computeAll } = mod.exports;

test('computeAll computes basic totals accurately in single pass', () => {
  DATA.tasks = [
    { id: 't1', day: 0, startSlot: 4, endSlot: 8, passive: false, category: 'croissant' }, // 1h active = 60 min
    { id: 't2', day: 0, startSlot: 8, endSlot: 12, passive: true, category: 'croissant' },  // 1h passive = 60 min
    { id: 't3', day: 1, startSlot: 0, endSlot: 2, passive: false, category: 'bagels' }     // 30m active = 30 min
  ];
  DATA.ovenBlocks = [
    { id: 'o1', day: 0, startSlot: 4, endSlot: 8, category: 'croissant' } // 1h oven = 60 min
  ];

  const res = computeAll();

  assert.strictEqual(res.activeMin, 90, 'activeMin should equal 90 minutes');
  assert.strictEqual(res.passiveMin, 60, 'passiveMin should equal 60 minutes');
  assert.strictEqual(res.totalTaskMin, 150, 'totalTaskMin should equal 150 minutes');
  assert.strictEqual(res.ovenMin, 60, 'ovenMin should equal 60 minutes');
});
