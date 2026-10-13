const fs = require('fs');
const test = require('node:test');
const assert = require('node:assert');

const html = fs.readFileSync('index.html', 'utf8');

// Use a more robust regex to extract the exact loadState function
const loadStateMatch = html.match(/(function loadState\(\) \{[\s\S]*?try \{[\s\S]*?\} catch\(e\) \{\}\n\})/);

if (!loadStateMatch) {
  console.error("Could not find loadState function");
  process.exit(1);
}

const loadStateFnString = loadStateMatch[1];

test('loadState handles JSON parse error', () => {
  // Let's create our test environment and run the function
  let state = {
    tasks: [{ id: 1 }],
    ovenBlocks: [{ id: 2 }]
  };

  let getItemMock = () => '{invalid json}';

  const localStorage = {
    getItem: (key) => getItemMock(key)
  };

  // Wrap the function in a closure that provides the dependencies
  const testFn = new Function('state', 'localStorage', `${loadStateFnString}\nreturn loadState;`);
  const loadState = testFn(state, localStorage);

  // 1. Test error path (invalid JSON)
  loadState();
  assert.deepStrictEqual(state.tasks, [{ id: 1 }]);
  assert.deepStrictEqual(state.ovenBlocks, [{ id: 2 }]);

  // 2. Test missing properties path
  getItemMock = () => '{}';
  loadState();
  assert.deepStrictEqual(state.tasks, []);
  assert.deepStrictEqual(state.ovenBlocks, []);

  // 3. Test success path
  getItemMock = () => '{"tasks": [{"id": 3}], "ovenBlocks": [{"id": 4}]}';
  loadState();
  assert.deepStrictEqual(state.tasks, [{ id: 3 }]);
  assert.deepStrictEqual(state.ovenBlocks, [{ id: 4 }]);

  // 4. Test missing item
  state.tasks = [{ id: 5 }];
  state.ovenBlocks = [{ id: 6 }];
  getItemMock = () => null;
  loadState();
  assert.deepStrictEqual(state.tasks, [{ id: 5 }]);
  assert.deepStrictEqual(state.ovenBlocks, [{ id: 6 }]);
});
