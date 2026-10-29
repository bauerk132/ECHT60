## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-20 - Pre-computed Set for O(1) Conflict Lookups in Timeline Views
**Learning:** Linear array searches (`Array.prototype.some`) inside nested timeline block loops cause O(N*M) performance bottlenecks during timeline re-renders. Pre-building a `Set` of conflict IDs before the rendering loop reduces conflict checking to O(1) per block and speeds up Gantt chart rendering by ~46%.
**Action:** Always pre-compute lookup sets before iterating over collections in rendering logic.
