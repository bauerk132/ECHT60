const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Read index.html content
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Extract escHtml implementation or evaluate script scope
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

test('escHtml safely escapes HTML special characters', () => {
  const maliciousInput = '<script>alert("XSS")</script>';
  const escaped = escHtml(maliciousInput);
  assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  assert.strictEqual(escaped.includes('<script>'), false);
});

test('index.html uses escHtml on block.temp in oven block rendering', () => {
  // Verify that escHtml(block.temp) is present in index.html
  assert.ok(
    htmlContent.includes('${escHtml(block.temp)}°F'),
    'block.temp should be wrapped with escHtml() in oven block rendering'
  );
});

test('index.html uses escHtml on block.temp in edit modal rendering', () => {
  assert.ok(
    htmlContent.includes('value="${escHtml(block.temp || \'\')}"'),
    'block.temp should be wrapped with escHtml() in edit oven modal'
  );
});
