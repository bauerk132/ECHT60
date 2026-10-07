const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

function createMockElement(tagName = 'div', id = '') {
  const children = [];
  const eventListeners = {};
  const dataset = {};
  const classList = new Set();

  let _innerHTML = '';

  const element = {
    tagName: tagName.toUpperCase(),
    id,
    dataset,
    style: {},
    children,
    _cellClickAttached: false,
    get className() {
      return Array.from(classList).join(' ');
    },
    set className(val) {
      classList.clear();
      if (val) {
        val.trim().split(/\s+/).forEach(c => classList.add(c));
      }
    },
    classList: {
      add: (...cls) => cls.forEach(c => classList.add(c)),
      remove: (...cls) => cls.forEach(c => classList.delete(c)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classList.has(c)) classList.delete(c);
          else classList.add(c);
        } else if (force) {
          classList.add(c);
        } else {
          classList.delete(c);
        }
      },
      contains: (c) => classList.has(c),
    },
    get innerHTML() {
      return _innerHTML;
    },
    set innerHTML(html) {
      _innerHTML = html;
      children.length = 0;
      const tagMatches = html.match(/<([a-z0-9]+)[^>]*>/gi);
      if (tagMatches) {
        tagMatches.forEach(tagStr => {
          const tagMatch = tagStr.match(/<([a-z0-9]+)/i);
          if (!tagMatch) return;
          const tag = tagMatch[1];
          if (tag.toLowerCase() === 'span' || tag.toLowerCase() === 'div' || tag.toLowerCase() === 'button') {
            const childEl = createMockElement(tag);
            const classMatch = tagStr.match(/class="([^"]+)"/);
            if (classMatch) {
              childEl.className = classMatch[1];
            }
            const idMatch = tagStr.match(/id="([^"]+)"/);
            if (idMatch) childEl.id = idMatch[1];
            childEl.parentNode = element;
            children.push(childEl);
          }
        });
      }
    },
    textContent: '',
    appendChild: (child) => {
      if (child.nodeType === 11) { // DocumentFragment
        const fragChildren = [...(child.children || [])];
        fragChildren.forEach(c => {
          c.parentNode = element;
          children.push(c);
        });
        if (child.children) child.children.length = 0;
      } else {
        child.parentNode = element;
        children.push(child);
      }
      return child;
    },
    querySelector: (selector) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        return findChild(element, el => el.classList && el.classList.contains(cls));
      }
      return null;
    },
    querySelectorAll: (selector) => {
      const results = [];
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        findAllChildren(element, el => el.classList && el.classList.contains(cls), results);
      }
      return results;
    },
    addEventListener: (event, handler) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(h => h !== handler);
      }
    },
    dispatchEvent: (event) => {
      if (eventListeners[event.type]) {
        eventListeners[event.type].forEach(h => h(event));
      }
    },
    closest: (selector) => {
      let curr = element;
      while (curr) {
        if (selector.startsWith('.') && curr.classList && curr.classList.contains(selector.slice(1))) {
          return curr;
        }
        curr = curr.parentNode || null;
      }
      return null;
    },
    contains: (child) => {
      let curr = child;
      while (curr) {
        if (curr === element) return true;
        curr = curr.parentNode;
      }
      return false;
    },
    getBoundingClientRect: () => ({ width: 1000, height: 800, top: 0, left: 0 }),
  };

  return element;
}

function findChild(parent, predicate) {
  for (const child of parent.children) {
    if (predicate(child)) return child;
    const found = findChild(child, predicate);
    if (found) return found;
  }
  return null;
}

function findAllChildren(parent, predicate, results) {
  for (const child of parent.children) {
    if (predicate(child)) results.push(child);
    findAllChildren(child, predicate, results);
  }
}

function createDocumentFragmentMock() {
  const children = [];
  return {
    nodeType: 11,
    children,
    appendChild: (child) => {
      children.push(child);
      return child;
    },
  };
}

function setupContext() {
  const elements = {
    'schedule-grid-container': createMockElement('div', 'schedule-grid-container'),
    'schedule-grid': createMockElement('div', 'schedule-grid'),
    'schedule-conflict-banner': createMockElement('div', 'schedule-conflict-banner'),
    'oven-grid-container': createMockElement('div', 'oven-grid-container'),
    'oven-grid': createMockElement('div', 'oven-grid'),
    'oven-conflict-banner': createMockElement('div', 'oven-conflict-banner'),
    'category-list': createMockElement('div', 'category-list'),
    'toast': createMockElement('div', 'toast'),
  };

  const documentMock = {
    getElementById: (id) => elements[id] || createMockElement('div', id),
    createElement: (tagName) => createMockElement(tagName),
    createDocumentFragment: () => createDocumentFragmentMock(),
    addEventListener: () => {},
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {} },
    setInterval: () => {},
    setTimeout: (fn) => fn(),
  };

  const context = vm.createContext({
    document: documentMock,
    window: windowMock,
    localStorage: windowMock.localStorage,
    console,
    Math,
    Date,
    Array,
    Object,
    parseInt,
    parseFloat,
    String,
    Set,
    clearTimeout: () => {},
    setTimeout: (fn) => fn(),
    setInterval: () => {},
  });

  const html = fs.readFileSync('index.html', 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) throw new Error('Script tag not found');

  vm.runInContext(scriptMatch[1], context);

  function run(code) {
    return vm.runInContext(code, context);
  }

  return { context, elements, run };
}

test('getOvenConflictIds detects overlapping blocks', () => {
  const { run } = setupContext();
  run(`
    state.ovenBlocks = [
      { id: 'b1', day: 0, startSlot: 10, endSlot: 20 },
      { id: 'b2', day: 0, startSlot: 15, endSlot: 25 },
      { id: 'b3', day: 1, startSlot: 10, endSlot: 20 },
    ];
  `);

  const conflicts = run('getOvenConflictIds()');
  assert.strictEqual(conflicts.has('b1'), true);
  assert.strictEqual(conflicts.has('b2'), true);
  assert.strictEqual(conflicts.has('b3'), false);
});

test('renderTaskBlocks renders task blocks into schedule grid', () => {
  const { run, elements } = setupContext();
  run(`
    state.tasks = [
      { id: 't1', name: 'Task 1', category: 'croissant', day: 0, startSlot: 10, endSlot: 20, passive: false, notes: '' },
      { id: 't2', name: 'Task 2', category: 'bagels', day: 1, startSlot: 10, endSlot: 20, passive: true, notes: '' },
    ];
    renderSchedule();
  `);

  const grid = elements['schedule-grid'];
  const taskBlocks = grid.querySelectorAll('.task-block');
  assert.strictEqual(taskBlocks.length, 2);
});

test('renderOven renders oven blocks and detects conflict banners', () => {
  const { run, elements } = setupContext();
  run(`
    state.ovenBlocks = [
      { id: 'o1', name: 'Bake 1', category: 'croissant', day: 0, startSlot: 10, endSlot: 20, temp: 400, notes: '' },
      { id: 'o2', name: 'Bake 2', category: 'bagels', day: 0, startSlot: 15, endSlot: 25, temp: 450, notes: '' },
    ];
    renderOven();
  `);

  const grid = elements['oven-grid'];
  const ovenBlocks = grid.querySelectorAll('.oven-block');
  assert.strictEqual(ovenBlocks.length, 2);
  assert.strictEqual(elements['oven-conflict-banner'].classList.contains('visible'), true);
});
