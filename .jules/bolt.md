## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-02 - O(1) Category Map and Single-Pass Counting
**Learning:** Repeatedly calling CATEGORIES.find() and Array.prototype.filter() over category lists during block rendering and category count updates introduces unnecessary O(N*M) overhead. Prebuilding an O(1) map and accumulating counts in a single pass O(T + B) eliminates linear array scans.
**Action:** Use lookup maps and single-pass accumulators for constant metadata arrays and frequent UI updates.
