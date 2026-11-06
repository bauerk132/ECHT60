## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-12 - Preserving Static Calendar Grid Cells Across Dynamic Re-renders
**Learning:** Rebuilding 768 static background grid cells (`.time-gutter-header`, `.day-header`, `.time-label`, `.time-cell`) via `grid.innerHTML = html` on every drag, resize, block addition, or deletion creates heavy DOM churn and layout thrashing (~231ms per 100 re-renders). Caching the background grid keyed by week (`grid._builtWeekKey`) and only removing dynamic blocks (`.task-block, .oven-block, .now-line`) reduces re-render time to ~52ms per 100 calls (a 77.5% reduction / 4.45x speedup) while preserving 100% visual fidelity and interaction semantics.
**Action:** In calendar or timeline views, decouple static coordinate/grid DOM structures from dynamic event/task elements so that state updates only mutate dynamic blocks instead of reconstructing the full background grid.
