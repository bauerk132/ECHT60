const test = require('node:test');
const assert = require('node:assert');

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderOvenBlockHtml(block, conflictIds = new Set()) {
  const dur = (block.endSlot - block.startSlot) * 15;
  return `
      <button class="block-delete" title="Remove">×</button>
      ${conflictIds.has(block.id) ? `<div class="conflict-badge">⚠ CONFLICT</div>` : ''}
      <div class="block-title">${escHtml(block.name)}</div>
      ${dur > 30 ? `<div class="block-time">06:00–07:00</div>` : ''}
      ${block.temp && dur > 30 ? `<div class="block-temp">${escHtml(block.temp)}°F</div>` : ''}
      <div class="resize-handle"></div>
    `;
}

test('escHtml escapes HTML special characters', () => {
  const payload = '<script>alert("xss")</script>';
  const escaped = escHtml(payload);
  assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.strictEqual(escaped.includes('<script>'), false);
});

test('renderOvenBlockHtml escapes XSS payload in block.temp', () => {
  const block = {
    id: 'test1',
    name: 'Croissants',
    startSlot: 0,
    endSlot: 4, // dur = 60 > 30
    temp: '375"><img src=x onerror=alert(1)>',
  };
  const html = renderOvenBlockHtml(block);
  assert.strictEqual(html.includes('<img src=x onerror=alert(1)>'), false);
  assert.strictEqual(html.includes('375&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'), true);
});

test('renderOvenBlockHtml escapes XSS payload in block.name', () => {
  const block = {
    id: 'test2',
    name: '<svg onload=alert(1)>',
    startSlot: 0,
    endSlot: 4,
    temp: '350',
  };
  const html = renderOvenBlockHtml(block);
  assert.strictEqual(html.includes('<svg onload=alert(1)>'), false);
  assert.strictEqual(html.includes('&lt;svg onload=alert(1)&gt;'), true);
});
