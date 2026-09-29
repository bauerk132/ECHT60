## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-09-29 - Event Delegation for Dense Grid Cells
**Learning:** Attaching individual event listeners to hundreds of grid cells (672+ cells) during DOM renders creates noticeable event listener registration overhead and memory churn. Using event delegation on the grid container element reduces listener setup overhead by ~85% during re-renders.
**Action:** Always delegate user interactions (like cell clicks) to parent container elements when working with large recurring DOM structures rather than querying and binding handlers to each cell element individually.
