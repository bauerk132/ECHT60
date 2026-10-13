import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

describe('Storage unit tests (saveState & loadState)', () => {
  let context;

  beforeEach(() => {
    const html = fs.readFileSync('index.html', 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    const scriptCode = scriptMatch ? scriptMatch[1] : '';

    const store = {};
    const mockLocalStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };

    context = {
      localStorage: mockLocalStorage,
      console,
      JSON,
      Math,
      String,
      Array,
      Object,
      Date,
      document: {
        addEventListener: () => {},
        getElementById: () => ({
          addEventListener: () => {},
          value: '',
          innerText: '',
          style: {}
        }),
        querySelectorAll: () => [],
        querySelector: () => null,
        createElement: () => ({
          style: {},
          appendChild: () => {},
          addEventListener: () => {}
        })
      },
      window: {
        addEventListener: () => {}
      }
    };

    vm.createContext(context);
    vm.runInContext(scriptCode, context);
  });

  test('saveState successfully persists state.tasks and state.ovenBlocks to localStorage', () => {
    const getState = () => vm.runInContext('state', context);
    const saveState = () => vm.runInContext('saveState()', context);

    const state = getState();
    state.tasks = [{ id: 'task-1', name: 'Sourdough' }];
    state.ovenBlocks = [{ id: 'oven-1', name: 'Bake Batch 1' }];

    saveState();

    const storedRaw = context.localStorage.getItem('echt_bakery_v2');
    assert.ok(storedRaw, 'Expected data to be stored in localStorage');

    const storedData = JSON.parse(storedRaw);
    assert.deepEqual(storedData.tasks, [{ id: 'task-1', name: 'Sourdough' }]);
    assert.deepEqual(storedData.ovenBlocks, [{ id: 'oven-1', name: 'Bake Batch 1' }]);
  });

  test('saveState handles local storage quota limit (QuotaExceededError) gracefully without throwing', () => {
    const getState = () => vm.runInContext('state', context);
    const saveState = () => vm.runInContext('saveState()', context);

    const state = getState();
    state.tasks = [{ id: 'task-1', name: 'Large Batch' }];

    // Mock localStorage.setItem to throw a QuotaExceededError DOMException
    context.localStorage.setItem = () => {
      const err = new Error('QuotaExceededError: The quota has been exceeded.');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    };

    assert.doesNotThrow(() => {
      saveState();
    }, 'saveState should catch QuotaExceededError and not throw');
  });

  test('loadState restores state.tasks and state.ovenBlocks from localStorage', () => {
    const getState = () => vm.runInContext('state', context);
    const loadState = () => vm.runInContext('loadState()', context);

    const mockState = {
      tasks: [{ id: 't1', name: 'Croissants' }],
      ovenBlocks: [{ id: 'o1', name: 'Deck Oven 1' }]
    };
    context.localStorage.setItem('echt_bakery_v2', JSON.stringify(mockState));

    const state = getState();
    state.tasks = [];
    state.ovenBlocks = [];

    loadState();

    assert.deepEqual(state.tasks, mockState.tasks);
    assert.deepEqual(state.ovenBlocks, mockState.ovenBlocks);
  });

  test('loadState handles getItem throwing an error gracefully without throwing', () => {
    const loadState = () => vm.runInContext('loadState()', context);

    context.localStorage.getItem = () => {
      throw new Error('SecurityError: Access is denied for localStorage');
    };

    assert.doesNotThrow(() => {
      loadState();
    }, 'loadState should catch getItem error and not throw');
  });

  test('loadState handles corrupted / invalid JSON in localStorage gracefully without throwing', () => {
    const loadState = () => vm.runInContext('loadState()', context);

    context.localStorage.setItem('echt_bakery_v2', 'corrupted-invalid-json-{');

    assert.doesNotThrow(() => {
      loadState();
    }, 'loadState should catch JSON parse error and not throw');
  });
});
