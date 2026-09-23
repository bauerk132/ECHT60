## 2026-09-23 - Day-Grouped Interval Overlap for Schedule Conflicts

**Learning:** Pairwise overlap checks (`O(N^2)`) across all schedule/oven blocks cause unnecessary CPU overhead on every state update or drag interaction. Grouping blocks by day index (7 buckets) and sorting by `startSlot` allows early termination when `dayBlocks[j].startSlot >= dayBlocks[i].endSlot`, reducing overlap evaluation complexity to `O(N log N)`.
**Action:** When implementing schedule or calendar overlap checks, always bucket by day and sort intervals by start time rather than checking all pairwise combinations.
