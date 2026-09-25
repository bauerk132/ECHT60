## 2026-09-25 - DOM Batching & Event Delegation in Static HTML/JS Grid Rendering
**Learning:** Constructing grid cell HTML via string batching (`innerHTML = html`) and delegating click handlers to the parent container reduces grid rendering time by ~79% (from ~971ms to ~203ms for 100 renders) compared to creating 672 individual DOM elements and attaching event listeners on every render pass.
**Action:** When working with dense calendar/schedule grid layouts in vanilla JS, batch DOM updates into a single `innerHTML` assignment and bind a single delegated event listener on the parent element.
