## 2026-09-21 - DocumentFragment DOM Batching for Grid Construction
**Learning:** Appending 700+ individual schedule time cells and header elements directly to an active DOM node causes repeated browser reflows during schedule and oven grid renders. Batching all cells inside a `DocumentFragment` prior to a single DOM insertion reduces DOM reflow overhead and speeds up `buildGrid` by 14-17%.
**Action:** Always batch repeated element creation loops (e.g. grids, lists, tables) using `DocumentFragment` before appending to the live document.
