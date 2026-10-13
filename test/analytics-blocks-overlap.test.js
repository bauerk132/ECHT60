const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/**
 * Helper to extract `blocksOverlap` function directly from `echt-analytics.html`
 */
function loadBlocksOverlap() {
  const filePath = path.join(__dirname, '..', 'echt-analytics.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  const match = htmlContent.match(/function blocksOverlap\(a, b\) \{[\s\S]*?\}/);
  if (!match) {
    throw new Error('Could not find blocksOverlap implementation in echt-analytics.html');
  }
  const context = {};
  vm.runInNewContext(match[0], context);
  return context.blocksOverlap;
}

const blocksOverlap = loadBlocksOverlap();

describe('blocksOverlap in echt-analytics.html', () => {
  describe('Same Day - Overlapping Blocks', () => {
    it('should return true for partial overlap where A starts before B', () => {
      const blockA = { day: 1, startSlot: 10, endSlot: 20 };
      const blockB = { day: 1, startSlot: 15, endSlot: 25 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });

    it('should return true for partial overlap where B starts before A', () => {
      const blockA = { day: 1, startSlot: 15, endSlot: 25 };
      const blockB = { day: 1, startSlot: 10, endSlot: 20 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });

    it('should return true when block A completely encloses block B', () => {
      const blockA = { day: 2, startSlot: 10, endSlot: 40 };
      const blockB = { day: 2, startSlot: 15, endSlot: 25 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });

    it('should return true when block B completely encloses block A', () => {
      const blockA = { day: 2, startSlot: 15, endSlot: 25 };
      const blockB = { day: 2, startSlot: 10, endSlot: 40 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });

    it('should return true for identical slot ranges', () => {
      const blockA = { day: 0, startSlot: 10, endSlot: 20 };
      const blockB = { day: 0, startSlot: 10, endSlot: 20 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });
  });

  describe('Same Day - Non-Overlapping Blocks', () => {
    it('should return false when block A is completely before block B with gap', () => {
      const blockA = { day: 3, startSlot: 10, endSlot: 20 };
      const blockB = { day: 3, startSlot: 25, endSlot: 35 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });

    it('should return false when block A is completely after block B with gap', () => {
      const blockA = { day: 3, startSlot: 25, endSlot: 35 };
      const blockB = { day: 3, startSlot: 10, endSlot: 20 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });

    it('should return false when block A ends exactly when block B starts (adjacent blocks)', () => {
      const blockA = { day: 4, startSlot: 10, endSlot: 20 };
      const blockB = { day: 4, startSlot: 20, endSlot: 30 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });

    it('should return false when block B ends exactly when block A starts (adjacent blocks)', () => {
      const blockA = { day: 4, startSlot: 20, endSlot: 30 };
      const blockB = { day: 4, startSlot: 10, endSlot: 20 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });
  });

  describe('Different Days', () => {
    it('should return false for identical slot ranges on different days', () => {
      const blockA = { day: 0, startSlot: 10, endSlot: 20 };
      const blockB = { day: 1, startSlot: 10, endSlot: 20 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });

    it('should return false for overlapping slot ranges on different days', () => {
      const blockA = { day: 2, startSlot: 10, endSlot: 20 };
      const blockB = { day: 3, startSlot: 15, endSlot: 25 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });
  });

  describe('Commutativity / Symmetry', () => {
    it('should give identical results regardless of argument order', () => {
      const cases = [
        { a: { day: 0, startSlot: 0, endSlot: 10 }, b: { day: 0, startSlot: 5, endSlot: 15 } },
        { a: { day: 0, startSlot: 0, endSlot: 10 }, b: { day: 0, startSlot: 10, endSlot: 20 } },
        { a: { day: 1, startSlot: 0, endSlot: 10 }, b: { day: 2, startSlot: 5, endSlot: 15 } },
      ];

      for (const { a, b } of cases) {
        assert.equal(
          blocksOverlap(a, b),
          blocksOverlap(b, a),
          `Commutativity failed for A=${JSON.stringify(a)}, B=${JSON.stringify(b)}`
        );
      }
    });
  });

  describe('Day Boundaries and Extreme Slot Values', () => {
    it('should correctly handle blocks starting at slot 0 (start of day)', () => {
      const blockA = { day: 5, startSlot: 0, endSlot: 4 };
      const blockB = { day: 5, startSlot: 2, endSlot: 6 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });

    it('should correctly handle blocks ending at slot 96 (end of day)', () => {
      const blockA = { day: 6, startSlot: 90, endSlot: 96 };
      const blockB = { day: 6, startSlot: 94, endSlot: 96 };
      assert.equal(blocksOverlap(blockA, blockB), true);
    });

    it('should return false for adjacent blocks at slot 0 boundary', () => {
      const blockA = { day: 5, startSlot: 0, endSlot: 4 };
      const blockB = { day: 5, startSlot: 4, endSlot: 8 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });

    it('should return false for adjacent blocks at slot 96 boundary', () => {
      const blockA = { day: 6, startSlot: 88, endSlot: 92 };
      const blockB = { day: 6, startSlot: 92, endSlot: 96 };
      assert.equal(blocksOverlap(blockA, blockB), false);
    });
  });
});
