## 2024-05-15 - Array Method Chaining in store.js
**Learning:** In the local reactive state manager (`src/data/store.js`), using chained array methods (e.g., multiple `.filter()` or `.reduce()` calls) in selectors creates high garbage collection overhead due to frequent re-renders in the vanilla architecture.
**Action:** Use single-pass `for` loops or single array traversals instead of chained array methods to optimize selectors.
