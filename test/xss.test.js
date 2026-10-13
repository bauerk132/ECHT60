const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Verify escHtml handles HTML entities correctly', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  // Extract escHtml function definition
  const escHtmlMatch = indexHtml.match(/function escHtml\(str\) \{[\s\S]*?\}/);
  assert.ok(escHtmlMatch, 'escHtml function should exist in index.html');

  const escHtml = new Function(`return ${escHtmlMatch[0]}`)();
  assert.equal(escHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escHtml('A & B'), 'A &amp; B');
});

test('Verify createTaskBlockEl escapes task category and name', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Simple DOM mock for document.createElement if needed or JSDOM
  const windowMock = {
    document: {
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        dataset: {},
        style: {},
        innerHTML: '',
        addEventListener: () => {},
        querySelector: () => ({ addEventListener: () => {} }),
      }),
    },
  };

  // Prepare execution context with required constants and functions
  const contextCode = `
    const CATEGORIES = [
      { id: 'croissant', name: 'Croissant', color: '#c8a96e' },
      { id: 'xss_cat', name: '<img src=x onerror=alert(1)>', color: '#123456' }
    ];
    function getCatColor(catId) { return '#123456'; }
    function getCatName(catId) {
      const cat = CATEGORIES.find(c => c.id === catId);
      return cat ? cat.name : catId;
    }
    function hexToRgba(hex, alpha) { return 'rgba(0,0,0,1)'; }
    function slotToTime(slot) { return '00:00'; }
    function escHtml(str) {
      return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    const document = windowMock.document;
    ${indexHtml.match(/function createTaskBlockEl\(task\) \{[\s\S]*?\n\}/)[0]}
    return createTaskBlockEl;
  `;

  const createTaskBlockEl = new Function('windowMock', contextCode)(windowMock);

  const maliciousTask = {
    id: '1',
    name: '<script>alert("name_xss")</script>',
    category: 'xss_cat',
    startSlot: 0,
    endSlot: 4, // dur = 60 > 45, so block-cat is rendered
    passive: false,
  };

  const el = createTaskBlockEl(maliciousTask);

  assert.ok(!el.innerHTML.includes('<script>'), 'HTML script tag should not be unescaped in name');
  assert.ok(el.innerHTML.includes('&lt;script&gt;alert(&quot;name_xss&quot;)&lt;/script&gt;'), 'Task name should be escaped');

  assert.ok(!el.innerHTML.includes('<img src=x onerror=alert(1)>'), 'Unescaped XSS payload in category name should not exist');
  assert.ok(el.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'), 'Category name should be escaped');
});
