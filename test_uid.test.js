const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function getUidContext(customMath, customDate) {
  const htmlPath = path.join(__dirname, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) {
    throw new Error('No <script> tag found in index.html');
  }
  const uidMatch = scriptMatch[1].match(/function uid\(\)\s*\{[\s\S]*?\}/);
  if (!uidMatch) {
    throw new Error('uid() function not found in index.html');
  }

  const sandbox = {
    Math: customMath || Math,
    Date: customDate || Date
  };
  vm.createContext(sandbox);
  vm.runInContext(uidMatch[0], sandbox);
  return sandbox;
}

test('uid() - returns a non-empty string', () => {
  const context = getUidContext();
  const id = context.uid();
  assert.strictEqual(typeof id, 'string');
  assert.ok(id.length > 0, 'id should not be empty');
});

test('uid() - returns alphanumeric string', () => {
  const context = getUidContext();
  const id = context.uid();
  assert.match(id, /^[a-z0-9]+$/);
});

test('uid() - generates unique IDs across 1000 consecutive calls', () => {
  const context = getUidContext();
  const count = 1000;
  const ids = new Set();
  for (let i = 0; i < count; i++) {
    ids.add(context.uid());
  }
  assert.strictEqual(ids.size, count);
});

test('uid() - correctly combines Math.random slice and Date.now base36 representation', () => {
  const mockMath = Object.create(Math);
  mockMath.random = () => 0.123456789;
  const mockDate = {
    now: () => 1700000000000
  };

  const context = getUidContext(mockMath, mockDate);

  const expectedRandomPart = (0.123456789).toString(36).slice(2, 10);
  const expectedDatePart = (1700000000000).toString(36);
  const expectedUid = expectedRandomPart + expectedDatePart;

  const actualUid = context.uid();
  assert.strictEqual(actualUid, expectedUid);
});
