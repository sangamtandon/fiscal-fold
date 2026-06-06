## YYYY-MM-DD - Initial
**Learning:** Store selector optimization
**Action:** Need to find optimizations for performance

## 2024-05-23 - Store Selector Garbage Collection Optimizations
**Learning:** In the custom reactive store architecture, using chained array methods (like `.filter().reduce()` or multiple `.reduce()` calls) inside frequent selector functions (`getMacroSummary`, `getMacroReserved`, etc.) creates significant garbage collection overhead during rapid vanilla JS re-renders.
**Action:** Replace functional array method chains with single-pass `for` loops in hot code paths like store selectors to minimize temporary object/array allocations.
