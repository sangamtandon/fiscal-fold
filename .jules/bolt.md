## 2024-05-15 - Chained Array Methods in Selectors Cause GC Spikes
**Learning:** Due to the vanilla JS architecture's frequent re-renders, chained array methods (`.filter().reduce()`) in local state selectors (`src/data/store.js`) create significant garbage collection overhead.
**Action:** Always use single-pass `for` loops in store selectors to minimize intermediate array allocations and closure overhead.
