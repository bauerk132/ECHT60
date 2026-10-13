const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract hexToRgba function from echt-analytics.html
const htmlPath = path.join(__dirname, '../echt-analytics.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const match = htmlContent.match(/function\s+hexToRgba\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
if (!match) {
  throw new Error('Could not find hexToRgba function definition in echt-analytics.html');
}

// Evaluate function definition
const hexToRgba = new Function(`return (${match[0]})`)();

test('hexToRgba converts standard 6-digit hex and alpha to rgba string', () => {
  assert.strictEqual(hexToRgba('#7a6a8a', 1), 'rgba(122,106,138,1)');
  assert.strictEqual(hexToRgba('#ffffff', 0.5), 'rgba(255,255,255,0.5)');
  assert.strictEqual(hexToRgba('#000000', 0), 'rgba(0,0,0,0)');
  assert.strictEqual(hexToRgba('#ff0000', 0.8), 'rgba(255,0,0,0.8)');
});

test('hexToRgba handles uppercase hex strings', () => {
  assert.strictEqual(hexToRgba('#FFFFFF', 1), 'rgba(255,255,255,1)');
  assert.strictEqual(hexToRgba('#FF0000', 0.2), 'rgba(255,0,0,0.2)');
  assert.strictEqual(hexToRgba('#123456', 0.75), 'rgba(18,52,86,0.75)');
});
