## 2024-05-20 - Chained Array Methods Garbage Collection Overhead
**Learning:** In the local reactive state manager (`src/data/store.js`), avoiding chained array methods (e.g., multiple `.filter()` or `.reduce()` calls) in selectors is critical. Due to frequent re-renders in the vanilla architecture, these chains create high garbage collection overhead by creating intermediate array allocations.
**Action:** Replace chained array methods with single-pass `for` loops to minimize memory allocations and improve iteration speed.
