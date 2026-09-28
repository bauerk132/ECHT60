const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setupEnvironment() {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) throw new Error('Script tag not found in index.html');

  const elements = {};
  function createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      dataset: {},
      children: [],
      classList: new Set(),
      listeners: {},
      style: {},
      innerHTML: '',
      textContent: '',
      querySelector(sel) {
        return createElement('div');
      },
      querySelectorAll(sel) { return []; },
      addEventListener(evt, handler) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(handler);
      },
      dispatchEvent(evt) {
        const handlers = this.listeners[evt.type] || [];
        for (const h of handlers) h(evt);
      },
      appendChild(child) { this.children.push(child); return child; },
      remove() {},
      closest(sel) {
        if (sel === '.time-cell' && this.classList.has('time-cell')) return this;
        return null;
      }
    };
    el.classList.add = (cls) => Set.prototype.add.call(el.classList, cls);
    el.classList.toggle = (cls, force) => {
      if (force) el.classList.add(cls);
      else el.classList.delete(cls);
    };
    return el;
  }

  const document = {
    addEventListener(evt, fn) {},
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = createElement('div');
        elements[id].id = id;
      }
      return elements[id];
    },
    querySelector(sel) { return createElement('div'); },
    querySelectorAll(sel) { return []; },
    createElement
  };

  const window = {
    document,
    localStorage: { getItem() { return null; }, setItem() {} },
    setInterval() {},
    setTimeout() {},
    addEventListener() {}
  };

  const sandbox = {
    window,
    document,
    localStorage: window.localStorage,
    setInterval: window.setInterval,
    setTimeout: window.setTimeout,
    Date,
    Math,
    Object,
    Array,
    parseInt,
    String,
    Set,
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(scriptMatch[1], sandbox);

  return { sandbox, elements, document };
}

test('updateCategoryCounts correctly aggregates task and oven block categories', () => {
  const { sandbox, document } = setupEnvironment();

  vm.runInContext(`
    state.tasks = [
      { id: '1', category: 'croissant' },
      { id: '2', category: 'croissant' },
      { id: '3', category: 'bagels' }
    ];
    state.ovenBlocks = [
      { id: '4', category: 'croissant' },
      { id: '5', category: 'bagels' }
    ];
    updateCategoryCounts();
  `, sandbox);

  const croissantEl = document.getElementById('cat-count-croissant');
  const bagelsEl = document.getElementById('cat-count-bagels');
  const sourdoughEl = document.getElementById('cat-count-sourdough');

  assert.equal(croissantEl.textContent, 3);
  assert.equal(bagelsEl.textContent, 2);
  assert.equal(sourdoughEl.textContent, '');
});

test('renderOven caches conflict IDs to avoid redundant computation', () => {
  const { sandbox } = setupEnvironment();

  vm.runInContext(`
    state.ovenBlocks = [
      { id: 'a', day: 0, startSlot: 10, endSlot: 20 },
      { id: 'b', day: 0, startSlot: 15, endSlot: 25 }
    ];
    renderOven();
  `, sandbox);

  const lastConflictIds = vm.runInContext('lastOvenConflictIds', sandbox);
  assert.equal(lastConflictIds.size, 2);
  assert.ok(lastConflictIds.has('a'));
  assert.ok(lastConflictIds.has('b'));
});

test('event delegation on schedule grid handles cell clicks without adding listeners to every cell', () => {
  const { sandbox, document } = setupEnvironment();

  vm.runInContext(`
    state.tasks = [];
    renderSchedule();
  `, sandbox);

  const grid = document.getElementById('schedule-grid');
  assert.equal(grid.dataset.cellClickBound, 'true');
  assert.ok(grid.listeners['click'] && grid.listeners['click'].length > 0);
});
