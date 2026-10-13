const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Extract hexToRgba function from echt-analytics.html
const htmlPath = path.join(__dirname, '..', 'echt-analytics.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const match = htmlContent.match(/function hexToRgba\([\s\S]*?\n\}/);
if (!match) {
  throw new Error('hexToRgba function not found in echt-analytics.html');
}

const hexToRgba = new Function(`${match[0]}; return hexToRgba;`)();

test('hexToRgba converts standard 6-digit hex color with alpha', () => {
  assert.strictEqual(hexToRgba('#c0622a', 0.5), 'rgba(192,98,42,0.5)');
  assert.strictEqual(hexToRgba('#7a6a8a', 1), 'rgba(122,106,138,1)');
});

test('hexToRgba converts black and white hex colors', () => {
  assert.strictEqual(hexToRgba('#000000', 0), 'rgba(0,0,0,0)');
  assert.strictEqual(hexToRgba('#ffffff', 1), 'rgba(255,255,255,1)');
});

test('hexToRgba handles uppercase hex codes', () => {
  assert.strictEqual(hexToRgba('#FF0000', 0.25), 'rgba(255,0,0,0.25)');
  assert.strictEqual(hexToRgba('#00FF00', 0.8), 'rgba(0,255,0,0.8)');
});
