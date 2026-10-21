## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-21 - Dynamic Day Bucketing for Multi-Day Schedule Overlap Checks
**Learning:** Checking block overlaps across all scheduled items using nested $O(N^2)$ loops checks items scheduled on different days that can never overlap. Bucketing items dynamically by day using a `Map` before slot comparison reduces execution time by ~80% ($O(N)$ grouping + $O(\sum N_{day}^2)$), while cleanly supporting arbitrary day keys without boundary assumptions.
**Action:** Always bucket schedule items by date/day before performing slot collision detection.
