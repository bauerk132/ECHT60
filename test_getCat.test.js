import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function loadGetCat() {
  const html = fs.readFileSync('echt-analytics.html', 'utf8');
  const catMatch = html.match(/const CATEGORIES = \[\s*[\s\S]*?\n\];/);
  const getCatMatch = html.match(/function getCat\(id\)\s*\{[\s\S]*?\n\}/);

  if (!catMatch) {
    throw new Error('CATEGORIES definition not found in echt-analytics.html');
  }
  if (!getCatMatch) {
    throw new Error('getCat function definition not found in echt-analytics.html');
  }

  return new Function(`${catMatch[0]}\n${getCatMatch[0]}; return { getCat, CATEGORIES };`)();
}

const { getCat, CATEGORIES } = loadGetCat();

test('getCat - returns matching category object for known category IDs', (t) => {
  CATEGORIES.forEach(cat => {
    const result = getCat(cat.id);
    assert.deepEqual(result, cat);
  });
});

test('getCat - edge case: unknown category lookup with string ID', (t) => {
  const result = getCat('unknown_category');
  assert.deepEqual(result, { name: 'unknown_category', color: '#7a6a8a' });
});

test('getCat - edge case: unknown category lookup with empty string ID', (t) => {
  const result = getCat('');
  assert.deepEqual(result, { name: '', color: '#7a6a8a' });
});

test('getCat - edge case: unknown category lookup with null ID', (t) => {
  const result = getCat(null);
  assert.deepEqual(result, { name: null, color: '#7a6a8a' });
});

test('getCat - edge case: unknown category lookup with undefined ID', (t) => {
  const result = getCat(undefined);
  assert.deepEqual(result, { name: undefined, color: '#7a6a8a' });
});

test('getCat - edge case: unknown category lookup with non-string numeric ID', (t) => {
  const result = getCat(999);
  assert.deepEqual(result, { name: 999, color: '#7a6a8a' });
});
