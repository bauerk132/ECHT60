## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-18 - Day Bucketing for Multiday Schedule Overlap Checks & DocumentFragment Batching
**Learning:** Pairwise overlap checks on multi-day calendar tasks across an entire array execute in O(N^2) time comparing tasks on different days. Grouping blocks into day buckets prior to checking reduces comparison iterations by ~85% (O((N/7)^2 * 7)). Combined with batching DOM block elements using DocumentFragment, overall schedule rendering and conflict resolution benchmarked 70% faster (from 14,548ms down to 4,381ms per 1000 iterations).
**Action:** Always bucket time-bounded domain entities by date/day partition before pairwise overlap detection and batch DOM insertions with DocumentFragment.
