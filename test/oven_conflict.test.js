const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadIndexScript } = require('./load_app.js');

describe('Oven & Schedule Conflict Detection', () => {
  let appCtx;

  beforeEach(() => {
    appCtx = loadIndexScript();
  });

  describe('blocksOverlap', () => {
    test('returns true for overlapping blocks on the same day', () => {
      const blockA = { day: 0, startSlot: 10, endSlot: 20 };
      const blockB = { day: 0, startSlot: 15, endSlot: 25 };
      assert.equal(appCtx.blocksOverlap(blockA, blockB), true);
    });

    test('returns false for non-overlapping blocks on the same day (adjacent)', () => {
      const blockA = { day: 0, startSlot: 10, endSlot: 20 };
      const blockB = { day: 0, startSlot: 20, endSlot: 30 };
      assert.equal(appCtx.blocksOverlap(blockA, blockB), false);
    });

    test('returns false for overlapping slot ranges on different days', () => {
      const blockA = { day: 0, startSlot: 10, endSlot: 20 };
      const blockB = { day: 1, startSlot: 10, endSlot: 20 };
      assert.equal(appCtx.blocksOverlap(blockA, blockB), false);
    });

    test('returns true when one block completely contains another', () => {
      const blockA = { day: 2, startSlot: 10, endSlot: 30 };
      const blockB = { day: 2, startSlot: 15, endSlot: 20 };
      assert.equal(appCtx.blocksOverlap(blockA, blockB), true);
    });

    test('returns false for completely disjoint blocks', () => {
      const blockA = { day: 3, startSlot: 10, endSlot: 15 };
      const blockB = { day: 3, startSlot: 20, endSlot: 25 };
      assert.equal(appCtx.blocksOverlap(blockA, blockB), false);
    });
  });

  describe('hasOvenConflict', () => {
    test('returns false when ovenBlocks is empty', () => {
      appCtx.setState({ ovenBlocks: [], tasks: [] });
      assert.equal(appCtx.hasOvenConflict(), false);
    });

    test('returns false when there is only one oven block', () => {
      appCtx.setState({
        ovenBlocks: [{ id: '1', day: 0, startSlot: 10, endSlot: 20 }],
        tasks: []
      });
      assert.equal(appCtx.hasOvenConflict(), false);
    });

    test('returns false when multiple oven blocks do not overlap', () => {
      appCtx.setState({
        ovenBlocks: [
          { id: '1', day: 0, startSlot: 10, endSlot: 20 },
          { id: '2', day: 0, startSlot: 20, endSlot: 30 },
          { id: '3', day: 1, startSlot: 15, endSlot: 25 }
        ],
        tasks: []
      });
      assert.equal(appCtx.hasOvenConflict(), false);
    });

    test('returns true when two oven blocks overlap on the same day', () => {
      appCtx.setState({
        ovenBlocks: [
          { id: '1', day: 0, startSlot: 10, endSlot: 20 },
          { id: '2', day: 0, startSlot: 18, endSlot: 28 }
        ],
        tasks: []
      });
      assert.equal(appCtx.hasOvenConflict(), true);
    });

    test('returns true when one of several oven blocks overlaps', () => {
      appCtx.setState({
        ovenBlocks: [
          { id: '1', day: 0, startSlot: 10, endSlot: 15 },
          { id: '2', day: 1, startSlot: 20, endSlot: 30 },
          { id: '3', day: 1, startSlot: 25, endSlot: 35 }
        ],
        tasks: []
      });
      assert.equal(appCtx.hasOvenConflict(), true);
    });
  });

  describe('getOvenConflictIds', () => {
    test('returns empty set when there are no oven conflicts', () => {
      appCtx.setState({
        ovenBlocks: [
          { id: 'a', day: 0, startSlot: 10, endSlot: 15 },
          { id: 'b', day: 0, startSlot: 15, endSlot: 20 }
        ],
        tasks: []
      });
      const conflicts = appCtx.getOvenConflictIds();
      assert.equal(conflicts.size, 0);
    });

    test('returns IDs of all conflicting blocks', () => {
      appCtx.setState({
        ovenBlocks: [
          { id: 'block-1', day: 2, startSlot: 10, endSlot: 20 },
          { id: 'block-2', day: 2, startSlot: 15, endSlot: 25 },
          { id: 'block-3', day: 2, startSlot: 30, endSlot: 40 }
        ],
        tasks: []
      });
      const conflicts = appCtx.getOvenConflictIds();
      assert.equal(conflicts.size, 2);
      assert.ok(conflicts.has('block-1'));
      assert.ok(conflicts.has('block-2'));
      assert.ok(!conflicts.has('block-3'));
    });

    test('handles multiple conflicting groups correctly', () => {
      appCtx.setState({
        ovenBlocks: [
          { id: 'b1', day: 0, startSlot: 10, endSlot: 20 },
          { id: 'b2', day: 0, startSlot: 15, endSlot: 25 },
          { id: 'b3', day: 1, startSlot: 40, endSlot: 50 },
          { id: 'b4', day: 1, startSlot: 45, endSlot: 55 }
        ],
        tasks: []
      });
      const conflicts = appCtx.getOvenConflictIds();
      assert.equal(conflicts.size, 4);
      assert.deepEqual([...conflicts].sort(), ['b1', 'b2', 'b3', 'b4']);
    });
  });

  describe('hasScheduleConflict', () => {
    test('returns false when no tasks exist', () => {
      appCtx.setState({ ovenBlocks: [], tasks: [] });
      assert.equal(appCtx.hasScheduleConflict(), false);
    });

    test('ignores passive tasks when checking for conflicts', () => {
      appCtx.setState({
        ovenBlocks: [],
        tasks: [
          { id: 't1', day: 0, startSlot: 10, endSlot: 20, passive: true },
          { id: 't2', day: 0, startSlot: 15, endSlot: 25, passive: false }
        ]
      });
      assert.equal(appCtx.hasScheduleConflict(), false);
    });

    test('returns true when active tasks overlap', () => {
      appCtx.setState({
        ovenBlocks: [],
        tasks: [
          { id: 't1', day: 0, startSlot: 10, endSlot: 20, passive: false },
          { id: 't2', day: 0, startSlot: 15, endSlot: 25, passive: false }
        ]
      });
      assert.equal(appCtx.hasScheduleConflict(), true);
    });

    test('returns false when active tasks do not overlap', () => {
      appCtx.setState({
        ovenBlocks: [],
        tasks: [
          { id: 't1', day: 0, startSlot: 10, endSlot: 20, passive: false },
          { id: 't2', day: 0, startSlot: 20, endSlot: 30, passive: false }
        ]
      });
      assert.equal(appCtx.hasScheduleConflict(), false);
    });
  });
});
