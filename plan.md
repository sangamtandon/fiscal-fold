1.  **Refactor `getBuckets` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace chained `.filter()` calls with a single `for` loop that pushes to an array. Add a comment explaining the GC optimization.
2.  **Refactor `getQuickBuckets` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace `.filter()` with a `for` loop. Add a comment explaining the GC optimization.
3.  **Refactor `getTransactions` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace multiple `.filter()` calls with a single `for` loop that pushes to an array.
4.  **Refactor `getMacroReserved` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace the `.filter().reduce()` chain with a single `for` loop that computes the sum.
5.  **Refactor `getSafeToSpend` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace `.reduce()` with a `for` loop.
6.  **Refactor `getMacroSummary` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace the 3 `.reduce()` calls with a single `for` loop to calculate `allocated`, `spent`, and `swept` simultaneously.
7.  **Refactor `getCommitmentsTotal` in `src/data/store.js`:**
    - Use `replace_with_git_merge_diff` to replace the `.filter().reduce()` chain with a single `for` loop that computes the sum.
8.  **Verify the changes:**
    - Run `pnpm test` to verify that the refactored store selectors still pass all existing unit tests.
9.  **Create `.jules/bolt.md` entry:**
    - Use `run_in_bash_session` to append a journal entry documenting the GC optimization of replacing chained array methods with `for` loops in the vanilla architecture.
10. **Run full test suite:**
    - Run `pnpm test` and `pnpm test:e2e` to ensure no regressions were introduced.
11. **Complete pre commit steps**
    - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
12. **Submit the change:**
    - Create a PR with the title "⚡ Bolt: Optimize store selectors to reduce GC overhead" and description.
