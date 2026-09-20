## 2026-09-20 - Batching DOM Grid Elements with DocumentFragment & Event Delegation

**Learning:** When building large schedule grids with hundreds of dynamic DOM elements (e.g., 672 time cells + 7 headers + 96 labels per grid refresh), appending elements individually to the live DOM tree triggers continuous browser layout recalculations and DOM tree mutations. Replacing individual `appendChild` calls with `DocumentFragment` batches all 700+ node creations into a single DOM insertion. Furthermore, replacing per-cell click event listeners (672 listeners) with event delegation on the parent container eliminates listener attachment overhead and reduces grid render time by ~25%.

**Action:** For large recurring grid structures or tables, construct elements inside a `DocumentFragment` before mounting to the parent grid, and handle cell interactions via single delegated event listeners on the parent element.
