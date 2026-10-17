## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-18 - Day-Bucketed Sweep-Line Interval Conflict Checking
**Learning:** Pairwise brute-force interval overlap checks ($O(N^2)$) across multi-day calendar grids perform redundant cross-day comparisons and duplicate compute passes during re-renders. Bucketing schedule blocks by day, sorting by start slot, and breaking early upon non-overlap reduces conflict check time by ~84% (326ms down to 52ms for 1000 iterations). Reusing computed conflict ID sets across render passes further eliminates duplicate calculation overhead.
**Action:** Always bucket temporal intervals by day/category and sort by start time before running overlap detection, and cache/pass computed conflict sets through render passes.
