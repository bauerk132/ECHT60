## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-09-30 - Event Delegation for Large Grid Cells
**Learning:** Attaching `click` event listeners to 670+ individual grid cell elements on every render introduces significant memory overhead and event registration time (~130ms for 1000 renders vs ~0.5ms with delegation).
**Action:** Use a single event listener on the parent container (event delegation) with `e.target.classList.contains('time-cell')` instead of looping with `querySelectorAll('.time-cell').forEach(...)`.
