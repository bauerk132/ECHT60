const test = require('node:test');
const assert = require('node:assert');

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

test('escHtml properly escapes special HTML characters', () => {
  assert.strictEqual(
    escHtml('<script>alert("xss")</script>'),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
  );
  assert.strictEqual(
    escHtml("375'\"<>&"),
    '375&#39;&quot;&lt;&gt;&amp;'
  );
  assert.strictEqual(escHtml(null), '');
  assert.strictEqual(escHtml(undefined), '');
});

test('oven block HTML rendering with escaped temperature and name is safe', () => {
  const block = {
    id: 'test1',
    name: '<img src=x onerror=alert(1)>',
    temp: '375"><script>alert("xss")</script>',
    startSlot: 20,
    endSlot: 30, // dur = 150 > 30
  };

  const dur = (block.endSlot - block.startSlot) * 15;
  const conflictIds = new Set();
  function slotToTime(slot) { return '05:00'; }

  const html = `
    <button class="block-delete" title="Remove">×</button>
    ${conflictIds.has(block.id) ? `<div class="conflict-badge">⚠ CONFLICT</div>` : ''}
    <div class="block-title">${escHtml(block.name)}</div>
    ${dur > 30 ? `<div class="block-time">${slotToTime(block.startSlot)}–${slotToTime(block.endSlot)}</div>` : ''}
    ${block.temp && dur > 30 ? `<div class="block-temp">${escHtml(block.temp)}°F</div>` : ''}
    <div class="resize-handle"></div>
  `;

  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img /);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /375&quot;&gt;&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;°F/);
});
