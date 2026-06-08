## 2025-06-08 - Garbage Collection overhead in Vanilla JS Reactive Store
**Learning:** Chained array methods (like `.filter().reduce()`) in reactive store selectors create multiple intermediate arrays. Because the vanilla app has a high frequency of re-renders, these short-lived arrays lead to high garbage collection overhead and potential dropped frames.
**Action:** Replace array chains with single-pass `for` loops in hot path selectors (like `getMacroSummary`, `getMacroReserved`, `getBuckets`) to minimize intermediate allocations and improve rendering performance.
