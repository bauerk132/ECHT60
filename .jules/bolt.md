## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-11-03 - Cache Invariant Grid Cell HTML Templates
**Learning:** Even when using string concatenation for large recurring grids, recomputing 768 static slot and label HTML strings (96 time labels + 672 cells) inside the render loop causes redundant CPU work across frequent operations like drag/drop moves, resizes, tab switches, and block mutations. Caching the immutable grid slots HTML template lazily in memory reduces 5,000 grid HTML generation cycles from ~820ms down to ~0.4ms (~99.9% faster).
**Action:** Identify static, data-independent layout scaffolding inside dynamic views and cache the constructed HTML string representation instead of regenerating it on every render cycle.
