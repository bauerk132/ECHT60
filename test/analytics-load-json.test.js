const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createAnalyticsContext() {
  const filePath = path.join(__dirname, '..', 'echt-analytics.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Could not find <script> in echt-analytics.html');
  }

  let scriptContent = scriptMatch[1];
  // Convert top-level let declarations for DATA and dataSource to var so they attach to context
  scriptContent = scriptContent
    .replace('let DATA =', 'var DATA =')
    .replace('let dataSource =', 'var dataSource =');

  const context = {
    document: {
      getElementById: () => ({ addEventListener: () => {} }),
      addEventListener: () => {}
    },
    window: {
      addEventListener: () => {}
    },
    console: console,
    setTimeout: () => {},
    clearTimeout: () => {},
    setInterval: () => {},
  };

  vm.createContext(context);
  vm.runInContext(scriptContent, context);

  return context;
}

describe('loadFromJSON in echt-analytics.html', () => {
  let context;

  beforeEach(() => {
    context = createAnalyticsContext();
  });

  describe('Valid JSON handling', () => {
    it('should successfully load valid JSON and update state', () => {
      const payload = {
        tasks: [{ id: 1, name: 'Bake Bread' }],
        ovenBlocks: [{ id: 1, name: 'Preheat' }]
      };
      const jsonString = JSON.stringify(payload);

      const result = context.loadFromJSON(jsonString);

      assert.equal(result, true);
      const data = JSON.parse(JSON.stringify(context.DATA));
      assert.deepEqual(data.tasks, payload.tasks);
      assert.deepEqual(data.ovenBlocks, payload.ovenBlocks);
      assert.equal(context.dataSource, 'imported');
    });

    it('should default missing tasks or ovenBlocks to empty arrays', () => {
      const payload = {};
      const jsonString = JSON.stringify(payload);

      const result = context.loadFromJSON(jsonString);

      assert.equal(result, true);
      const data = JSON.parse(JSON.stringify(context.DATA));
      assert.deepEqual(data.tasks, []);
      assert.deepEqual(data.ovenBlocks, []);
      assert.equal(context.dataSource, 'imported');
    });
  });

  describe('Corrupt / Invalid JSON handling', () => {
    it('should return false and preserve previous state when given malformed JSON', () => {
      // Set initial state
      context.DATA = { tasks: [{ id: 99, name: 'Existing Task' }], ovenBlocks: [] };
      context.dataSource = 'live';

      const invalidJson = '{ bad json: true, ';
      const result = context.loadFromJSON(invalidJson);

      assert.equal(result, false);
      const data = JSON.parse(JSON.stringify(context.DATA));
      assert.deepEqual(data, { tasks: [{ id: 99, name: 'Existing Task' }], ovenBlocks: [] });
      assert.equal(context.dataSource, 'live');
    });

    it('should return false and preserve state when given non-string or invalid input', () => {
      context.DATA = { tasks: [], ovenBlocks: [] };
      context.dataSource = 'none';

      assert.equal(context.loadFromJSON('{'), false);
      assert.equal(context.loadFromJSON('undefined'), false);
      assert.equal(context.loadFromJSON(''), false);

      const data = JSON.parse(JSON.stringify(context.DATA));
      assert.deepEqual(data, { tasks: [], ovenBlocks: [] });
      assert.equal(context.dataSource, 'none');
    });
  });
});
