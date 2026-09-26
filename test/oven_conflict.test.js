const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert');

function setupEnvironment() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptContent = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

  const domMock = {
    document: {
      addEventListener: () => {},
      getElementById: () => ({ addEventListener: () => {}, querySelectorAll: () => [] }),
      querySelectorAll: () => []
    },
    window: {},
    localStorage: { getItem: () => null, setItem: () => {} }
  };
  domMock.window = domMock;

  const context = vm.createContext(domMock);
  vm.runInContext(scriptContent, context);

  return context;
}

test('getOvenConflictIds - returns empty Set when ovenBlocks is empty', () => {
  const ctx = setupEnvironment();
  const state = vm.runInContext('state', ctx);
  state.ovenBlocks = [];

  const conflicts = vm.runInContext('getOvenConflictIds()', ctx);
  assert.strictEqual(conflicts.size, 0);
});

test('getOvenConflictIds - returns empty Set for single oven block', () => {
  const ctx = setupEnvironment();
  const state = vm.runInContext('state', ctx);
  state.ovenBlocks = [
    { id: 'b1', name: 'Bake 1', day: 0, startSlot: 10, endSlot: 20 }
  ];

  const conflicts = vm.runInContext('getOvenConflictIds()', ctx);
  assert.strictEqual(conflicts.size, 0);
});

test('getOvenConflictIds - returns empty Set when blocks overlap in time but are on different days', () => {
  const ctx = setupEnvironment();
  const state = vm.runInContext('state', ctx);
  state.ovenBlocks = [
    { id: 'b1', name: 'Bake 1', day: 0, startSlot: 10, endSlot: 20 },
    { id: 'b2', name: 'Bake 2', day: 1, startSlot: 10, endSlot: 20 }
  ];

  const conflicts = vm.runInContext('getOvenConflictIds()', ctx);
  assert.strictEqual(conflicts.size, 0);
});

test('getOvenConflictIds - returns empty Set for non-overlapping blocks on the same day including adjacent blocks', () => {
  const ctx = setupEnvironment();
  const state = vm.runInContext('state', ctx);
  state.ovenBlocks = [
    { id: 'b1', name: 'Bake 1', day: 2, startSlot: 10, endSlot: 20 },
    { id: 'b2', name: 'Bake 2', day: 2, startSlot: 20, endSlot: 30 }, // adjacent (startSlot == endSlot)
    { id: 'b3', name: 'Bake 3', day: 2, startSlot: 35, endSlot: 40 }
  ];

  const conflicts = vm.runInContext('getOvenConflictIds()', ctx);
  assert.strictEqual(conflicts.size, 0);
});

test('getOvenConflictIds - identifies overlapping oven blocks on the same day', () => {
  const ctx = setupEnvironment();
  const state = vm.runInContext('state', ctx);
  state.ovenBlocks = [
    { id: 'b1', name: 'Bake 1', day: 1, startSlot: 10, endSlot: 25 },
    { id: 'b2', name: 'Bake 2', day: 1, startSlot: 20, endSlot: 30 }
  ];

  const conflicts = vm.runInContext('getOvenConflictIds()', ctx);
  assert.strictEqual(conflicts.size, 2);
  assert.ok(conflicts.has('b1'));
  assert.ok(conflicts.has('b2'));
});

test('getOvenConflictIds - identifies specific conflicting blocks among non-conflicting ones across days', () => {
  const ctx = setupEnvironment();
  const state = vm.runInContext('state', ctx);
  state.ovenBlocks = [
    // Day 0: Overlapping pair
    { id: 'b1', name: 'Bake 1', day: 0, startSlot: 10, endSlot: 20 },
    { id: 'b2', name: 'Bake 2', day: 0, startSlot: 15, endSlot: 25 },
    // Day 0: Non-overlapping block
    { id: 'b3', name: 'Bake 3', day: 0, startSlot: 30, endSlot: 40 },
    // Day 1: Overlapping pair
    { id: 'b4', name: 'Bake 4', day: 1, startSlot: 10, endSlot: 30 },
    { id: 'b5', name: 'Bake 5', day: 1, startSlot: 25, endSlot: 35 },
    // Day 2: Single block
    { id: 'b6', name: 'Bake 6', day: 2, startSlot: 10, endSlot: 20 }
  ];

  const conflicts = vm.runInContext('getOvenConflictIds()', ctx);
  assert.strictEqual(conflicts.size, 4);
  assert.ok(conflicts.has('b1'));
  assert.ok(conflicts.has('b2'));
  assert.ok(!conflicts.has('b3'));
  assert.ok(conflicts.has('b4'));
  assert.ok(conflicts.has('b5'));
  assert.ok(!conflicts.has('b6'));
});
