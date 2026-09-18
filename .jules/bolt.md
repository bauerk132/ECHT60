# Bolt's Journal - Performance Learnings

## 2025-05-18 - Grid Rendering Optimization via DocumentFragment and Event Delegation
**Learning:** Generating large time-slot grids (770+ DOM elements: headers, time labels, and 672 cells) by repeatedly appending directly to `grid` causes excessive DOM reflows. Furthermore, attaching `click` listeners to every `.time-cell` on every render causes memory bloat and unnecessary listener churn.
**Action:** Use `DocumentFragment` to batch DOM node additions into a single append operation per grid render, and use event delegation on parent container elements (`#schedule-grid` / `#oven-grid`) for cell interactions.
