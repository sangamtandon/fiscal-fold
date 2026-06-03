## YYYY-MM-DD - Avoid chained array methods in reactive store
**Learning:** In a vanilla JS architecture with frequent re-renders, chained array methods like `.filter().reduce()` in store selectors create high garbage collection overhead due to intermediate array allocations.
**Action:** Replaced chained methods with single-pass `for` loops in hot path selectors (`getMacroReserved`, `getCommitmentsTotal`, `getMacroSummary`) to minimize GC pressure.
