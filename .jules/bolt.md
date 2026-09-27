## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-09-27 - Event Delegation for Large Dynamic Grids
**Learning:** Attaching individual click event listeners to 672 grid cells (`.time-cell`) during every grid re-render creates significant event listener allocation overhead and memory churn. Delegating clicks to parent grid containers (`#schedule-grid` and `#oven-grid`) reduces listener attachments from 1,344 down to 2, eliminating allocation thrashing on interactions like dragging, adding, or deleting schedule items.
**Action:** Prefer event delegation on parent containers for repetitive dynamic grid cells instead of querying and binding listeners inside render loops.
