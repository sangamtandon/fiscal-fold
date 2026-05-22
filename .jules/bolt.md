## 2024-05-19 - Vanilla Reactive Store Optimizations
**Learning:** Chained array methods (like `.filter().reduce()`) in selectors inside `src/data/store.js` cause significant garbage collection overhead, especially in a vanilla reactive architecture without memoization where components trigger frequent re-evaluations.
**Action:** Replaced chained methods in selectors with single-pass `for` loops to minimize memory allocations and improve iteration performance during frequent re-renders.
