const fs = require('fs');
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');

// Read the HTML file
const htmlContent = fs.readFileSync('index.html', 'utf8');

// Extract the slotToTime function
const match = htmlContent.match(/function slotToTime\(slot\) \{[\s\S]*?\n\}/);
if (!match) {
  throw new Error("Could not find slotToTime function in index.html");
}

const functionCode = match[0];

// Execute the function in a VM context to make it available
const context = {};
vm.createContext(context);
vm.runInContext(functionCode, context);

const slotToTime = context.slotToTime;

test('slotToTime correctly converts slots to time strings', (t) => {
  // Test slot 0 (00:00)
  assert.strictEqual(slotToTime(0), '00:00');

  // Test slot 4 (01:00)
  assert.strictEqual(slotToTime(4), '01:00');

  // Test slot 5 (01:15)
  assert.strictEqual(slotToTime(5), '01:15');

  // Test slot 48 (12:00)
  assert.strictEqual(slotToTime(48), '12:00');

  // Additional edge cases
  // Test slot 95 (23:45)
  assert.strictEqual(slotToTime(95), '23:45');
});
