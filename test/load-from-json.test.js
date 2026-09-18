const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createAnalyticsContext() {
  const htmlPath = path.join(__dirname, '..', 'echt-analytics.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract DATA, dataSource, and loadFromJSON definitions
  const loadFromJSONMatch = html.match(/function loadFromJSON[\s\S]*?catch\(e\)\s*\{\s*return false;\s*\}\s*\}/);
  if (!loadFromJSONMatch) {
    throw new Error('loadFromJSON function not found in echt-analytics.html');
  }

  const code = `
    globalThis.DATA = { tasks: [], ovenBlocks: [] };
    globalThis.dataSource = 'none';
    ${loadFromJSONMatch[0]}
  `;

  const context = {};
  vm.runInNewContext(code, context);
  return context;
}

describe('loadFromJSON in echt-analytics.html', () => {
  let ctx;

  beforeEach(() => {
    ctx = createAnalyticsContext();
  });

  test('returns true and populates DATA and dataSource on valid JSON', () => {
    const validJSON = JSON.stringify({
      tasks: [{ id: 1, name: 'Bake Sourdough' }],
      ovenBlocks: [{ id: 101, temp: 450 }]
    });

    const result = ctx.loadFromJSON(validJSON);

    assert.strictEqual(result, true);
    assert.strictEqual(ctx.dataSource, 'imported');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.tasks)), [{ id: 1, name: 'Bake Sourdough' }]);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.ovenBlocks)), [{ id: 101, temp: 450 }]);
  });

  test('defaults tasks and ovenBlocks to empty arrays if missing from valid JSON', () => {
    const validJSON = JSON.stringify({ extra: 'field' });

    const result = ctx.loadFromJSON(validJSON);

    assert.strictEqual(result, true);
    assert.strictEqual(ctx.dataSource, 'imported');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.tasks)), []);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.ovenBlocks)), []);
  });

  test('returns false and retains existing state when given corrupt/invalid JSON string', () => {
    // Set initial state
    ctx.DATA = { tasks: [{ id: 99 }], ovenBlocks: [{ id: 88 }] };
    ctx.dataSource = 'live';

    const corruptJSON = '{ "tasks": [ invalid json }';

    const result = ctx.loadFromJSON(corruptJSON);

    assert.strictEqual(result, false);
    // Verify state was NOT overwritten/corrupted
    assert.strictEqual(ctx.dataSource, 'live');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.tasks)), [{ id: 99 }]);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.ovenBlocks)), [{ id: 88 }]);
  });

  test('returns false and retains state when given null or undefined input', () => {
    ctx.DATA = { tasks: [{ id: 123 }], ovenBlocks: [] };
    ctx.dataSource = 'live';

    assert.strictEqual(ctx.loadFromJSON(undefined), false);
    assert.strictEqual(ctx.loadFromJSON(null), false);

    assert.strictEqual(ctx.dataSource, 'live');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.DATA.tasks)), [{ id: 123 }]);
  });
});
