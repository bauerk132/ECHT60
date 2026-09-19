const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

// Extract script content
const html = fs.readFileSync('echt-analytics.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  throw new Error('Script tag not found in echt-analytics.html');
}

const scriptContent = scriptMatch[1];

// Create a mock environment
const context = {
  document: {
    getElementById: () => ({ addEventListener: () => {}, style: {} }),
    addEventListener: () => {},
  },
  window: {
    addEventListener: () => {},
    devicePixelRatio: 1,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  },
  localStorage: {
    getItem: () => null
  }
};
vm.createContext(context);
vm.runInContext(scriptContent, context);

const hexToRgba = context.hexToRgba;

describe('hexToRgba utility function tests', () => {
  it('should correctly parse red #ff0000 with alpha 1', () => {
    assert.strictEqual(hexToRgba('#ff0000', 1), 'rgba(255,0,0,1)');
  });

  it('should correctly parse green #00ff00 with alpha 0.5', () => {
    assert.strictEqual(hexToRgba('#00ff00', 0.5), 'rgba(0,255,0,0.5)');
  });

  it('should correctly parse blue #0000ff with alpha 0', () => {
    assert.strictEqual(hexToRgba('#0000ff', 0), 'rgba(0,0,255,0)');
  });

  it('should correctly parse white #ffffff with alpha 0.8', () => {
    assert.strictEqual(hexToRgba('#ffffff', 0.8), 'rgba(255,255,255,0.8)');
  });

  it('should correctly parse black #000000 with alpha 1', () => {
    assert.strictEqual(hexToRgba('#000000', 1), 'rgba(0,0,0,1)');
  });

  it('should handle uppercase hex codes', () => {
    assert.strictEqual(hexToRgba('#FFFFFF', 1), 'rgba(255,255,255,1)');
    assert.strictEqual(hexToRgba('#FF0000', 0.3), 'rgba(255,0,0,0.3)');
  });

  it('should handle mixed case hex codes', () => {
    assert.strictEqual(hexToRgba('#aBcDeF', 0.2), 'rgba(171,205,239,0.2)');
  });
});
