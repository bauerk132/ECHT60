const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('createTaskBlockEl escapes category name to prevent XSS', () => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Extract script content from index.html
  const scriptMatches = [...htmlContent.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
  const scriptContent = scriptMatches.map(m => m[1]).join('\n');

  const mockElement = () => ({
    className: '',
    style: {},
    dataset: {},
    innerHTML: '',
    children: [],
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    classList: { add: () => {}, remove: () => {}, toggle: () => {} }
  });

  // Mock a basic DOM context using vm
  const mockDocument = {
    createElement: (tag) => mockElement(),
    addEventListener: () => {},
    getElementById: () => mockElement(),
    querySelectorAll: () => []
  };

  const sandbox = {
    document: mockDocument,
    window: { addEventListener: () => {} },
    addEventListener: () => {},
    console: console,
    Math: Math,
    parseInt: parseInt,
    String: String,
    Array: Array,
    localStorage: { getItem: () => null, setItem: () => {} }
  };

  vm.createContext(sandbox);
  vm.runInContext(scriptContent, sandbox);

  // Add a task with an unlisted/custom category containing malicious HTML/XSS payload
  const task = {
    id: 'test-1',
    name: 'Safe Task',
    category: '<img src=x onerror=alert(1)>',
    startSlot: 0,
    endSlot: 4, // duration = 60 mins (> 45)
    passive: false
  };

  const el = sandbox.createTaskBlockEl(task);

  assert.ok(el.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.strictEqual(el.innerHTML.includes('<img src=x onerror=alert(1)>'), false);
});
