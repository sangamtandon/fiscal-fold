## 2024-05-30 - Replace array chains with single-pass loops in store
**Learning:** In a vanilla JS reactive architecture with frequent re-renders, chained array methods (e.g., multiple `.filter()` or `.reduce()`) in selectors create high garbage collection overhead.
**Action:** Use single-pass `for` loops instead of chained array methods for state selectors to minimize garbage collection and improve rendering performance.
