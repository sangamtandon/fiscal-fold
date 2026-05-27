## 2026-05-27 - Array Methods Garbage Collection Overhead
**Learning:** In the local reactive state manager (`src/data/store.js`), frequent re-renders mean chained array methods like `.filter().reduce()` create high garbage collection overhead due to intermediate array allocations.
**Action:** Use single-pass `for` loops instead of chained array methods to reduce garbage collection overhead and improve performance in selectors.
