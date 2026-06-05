## 2024-10-25 - Avoid array chaining in frequently called selectors
**Learning:** In this vanilla architecture, reactive state manager selectors are called extremely frequently due to re-renders. Chaining `.filter()` and `.reduce()` in these selectors creates excessive intermediate arrays, leading to high garbage collection overhead and potential UI stutter.
**Action:** Always use single-pass `for` loops in store selectors instead of chained array methods to minimize memory allocations and keep the UI responsive.
