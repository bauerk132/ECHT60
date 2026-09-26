import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createEnvironment(initialStore = {}) {
  const store = { ...initialStore };

  const mockLocalStorage = {
    store,
    throwOnGet: false,
    throwOnSet: false,
    getItem(key) {
      if (this.throwOnGet) {
        throw new Error('Storage getItem error');
      }
      return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    },
    setItem(key, value) {
      if (this.throwOnSet) {
        throw new Error('QuotaExceededError');
      }
      this.store[key] = String(value);
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      for (const k in this.store) {
        delete this.store[k];
      }
    },
  };

  const html = fs.readFileSync('index.html', 'utf8');
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/i)[1];

  const sandbox = {
    localStorage: mockLocalStorage,
    document: {
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    window: {
      addEventListener: () => {},
    },
    console,
    setTimeout: () => {},
    setInterval: () => {},
    Math,
    JSON,
    Date,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(scriptContent, context);

  return {
    context,
    mockLocalStorage,
    run: (code) => vm.runInContext(code, context),
    getState: () => JSON.parse(JSON.stringify(vm.runInContext('state', context))),
    saveState: () => vm.runInContext('saveState()', context),
    loadState: () => vm.runInContext('loadState()', context),
  };
}

describe('Local Storage Serialization (saveState & loadState)', () => {
  describe('saveState', () => {
    test('serializes state.tasks and state.ovenBlocks to localStorage key echt_bakery_v2', () => {
      const env = createEnvironment();
      env.run(`
        state.tasks = [
          { id: 'task-1', name: 'Sourdough Mixing', category: 'sourdough', day: 1, startSlot: 20, endSlot: 24, passive: false, notes: 'Use warm water' }
        ];
        state.ovenBlocks = [
          { id: 'oven-1', name: 'Bake Country Loaf', category: 'sourdough', day: 1, startSlot: 28, endSlot: 32, temp: 240, notes: 'Steam for 20m' }
        ];
        saveState();
      `);

      const storedRaw = env.mockLocalStorage.store['echt_bakery_v2'];
      assert.ok(storedRaw, 'echt_bakery_v2 should exist in localStorage');

      const parsed = JSON.parse(storedRaw);
      assert.deepEqual(parsed, {
        tasks: [
          { id: 'task-1', name: 'Sourdough Mixing', category: 'sourdough', day: 1, startSlot: 20, endSlot: 24, passive: false, notes: 'Use warm water' }
        ],
        ovenBlocks: [
          { id: 'oven-1', name: 'Bake Country Loaf', category: 'sourdough', day: 1, startSlot: 28, endSlot: 32, temp: 240, notes: 'Steam for 20m' }
        ]
      });
    });

    test('handles empty tasks and ovenBlocks correctly', () => {
      const env = createEnvironment();
      env.run(`
        state.tasks = [];
        state.ovenBlocks = [];
        saveState();
      `);

      const storedRaw = env.mockLocalStorage.store['echt_bakery_v2'];
      assert.ok(storedRaw);
      const parsed = JSON.parse(storedRaw);
      assert.deepEqual(parsed, { tasks: [], ovenBlocks: [] });
    });

    test('catches and handles localStorage.setItem exceptions gracefully', () => {
      const env = createEnvironment();
      env.mockLocalStorage.throwOnSet = true;

      assert.doesNotThrow(() => {
        env.run(`
          state.tasks = [{ id: 't1', name: 'Test Task' }];
          saveState();
        `);
      });
    });
  });

  describe('loadState', () => {
    test('loads tasks and ovenBlocks from localStorage key echt_bakery_v2', () => {
      const savedData = {
        tasks: [
          { id: 't100', name: 'Croissant Laminating', category: 'pastry', day: 2, startSlot: 16, endSlot: 20, passive: true, notes: '' }
        ],
        ovenBlocks: [
          { id: 'o100', name: 'Bake Croissants', category: 'pastry', day: 2, startSlot: 22, endSlot: 26, temp: 200, notes: '' }
        ]
      };

      const env = createEnvironment({
        'echt_bakery_v2': JSON.stringify(savedData)
      });

      env.loadState();
      const state = env.getState();

      assert.deepEqual(state.tasks, savedData.tasks);
      assert.deepEqual(state.ovenBlocks, savedData.ovenBlocks);
    });

    test('handles non-existent key in localStorage gracefully', () => {
      const env = createEnvironment({}); // empty localStorage

      env.run(`
        state.tasks = [{ id: 'existing-task' }];
        state.ovenBlocks = [{ id: 'existing-oven' }];
      `);

      env.loadState();
      const state = env.getState();

      // Non-existent key means raw is null, so state remains unchanged
      assert.deepEqual(state.tasks, [{ id: 'existing-task' }]);
      assert.deepEqual(state.ovenBlocks, [{ id: 'existing-oven' }]);
    });

    test('defaults tasks or ovenBlocks to empty array if missing in stored object', () => {
      const envTasksOnly = createEnvironment({
        'echt_bakery_v2': JSON.stringify({ tasks: [{ id: 't1' }] })
      });
      envTasksOnly.loadState();
      assert.deepEqual(envTasksOnly.getState().tasks, [{ id: 't1' }]);
      assert.deepEqual(envTasksOnly.getState().ovenBlocks, []);

      const envOvenOnly = createEnvironment({
        'echt_bakery_v2': JSON.stringify({ ovenBlocks: [{ id: 'o1' }] })
      });
      envOvenOnly.loadState();
      assert.deepEqual(envOvenOnly.getState().tasks, []);
      assert.deepEqual(envOvenOnly.getState().ovenBlocks, [{ id: 'o1' }]);

      const envEmptyObject = createEnvironment({
        'echt_bakery_v2': JSON.stringify({})
      });
      envEmptyObject.loadState();
      assert.deepEqual(envEmptyObject.getState().tasks, []);
      assert.deepEqual(envEmptyObject.getState().ovenBlocks, []);
    });

    test('catches and handles JSON syntax error gracefully', () => {
      const env = createEnvironment({
        'echt_bakery_v2': 'invalid json string {{{'
      });

      env.run(`
        state.tasks = [{ id: 'safe-task' }];
        state.ovenBlocks = [{ id: 'safe-oven' }];
      `);

      assert.doesNotThrow(() => {
        env.loadState();
      });

      // State remains unchanged because JSON parse threw and was caught
      const state = env.getState();
      assert.deepEqual(state.tasks, [{ id: 'safe-task' }]);
      assert.deepEqual(state.ovenBlocks, [{ id: 'safe-oven' }]);
    });

    test('catches and handles localStorage.getItem exception gracefully', () => {
      const env = createEnvironment({});
      env.mockLocalStorage.throwOnGet = true;

      env.run(`
        state.tasks = [{ id: 'safe-task' }];
      `);

      assert.doesNotThrow(() => {
        env.loadState();
      });

      assert.deepEqual(env.getState().tasks, [{ id: 'safe-task' }]);
    });
  });

  describe('Round-trip serialization', () => {
    test('preserves tasks and ovenBlocks through save and load cycle', () => {
      const env = createEnvironment();

      const initialTasks = [
        { id: 'rt-1', name: 'Brioche Dough', category: 'pastry', day: 3, startSlot: 10, endSlot: 18, passive: true, notes: 'Cold ferment' },
        { id: 'rt-2', name: 'Shape Brioche', category: 'pastry', day: 4, startSlot: 20, endSlot: 24, passive: false, notes: '' }
      ];
      const initialOvenBlocks = [
        { id: 'rt-o1', name: 'Bake Brioche', category: 'pastry', day: 4, startSlot: 26, endSlot: 30, temp: 180, notes: 'Egg wash before baking' }
      ];

      env.run(`
        state.tasks = ${JSON.stringify(initialTasks)};
        state.ovenBlocks = ${JSON.stringify(initialOvenBlocks)};
        saveState();
      `);

      // Clear state in memory
      env.run(`
        state.tasks = [];
        state.ovenBlocks = [];
      `);
      assert.deepEqual(env.getState().tasks, []);
      assert.deepEqual(env.getState().ovenBlocks, []);

      // Reload state from localStorage
      env.loadState();

      assert.deepEqual(env.getState().tasks, initialTasks);
      assert.deepEqual(env.getState().ovenBlocks, initialOvenBlocks);
    });
  });
});
