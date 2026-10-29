const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('renderOvenGantt correctly identifies conflicts using Set lookup', (t) => {
  const htmlPath = path.join(__dirname, '..', 'echt-analytics.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract script content
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'Script block should exist in echt-analytics.html');
  const scriptCode = scriptMatch[1];

  // Mock DOM container
  let innerHTMLOutput = '';
  const mockWrap = {
    set innerHTML(val) {
      innerHTMLOutput = val;
    },
    get innerHTML() {
      return innerHTMLOutput;
    },
    addEventListener: () => {}
  };

  const createDummyEl = () => ({
    set innerHTML(val) {},
    style: {},
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener: () => {}
  });

  const mockDocument = {
    getElementById: (id) => {
      if (id === 'oven-gantt-wrap') return mockWrap;
      return createDummyEl();
    },
    addEventListener: () => {}
  };

  const sandbox = {
    document: mockDocument,
    window: { addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    setInterval: () => {},
    setTimeout: () => {},
    addEventListener: () => {},
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);

  // Set up sample data with 1 conflict directly in VM context
  vm.runInContext(`
    DATA.tasks = [];
    DATA.ovenBlocks = [
      { id: 'b1', name: 'Bake 1', category: 'croissant', day: 0, startSlot: 16, endSlot: 24, temp: '400' },
      { id: 'b2', name: 'Bake 2', category: 'brioche', day: 0, startSlot: 20, endSlot: 28, temp: '350' },
      { id: 'b3', name: 'Bake 3', category: 'bagels', day: 1, startSlot: 16, endSlot: 24, temp: '425' }
    ];
  `, sandbox);

  const ovenConflictsLength = vm.runInContext('computeAll().ovenConflicts.length', sandbox);
  assert.equal(ovenConflictsLength, 1, 'Should detect 1 conflict pair');

  // Execute renderOvenGantt in VM
  vm.runInContext('renderOvenGantt(computeAll())', sandbox);

  assert.ok(innerHTMLOutput.includes('Bake 1'), 'Gantt HTML should include Bake 1');
  assert.ok(innerHTMLOutput.includes('Bake 2'), 'Gantt HTML should include Bake 2');
  assert.ok(innerHTMLOutput.includes('Bake 3'), 'Gantt HTML should include Bake 3');

  // Verify conflict styling is applied to b1 and b2
  assert.ok(innerHTMLOutput.includes('rgba(139,0,0,0.5)'), 'Gantt HTML should contain conflict background color');
});
