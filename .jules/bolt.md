## 2026-09-22 - Optimize Conflict Detection with Interval Sorting
**Learning:** Pairwise overlap checking (`O(N^2)`) across all scheduled/oven blocks scales poorly as block count grows. Grouping blocks by day and sorting by `startSlot` turns overlap detection into an `O(N log N)` sort followed by an `O(N)` scan with early exit.
**Action:** When detecting time/interval overlaps in schedule systems, group intervals by day/resource and sort by start time to evaluate overlaps in `O(N log N)` time instead of `O(N^2)` double loops.
