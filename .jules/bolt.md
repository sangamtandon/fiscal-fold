## 2026-05-20 - Avoid Chained Array Methods in Vanilla JS Selectors
**Learning:** In a vanilla JS architecture with a reactive state manager that triggers frequent re-renders, using chained array methods (like `.filter().reduce()`) in selectors creates significant garbage collection overhead due to continuous allocation of intermediate array objects.
**Action:** Replace chained array methods in frequently-called selector functions (e.g., `getBuckets`, `getMacroReserved`) with single-pass `for` loops to minimize GC pauses and improve rendering performance.
