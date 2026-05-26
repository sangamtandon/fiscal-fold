## 2025-02-12 - Vanilla state manager garbage collection overhead
**Learning:** In the local reactive state manager (`src/data/store.js`), chained array methods (e.g., multiple `.filter()` or `.reduce()` calls) in selectors create high garbage collection overhead due to frequent re-renders in the vanilla architecture.
**Action:** Use single-pass `for` loops instead of chained array methods to avoid intermediate array allocation and reduce memory footprint.
