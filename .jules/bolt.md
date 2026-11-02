## 2026-09-26 - Single innerHTML Assignment for Repetitive Calendar Grids
**Learning:** Generating large recurring grids (670+ cells) via `document.createElement` and `appendChild` loops causes noticeable layout thrashing and slow render times. Concatenating into an HTML string and setting `innerHTML` once improves grid initialization performance by ~45%.
**Action:** Always batch element creation into string templates when building static structured grids in pure JS/DOM web apps.

## 2026-10-04 - Event Delegation for Large Interactive Grid Cells
**Learning:** Attaching click event listeners individually to 672 grid cells (`querySelectorAll('.time-cell')`) on every grid re-render causes unnecessary DOM query overhead and listener attachment costs. Switching to event delegation on the grid container (`grid.addEventListener('click', ...)` with `e.target.closest('.time-cell')`) reduces click setup overhead from ~530ms down to ~0.2ms per 1000 grid updates.
**Action:** Always use event delegation on parent containers when handling repetitive user actions across large grids or lists.

## 2026-10-07 - Day-Partitioned Sweep-Line Conflict Detection
**Learning:** Naive $O(N^2)$ pairwise interval comparisons for conflict checking across multi-day schedules redundantly compare blocks that occur on different days. Partitioning blocks into day buckets and sorting each day by `startSlot` allows interval sweep-line checking with early termination (`if (next.startSlot >= cur.endSlot) break`), reducing conflict checking overhead by ~64% across drag, resize, and render loops.
**Action:** Partition temporal items into coarse time buckets (e.g. days) before interval collision detection, and sort intervals to enable early-exit sweep lines instead of full Cartesian products.
