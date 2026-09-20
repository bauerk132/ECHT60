const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

class Node {
  constructor(tag) {
    this.tagName = tag ? tag.toUpperCase() : '';
    this.children = [];
    this.style = {};
    this.dataset = {};
    this._classes = new Set();
    const self = this;
    this.classList = {
      add(c) { self._classes.add(c); },
      remove(c) { self._classes.delete(c); },
      contains(c) { return self._classes.has(c); },
      toggle(c, v) { if (v) self.add(c); else self.remove(c); }
    };
    this.listeners = {};
  }
  get className() {
    return Array.from(this._classes).join(' ');
  }
  set className(val) {
    this._classes.clear();
    if (val) {
      val.trim().split(/\s+/).forEach(c => this._classes.add(c));
    }
  }
  appendChild(child) {
    if (child.tagName === '#DOCUMENT-FRAGMENT') {
      for (const c of child.children) {
        this.children.push(c);
      }
      child.children = [];
      return child;
    }
    this.children.push(child);
    return child;
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }
  querySelectorAll(sel) {
    let results = [];
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) results.push(this);
    }
    for (const child of this.children) {
      results = results.concat(child.querySelectorAll(sel));
    }
    return results;
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  remove() {}
}

class DocumentFragment extends Node {
  constructor() { super('#document-fragment'); }
}

class Document extends Node {
  constructor() {
    super('#document');
    this._elements = {};
  }
  createElement(tag) { return new Node(tag); }
  createDocumentFragment() { return new DocumentFragment(); }
  getElementById(id) {
    if (!this._elements[id]) this._elements[id] = new Node('div');
    return this._elements[id];
  }
}

function createEnv() {
  const doc = new Document();
  const context = {
    document: doc,
    console: console,
    Math: Math,
    Date: Date,
    Set: Set,
    Array: Array,
    String: String,
    Number: Number,
    parseInt: parseInt,
    parseFloat: parseFloat,
    setTimeout: () => {},
    setInterval: () => {},
    clearTimeout: () => {},
    localStorage: { getItem: () => null, setItem: () => {} }
  };
  vm.createContext(context);
  const html = fs.readFileSync('index.html', 'utf8');
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(scriptContent, context);
  return { doc, context };
}

test('buildGrid creates 672 time cells and headers in grid using DocumentFragment', () => {
  const { doc, context } = createEnv();
  context.renderSchedule();

  const gridEl = doc.getElementById('schedule-grid');
  const cells = gridEl.querySelectorAll('.time-cell');
  assert.strictEqual(cells.length, 672);

  const headers = gridEl.querySelectorAll('.day-header');
  assert.strictEqual(headers.length, 7);
});

test('renderTaskBlocks attaches a single delegated click listener to grid', () => {
  const { doc, context } = createEnv();
  context.renderSchedule();

  const gridEl = doc.getElementById('schedule-grid');
  assert.strictEqual(gridEl._hasCellClickListener, true);
  assert.ok(gridEl.listeners['click']);
  assert.strictEqual(gridEl.listeners['click'].length, 1);
});

test('renderOvenBlocks attaches a single delegated click listener to oven grid', () => {
  const { doc, context } = createEnv();
  context.renderOven();

  const gridEl = doc.getElementById('oven-grid');
  assert.strictEqual(gridEl._hasCellClickListener, true);
  assert.ok(gridEl.listeners['click']);
  assert.strictEqual(gridEl.listeners['click'].length, 1);
});
