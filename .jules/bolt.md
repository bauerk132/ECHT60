## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-27 - Day Bucketing for Schedule & Oven Overlap Checks
**Learning:** Unbucketed conflict detection (`O(N^2)` across all days) scales poorly as items grow and results in redundant computations when called twice during grid rendering (`renderOven` and `renderOvenBlocks`). Pre-bucketing items by day (0-6) reduces comparisons to `O(N^2 / 7)` (~85% reduction), and passing computed `conflictIds` down into sub-renderers eliminates duplicate calls, speeding up schedule updates by ~7x.
**Action:** Always bucket schedule items by time/day dimension before running pairwise collision algorithms, and pass computed conflict sets down to sub-renderers.
