## 2025-02-17 - Date formatting performance bottleneck
**Learning:** Calling `new Date().toLocaleDateString()` inside loops is a severe performance bottleneck because it reinstantiates the date formatter on every iteration. This can make list rendering extremely slow when there are thousands of items.
**Action:** Always instantiate `Intl.DateTimeFormat` once outside the loop (or at the module level) and reuse the instance via `formatter.format(date)` for list rendering or intensive operations.
