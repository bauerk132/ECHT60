## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-05 - DocumentFragment Batching for Dynamic Block Elements & Conflict Deduplication
**Learning:** Appending task and oven schedule blocks individually to a live DOM grid container triggers repeated browser layout recalculations. Staging blocks into a `DocumentFragment` before appending reduces live DOM insertion calls to a single operation. Furthermore, computing `getOvenConflictIds()` once and reusing the result between conflict banner toggling and block styling eliminates redundant O(N^2) overlap checks on every oven grid render.
**Action:** Always batch dynamic block element appends using a `DocumentFragment` and cache expensive multi-block conflict calculations across rendering routines.
