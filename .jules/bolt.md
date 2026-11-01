## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-05 - Template Caching for Invariant Substructures in Repetitive Grid Rendering
**Learning:** In interactive calendar/schedule grids, dynamic state updates (drag, drop, resize, tab switches) trigger full grid rebuilds. Although week headers and task blocks change, the underlying grid slot structure (96 time labels + 672 time cells = 768 elements) is completely static across all renders. Regenerating these 768 DOM elements in string loops on every interaction burns CPU cycles and allocates 58KB of temporary strings per render. Precomputing or lazily caching the static slots HTML string template drops grid HTML generation time by ~50x (~280ms down to ~5ms per 5,000 renders).
**Action:** Separate static invariant grid geometry from dynamic elements (headers, overlays) and cache static string templates instead of reconstructing them inside re-render loops.
