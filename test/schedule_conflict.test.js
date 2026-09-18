const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadIndexScriptContext() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/i);

  if (!scriptMatch) {
    throw new Error('Could not find <script> tag in index.html');
  }

  const scriptCode = scriptMatch[1];

  const context = {
    console,
    Math,
    Set,
    Array,
    Object,
    JSON,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    document: {
      addEventListener: () => {},
      getElementById: () => ({
        classList: { toggle: () => {}, add: () => {}, remove: () => {} },
        innerHTML: '',
        style: {},
        appendChild: () => {},
      }),
      createElement: () => ({
        className: '',
        style: {},
        innerHTML: '',
        appendChild: () => {},
      }),
    },
  };

  context.globalThis = context;
  context.window = context;

  vm.createContext(context);
  vm.runInContext(scriptCode, context);

  return context;
}

test('hasScheduleConflict - empty and single task cases', (t) => {
  const ctx = loadIndexScriptContext();

  vm.runInContext('state.tasks = [];', ctx);
  assert.equal(ctx.hasScheduleConflict(), false, 'Empty tasks should not have conflict');

  vm.runInContext(`
    state.tasks = [
      { id: 't1', name: 'Mix dough', day: 0, startSlot: 10, endSlot: 20, passive: false }
    ];
  `, ctx);
  assert.equal(ctx.hasScheduleConflict(), false, 'Single active task should not have conflict');

  vm.runInContext(`
    state.tasks = [
      { id: 't1', name: 'Proofing', day: 0, startSlot: 10, endSlot: 20, passive: true }
    ];
  `, ctx);
  assert.equal(ctx.hasScheduleConflict(), false, 'Single passive task should not have conflict');
});

test('hasScheduleConflict - passive vs active task overlap filtering', (t) => {
  const ctx = loadIndexScriptContext();

  // Active task overlapping with Passive task on same day
  vm.runInContext(`
    state.tasks = [
      { id: 'active1', name: 'Mix dough', day: 0, startSlot: 10, endSlot: 30, passive: false },
      { id: 'passive1', name: 'Bulk ferment', day: 0, startSlot: 20, endSlot: 50, passive: true }
    ];
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    false,
    'Overlapping active and passive tasks should NOT trigger schedule conflict'
  );

  // Passive task overlapping with Passive task on same day
  vm.runInContext(`
    state.tasks = [
      { id: 'passive1', name: 'Bulk ferment', day: 0, startSlot: 10, endSlot: 30, passive: true },
      { id: 'passive2', name: 'Overnight rest', day: 0, startSlot: 20, endSlot: 50, passive: true }
    ];
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    false,
    'Overlapping passive tasks should NOT trigger schedule conflict'
  );
});

test('hasScheduleConflict - active vs active task overlap detection', (t) => {
  const ctx = loadIndexScriptContext();

  // Two active tasks overlapping on same day
  vm.runInContext(`
    state.tasks = [
      { id: 'active1', name: 'Mix dough', day: 1, startSlot: 10, endSlot: 25, passive: false },
      { id: 'active2', name: 'Laminate butter', day: 1, startSlot: 20, endSlot: 35, passive: false }
    ];
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    true,
    'Overlapping active tasks on same day SHOULD trigger schedule conflict'
  );

  // Two active tasks on DIFFERENT days with overlapping time slots
  vm.runInContext(`
    state.tasks = [
      { id: 'active1', name: 'Mix dough', day: 1, startSlot: 10, endSlot: 25, passive: false },
      { id: 'active2', name: 'Laminate butter', day: 2, startSlot: 10, endSlot: 25, passive: false }
    ];
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    false,
    'Active tasks on different days should NOT trigger schedule conflict'
  );

  // Two active tasks on same day with non-overlapping (adjacent) slots
  vm.runInContext(`
    state.tasks = [
      { id: 'active1', name: 'Mix dough', day: 1, startSlot: 10, endSlot: 20, passive: false },
      { id: 'active2', name: 'Shape bagels', day: 1, startSlot: 20, endSlot: 30, passive: false }
    ];
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    false,
    'Adjacent non-overlapping active tasks should NOT trigger schedule conflict'
  );
});

test('hasScheduleConflict - complex mixed active and passive tasks scenario', (t) => {
  const ctx = loadIndexScriptContext();

  // Multiple passive tasks overlapping + active tasks non-overlapping -> false
  vm.runInContext(`
    state.tasks = [
      { id: 'a1', name: 'Mix 1', day: 0, startSlot: 10, endSlot: 20, passive: false },
      { id: 'p1', name: 'Rest 1', day: 0, startSlot: 15, endSlot: 40, passive: true },
      { id: 'p2', name: 'Rest 2', day: 0, startSlot: 18, endSlot: 35, passive: true },
      { id: 'a2', name: 'Mix 2', day: 0, startSlot: 20, endSlot: 30, passive: false }
    ];
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    false,
    'Complex setup with passive overlaps and non-overlapping active tasks should NOT trigger conflict'
  );

  // Add a 3rd active task that overlaps with active task a2
  vm.runInContext(`
    state.tasks.push({ id: 'a3', name: 'Mix 3', day: 0, startSlot: 25, endSlot: 35, passive: false });
  `, ctx);
  assert.equal(
    ctx.hasScheduleConflict(),
    true,
    'Adding overlapping active task to mixed setup SHOULD trigger conflict'
  );
});

test('blocksOverlap - boundary and slot containment edge cases', (t) => {
  const ctx = loadIndexScriptContext();

  // Partial overlap
  assert.equal(
    ctx.blocksOverlap(
      { day: 0, startSlot: 10, endSlot: 20 },
      { day: 0, startSlot: 15, endSlot: 25 }
    ),
    true
  );

  // Complete containment
  assert.equal(
    ctx.blocksOverlap(
      { day: 0, startSlot: 10, endSlot: 30 },
      { day: 0, startSlot: 15, endSlot: 20 }
    ),
    true
  );

  // Adjacent slots (exact boundary) -> no overlap
  assert.equal(
    ctx.blocksOverlap(
      { day: 0, startSlot: 10, endSlot: 20 },
      { day: 0, startSlot: 20, endSlot: 30 }
    ),
    false
  );

  // Different days
  assert.equal(
    ctx.blocksOverlap(
      { day: 0, startSlot: 10, endSlot: 20 },
      { day: 1, startSlot: 10, endSlot: 20 }
    ),
    false
  );
});
