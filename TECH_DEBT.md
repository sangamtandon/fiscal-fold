# Technical Debt Register — fiscal-fold

## Project Snapshot

Fiscal Fold is a vanilla-JS, zero-framework PWA for envelope budgeting using the 50/30/20 rule, targeting salaried Indian professionals (INR). The stack is Vite 5 (build), plain ES Modules (no bundler framework), custom hash-based router (`src/router.js`), a pub/sub reactive store persisted to localStorage (`src/data/store.js`), and a service worker for offline support (`public/sw.js`). Pages live in `src/pages/*.js` with scoped CSS co-located beside them. All state flows exclusively through the store's exported API. Key entry point is `src/main.js` (app shell + dashboard route + PWA logic). Data models are JSDoc typedefs in `src/data/models.js`. Tests split into unit (`vitest`/jsdom) and e2e (`Playwright`). To run tests: `npm test` (unit/integration) or `npm run test:e2e` (Playwright). Build: `npm run build`.

---

## Debt Items

### ✅ [DEBT-001] Seed data uses full ISO datetime strings for cycle dates — fixed in ab30357
- **File:** `src/data/seed.js` (lines 225–232)
- **Category:** Structural
- **Severity:** High
- **Issue:** `generateSeedState()` builds cycle `startDate`/`endDate` by calling `.toISOString()` on JS `Date` objects: `startDate: cycleStart.toISOString()` produces strings like `"2026-04-30T18:30:00.000Z"`. Every date utility in the app — `isCycleExpired()` (`store.js:114`), `daysRemaining()` (`helpers.js:90`), and `cycleDayCount()` (`helpers.js:103`) — splits on `'-'` and takes index `[2]` expecting `"DD"`. For `"2026-04-30T18:30:00.000Z"`, index 2 is `"30T18:30:00.000Z"`, which coerces to `NaN`. Consequences in demo mode: `daysRemaining` always returns 0 (safe-to-spend hint says "0 days to payday"), `isCycleExpired` returns `false` (payday banner never fires), and `cycleDayCount` returns `NaN` so leak-warning `timePercent` is `NaN` and no leaks ever show. Additionally, `.toISOString()` on a local-midnight Date shifts the UTC date by the user's UTC offset, so a user in IST (+5:30) sees cycle dates one day earlier than intended.
- **Fix:** In `generateSeedState()`, replace both `.toISOString()` calls with a local-date formatter. Add a one-line helper at the top of `seed.js`:
  ```js
  const fmtLocal = d =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  ```
  Then change lines 228–229:
  ```js
  startDate: fmtLocal(cycleStart),
  endDate:   fmtLocal(cycleEnd),
  ```
  Same fix for `createdAt` on the cycle object (line 232) — use `.toISOString()` there since `createdAt` is never parsed by the date utilities.
- **Risk:** Low — only affects seed/demo data, not production user cycles (which use `fmt(d)` already in `onboarding.js:782` and `payday.js:213`).
- **Dependencies:** None

---

### ✅ [DEBT-002] `getState()` returns internal state by mutable reference — fixed (returns shallow copy)
- **File:** `src/data/store.js` (line 88)
- **Category:** Structural
- **Severity:** High
- **Issue:** `export function getState() { return _state; }` gives callers a direct reference to the live internal state object. Any mutation (e.g., `getState().user.name = 'x'`) silently bypasses `save()` and `notify()`, causing localStorage and in-memory state to drift. Current violation: `commitments.js:94–99` calls `getState().commitments` and iterates over it for reads and finds, which is safe today but encourages the pattern. The dev toolbar (`seed.js:359`) also uses `getState()` for logging — safe but sets precedent.
- **Fix:** Return a shallow-cloned snapshot. Change `store.js:88`:
  ```js
  export function getState() {
    return { ..._state };
  }
  ```
  For deeper safety on `cycles`, `buckets`, `transactions` arrays, use:
  ```js
  export function getState() {
    return {
      ..._state,
      cycles:       [..._state.cycles],
      buckets:      [..._state.buckets],
      transactions: [..._state.transactions],
      commitments:  [..._state.commitments],
      sweeps:       [..._state.sweeps],
    };
  }
  ```
  Add a companion selector `getAllCommitments()` to replace the `getState().commitments` access in `commitments.js` (see DEBT-005).
- **Risk:** Any code that mutates the returned object expecting it to affect the store will silently stop working. Grep for `getState()\.` in the codebase before applying — currently only `seed.js` (dev toolbar, safe) and `commitments.js` (read-only find, safe).
- **Dependencies:** DEBT-005 (add `getAllCommitments()` first so `commitments.js` can switch away from `getState().commitments`)

---

### ✅ [DEBT-003] Dashboard's recent-transactions list always shows `−` — fixed in 5e3bd86
- **File:** `src/main.js` (lines 626–640)
- **Category:** Refactor
- **Severity:** High
- **Issue:** `renderTransaction(emoji, name, amount, time, borrowedFromName, note)` at line 637 unconditionally renders `−${formatCurrency(amount)}`. The caller at line 391–403 passes `t.amount` but never passes the transaction `type`. If a user logs income to a bucket (type `'income'`) or a refund, it appears as `−₹X` in the dashboard Recent Transactions list. The Transaction History page (`transactions.js:200`) correctly handles this with `isIncome ? '+' : '−'`.
- **Fix:** Add a `type` parameter to `renderTransaction`. Change its signature in `main.js:626`:
  ```js
  function renderTransaction(emoji, name, amount, time, borrowedFromName, note, type = 'expense') {
  ```
  Change line 637 to:
  ```js
  const isIncome = type === 'income' || type === 'refund';
  ```
  And the amount span:
  ```js
  <span ... >${isIncome ? '+' : '−'}${formatCurrency(amount)}</span>
  ```
  Update the call site in `main.js:392–399` to pass `t.type` as the last argument:
  ```js
  return renderTransaction(
    bucket?.emoji || '📝',
    bucket?.name || 'Unknown',
    t.amount,
    timeAgo(t.timestamp),
    t.borrowedFrom ? getBucketById(t.borrowedFrom)?.name : null,
    t.note,
    t.type,
  );
  ```
- **Risk:** Low — additive change, no data touched.
- **Dependencies:** None

---

### [DEBT-004] `window.confirm()` used for destructive actions — breaks design system
- **File:** `src/pages/settings.js` (line 537), `src/pages/transactions.js` (line 284)
- **Category:** Refactor
- **Severity:** Medium
- **Issue:** Two places use the synchronous `window.confirm()` for destructive actions: (1) removing a bucket in Settings, and (2) deleting a transaction in the history page. Browser `confirm()` is unstyled, blocks the event loop, shows the origin URL, and can be suppressed by pop-up blockers. The Settings page already has a correctly implemented two-step confirmation pattern (the "Danger Zone" reset button at `settings.js:252–270`) — an `id="reset-confirm"` div toggled `hidden`.
- **Fix (settings.js):** In `_handleRemoveBucket()` at `settings.js:534–541`, remove the `confirm()` call and replace with the Danger Zone pattern inline. Add a confirmation div below the bucket row in `_renderBucketGroup()`, show it on the × button press, wire Cancel/Confirm buttons, and remove it on either.
  
  **Fix (transactions.js):** In `_wireEvents()` at `transactions.js:276–288`, replace `confirm()` with an inline confirmation state. When the delete button is clicked, replace the row temporarily with a confirmation strip: `[Cancel] [Delete — this can't be undone]`. Wire both buttons. Use `data-txn-id` on the row to find it.
- **Risk:** Moderate — these are UI changes. Test that cancelling does not delete, and confirming does delete and re-renders the list correctly.
- **Dependencies:** None

---

### ✅ [DEBT-005] `commitments.js` reads `getState().commitments` directly — fixed in 0ad53bd
- **File:** `src/pages/commitments.js` (lines 94–99, 145, 159, 170, 179, 184), `src/data/store.js`
- **Category:** Reusability
- **Severity:** Medium
- **Issue:** `getCommitments()` in the store intentionally filters to active-only. The commitments management page needs both active and inactive commitments (to show "paused" items). It works around this by calling `getState().commitments` directly in at least 7 places. This bypasses the store API contract and will silently break if `getState()` is made to return a copy (DEBT-002).
- **Fix:** Add `getAllCommitments()` to `store.js` after line 169:
  ```js
  /** @returns {import('./models.js').Commitment[]} */
  export function getAllCommitments() {
    return [..._state.commitments];
  }
  ```
  In `commitments.js`, add `getAllCommitments` to the import from `'../data/store.js'`. Replace every `getState().commitments` call with `getAllCommitments()`. Specifically: lines 94, 145, 159, 170, 179, 184. The `.find(x => x.id === id)` pattern stays the same.
- **Risk:** Low — pure refactor, behavior unchanged.
- **Dependencies:** None (do this before DEBT-002)

---

### [DEBT-006] Seed data uses hardcoded sequential IDs instead of `uid()`
- **File:** `src/data/seed.js` (lines 48–103)
- **Category:** Structural
- **Severity:** Medium
- **Issue:** Bucket IDs in `generateSeedState()` are hardcoded strings: `id: \`needs-${i}\``, `id: \`wants-${i}\``, `id: \`future-${i}\``. All production code generates IDs via `uid()` (which returns a crypto UUID). The hardcoded IDs: (1) look like sequential counters, not UUIDs, breaking any future validation or ID-format checks; (2) don't conflict with each other within a seed operation, but would conflict if seed data were ever merged with real user data; (3) create a subtle assumption that `getBucketById('needs-0')` will always exist in demo mode. If the seed format changes, these string IDs become stale references across the codebase's hardcoded `bucket: 'wants-3'` references in `txnData`.
- **Fix:** At the top of `generateSeedState()`, pre-generate IDs with `uid()` and reference them by name:
  ```js
  const ids = {
    needs: Array.from({ length: 5 }, uid),
    wants: Array.from({ length: 6 }, uid),
    future: Array.from({ length: 3 }, uid),
  };
  ```
  Replace `id: \`needs-${i}\`` with `id: ids.needs[i]` (and similar for wants/future). Update `txnData` array to use `ids.needs[0]`, `ids.wants[0]`, etc. instead of `'needs-0'`, `'wants-0'`. Update the trade-off txn similarly.
- **Risk:** Low — demo-data only. After this fix, IDs won't be predictable strings, so any test that hardcodes `'needs-0'` as a bucket ID would break (none currently do — tests use `builders.js` / `freshStore`).
- **Dependencies:** None

---

### [DEBT-007] `addIncome()` untargeted path silently skips offline queue and `notify('transactions')`
- **File:** `src/data/store.js` (lines 710–728)
- **Category:** Observability
- **Severity:** Medium
- **Issue:** The `addIncome(amount, undefined, note)` path (untargeted — "add to overall budget") updates `cycle.salary` and `cycle.allocations`, but does NOT create a transaction record and does NOT call `notify('transactions')`. This means: (1) untargeted income is invisible in the Transaction History page; (2) the dashboard "Recent Transactions" list doesn't refresh for untargeted income (the `rerender()` call in `income-modal.js:249` triggers a hashchange re-render, so the dashboard does refresh — but the income doesn't appear in the recent list, silently); (3) if a cloud BaaS is added later, untargeted income will never be queued to the offline sync layer. The targeted path (line 692–709) creates a transaction record and calls `notify('transactions')`.
- **Fix:** In the `else` branch of `addIncome()` (starting at `store.js:712`), after updating `cycle.salary` and `cycle.allocations`, push a synthetic income transaction to record it in history:
  ```js
  _state.transactions.push({
    id: uid(),
    cycleId: _state.currentCycleId,
    bucketId: null,
    amount,
    type: 'income',
    note: note || 'Added to overall budget',
    borrowedFrom: null,
    borrowedAmount: 0,
    timestamp: new Date().toISOString(),
  });
  notify('transactions');
  ```
  Update the `Transaction` typedef in `models.js` to note that `bucketId` can be `null` for untargeted income (it is already typed as `string`, make it `string|null`). Update `_renderTxnRow` in `transactions.js` to handle `bucket === undefined` (it already does: `bucket?.name || 'Unknown'` and `bucket?.emoji || '📝'`).
- **Risk:** Medium — adds a new transaction type. Verify that `removeTransaction()` handles a `null`-`bucketId` transaction gracefully. Currently `removeTransaction()` at `store.js:470` does `const bucket = _state.buckets.find(b => b.id === txn.bucketId)` — if `bucketId` is null, `find()` returns undefined and the `if (bucket)` block is skipped (correct). The `cycle.allocations` change is not reversed on delete, so deleting an untargeted income transaction would leave the cycle salary inflated. Document this limitation or implement reversal in `removeTransaction()`.
- **Dependencies:** None

---

### [DEBT-008] Largest-remainder rounding correction always given to the last bucket
- **File:** `src/data/store.js` (lines 634–652), `src/pages/settings.js` (lines 508–521)
- **Category:** Refactor
- **Severity:** Medium
- **Issue:** `copyBucketsToNewCycle()` rounds each bucket's new allocation with `Math.round()`, then corrects the rounding error by adding the remainder to `newBuckets[newBuckets.length - 1]`. `_recalculateBucketAllocations()` in `settings.js` does the same (line 515: `i === buckets.length - 1 ? newTotal - distributed : Math.round(...)`). The true largest-remainder algorithm should give the correction to the bucket with the largest fractional part, preventing one bucket from accumulating ±₹1 corrections every cycle. Over 12 cycles, the last bucket may gain or lose ₹12 relative to expectation.
- **Fix:** Implement the Largest Remainder Method in both locations. Extract it to a shared helper in `utils/helpers.js`:
  ```js
  /**
   * Distribute `total` across buckets proportionally, with rounding handled
   * by the largest-remainder method so the sum is exact.
   * @param {number[]} weights - Relative proportions (need not sum to 1)
   * @param {number} total - Integer total to distribute
   * @returns {number[]}
   */
  export function distributeProportionally(weights, total) {
    const sumW = weights.reduce((s, w) => s + w, 0) || 1;
    const exact = weights.map(w => (w / sumW) * total);
    const floored = exact.map(Math.floor);
    const remainder = total - floored.reduce((s, v) => s + v, 0);
    const fractionals = exact.map((v, i) => ({ i, frac: v - floored[i] }))
      .sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < remainder; k++) floored[fractionals[k].i]++;
    return floored;
  }
  ```
  Use it in `copyBucketsToNewCycle()` replacing lines 634–652 and in `_recalculateBucketAllocations()` in `settings.js` replacing lines 512–520.
- **Risk:** Medium — affects cycle transitions and salary recalculation. Run `npm test` and verify precision tests still pass. Check `tests/unit/precision.spec.js`.
- **Dependencies:** None

---

### [DEBT-010] Leak warnings still render when cycle is expired (misleading on payday screen)
- **File:** `src/main.js` (lines 304–319, 407–427)
- **Category:** Refactor
- **Severity:** Medium
- **Issue:** When `cycleExpired` is `true`, the dashboard computes and renders leak-warning cards (`⚡`) for the current (expired) cycle's buckets. The user is on the payday screen prompt — bucket spending pace is irrelevant at cycle end. Showing "Groceries — 95% spent with 0 days left" when the cycle ended is noise that contradicts the "payday" celebration message directly above it.
- **Fix:** Wrap the `leaks` array computation and the leak-warnings render block in a `!cycleExpired` guard. In `main.js` after line 319, before the `container.innerHTML` assignment:
  ```js
  const leaks = cycleExpired ? [] : (() => {
    // ... existing leak computation
  })();
  ```
  Or more simply, add `if (!cycleExpired)` before the `buckets.forEach(b => {...})` block at line 310.  The "All clear" card should also be suppressed when `cycleExpired` — replace the entire ternary at line 407 with: `${!cycleExpired ? (leaks.length > 0 ? ... : ...) : ''}`.
- **Risk:** Low — display-only change.
- **Dependencies:** None

---

### ✅ [DEBT-011] Date-string sort creates `new Date()` objects per comparison — fixed in 8846ef3
- **File:** `src/data/store.js` (line 161, line 736), `src/utils/txn-grouping.js` (line 88)
- **Category:** Scalability
- **Severity:** Low
- **Issue:** Three sort comparators construct `Date` objects on every comparison call:
  - `store.js:161`: `txns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))`
  - `store.js:736`: same pattern in `getAllTransactions()`
  - `txn-grouping.js:88`: same pattern
  
  ISO 8601 timestamps (`"2026-05-01T10:30:00.000Z"`) sort correctly as plain strings. String comparison is ~10× faster than Date construction and avoids GC pressure as transaction count grows.
- **Fix:** Replace each comparator with a lexicographic string compare:
  ```js
  // before
  txns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  // after
  txns.sort((a, b) => (b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0));
  ```
  Apply the same change at all three locations. Verify the existing sort tests in `tests/unit/txn-grouping.spec.js` still pass.
- **Risk:** Low — behaviour identical for valid ISO timestamps. Only breaks if timestamps are not ISO strings (the store always writes `new Date().toISOString()`).
- **Dependencies:** DEBT-001 should be resolved first so seed data timestamps are consistent.

---

### ✅ [DEBT-012] `income-modal.js` confirm step has a redundant dead-code bucket lookup — fixed in 4fc0a0a
- **File:** `src/pages/income-modal.js` (lines 199–205)
- **Category:** Refactor
- **Severity:** Low
- **Issue:** `_renderConfirm()` finds the selected bucket via:
  ```js
  const b = getBuckets().find(bk => bk.id === _targetBucketId) ||
            [...getBuckets('needs'), ...getBuckets('wants'), ...getBuckets('future')].find(bk => bk.id === _targetBucketId);
  ```
  `getBuckets()` with no argument already returns all cycle buckets (`store.js:124–127` skips the `macroType` filter when undefined/falsy). The fallback `[...getBuckets('needs'), ...]` produces the same result set and can never execute. This dead code also calls `getBuckets` four times when once suffices.
- **Fix:** Simplify `income-modal.js:199–205` to:
  ```js
  const bucket = getBuckets().find(bk => bk.id === _targetBucketId);
  const targetLabel = _targetBucketId
    ? (bucket ? `${bucket.emoji} ${bucket.name}` : 'Unknown bucket')
    : '🏦 Overall budget';
  ```
- **Risk:** None.
- **Dependencies:** None

---

### ✅ [DEBT-013] Transaction history search triggers full DOM re-render on every keystroke — fixed in 3b14a7b
- **File:** `src/pages/transactions.js` (lines 261–264)
- **Category:** Scalability
- **Severity:** Medium
- **Issue:** The search `input` event handler calls `_refreshList(container)` on every keystroke. `_refreshList` calls `getAllTransactions()` (creates a sorted copy of all transactions) then serializes the full filtered list to HTML and sets `innerHTML`. For a user with 2+ years of history (700+ transactions), this creates visible UI lag on mobile. The `debounce` utility already exists in `src/utils/helpers.js` but is not used here.
- **Fix:** Import `debounce` in `transactions.js` (it's already in the helpers import at line 17 but only `formatCurrency` and `timeAgo` are imported). Add `debounce` to the import:
  ```js
  import { formatCurrency, timeAgo, debounce } from '../utils/helpers.js';
  ```
  Wrap the search handler in `_wireEvents` at line 262:
  ```js
  container.querySelector('#txn-search').addEventListener('input', debounce(e => {
    _searchQuery = e.target.value;
    _refreshList(container);
  }, 200));
  ```
- **Risk:** Low — 200ms delay is imperceptible to users but eliminates redundant renders per keystroke. Existing e2e tests that type and immediately assert should still pass since Playwright awaits DOM updates.
- **Dependencies:** None

---

### ✅ [DEBT-014] Lazy dynamic `import('../router.js')` inside event handlers — fixed in ad780df
- **File:** `src/pages/commitments.js` (line 129), `src/pages/payday.js` (lines 136, 224–227)
- **Category:** Structural
- **Severity:** Low
- **Issue:** `commitments.js` and `payday.js` import `router.js` lazily inside event handlers via `import('../router.js').then(...)`. Since Vite bundles all static imports together, `router.js` is already in the chunk by the time these pages load — the dynamic import just re-resolves the cached module asynchronously with no size benefit. In `payday.js:224–227`, the `navigate('/dashboard')` call is inside a `.then()` that executes AFTER the `try/catch` exits. If the dynamic import micro-task is delayed (extremely unlikely but possible under load), `navigate()` never fires and the user is stuck on the payday page with a new cycle already created.
- **Fix:** In `commitments.js`, add `navigate` to the static import at the top of the file (alongside `showToast`). Replace `import('../router.js').then(({ navigate }) => navigate('/settings'))` at line 129 with `navigate('/settings')`. In `payday.js`, import `navigate` statically at the top of the file and replace both lazy `import('../router.js').then(...)` usages with direct `navigate('/dashboard')` calls (lines 136 and 225–227).
- **Risk:** Low — `router.js` is guaranteed to be available when these modules are loaded.
- **Dependencies:** None

---

### [DEBT-015] `src/main.js` is a 659-line god file — dashboard route, app shell, PWA logic all co-located
- **File:** `src/main.js` (lines 277–641)
- **Category:** Structural
- **Severity:** Medium
- **Issue:** `main.js` currently combines: (1) app shell rendering + event wiring (PWA offline badge, SW registration, install banner), (2) all route registrations (including a 237-line inline `/dashboard` route handler), (3) the `renderMacroBar()` helper (75 lines), and (4) the `renderTransaction()` helper. The dashboard route alone (`route('/dashboard', ...)`, lines 277–514) is larger than several dedicated page modules. This makes the file difficult to navigate, hard to test (the dashboard render logic cannot be unit-tested without mocking the entire shell), and a merge-conflict hotspot.
- **Fix:** Extract the dashboard page into `src/pages/dashboard.js` following the same pattern as other page modules:
  1. Create `src/pages/dashboard.js` with a single export `export function renderDashboardPage(container)`.
  2. Move the entire body of the `/dashboard` route handler (lines 278–514) into `renderDashboardPage`.
  3. Move `renderMacroBar()` and `renderTransaction()` (lines 552–640) into `dashboard.js` as private helpers.
  4. In `main.js`, add `route('/dashboard', (container) => { updateShellVisibility(); updateHeaderGreeting(); import('./pages/dashboard.js').then(m => m.renderDashboardPage(container)); });` (or static import if preferred).
  5. Create `src/pages/dashboard.css` for any dashboard-specific styles currently in `style.css`.
- **Risk:** Moderate — large refactor. Ensure the cleanup function returned from the dashboard route (the `clearInterval(timer)` lambda at line 513) is preserved. The dashboard module imports from store, helpers, toast, router — all standard. E2e tests targeting `data-testid` attributes don't care which file renders them.
- **Dependencies:** DEBT-003 (fix renderTransaction first so it's correct when extracted)

---

### [DEBT-016] `_pickEmojiPrompt` in settings.js cycles to next palette emoji instead of opening a picker
- **File:** `src/pages/settings.js` (lines 658–662)
- **Category:** Refactor
- **Severity:** Low
- **Issue:** `_pickEmojiPrompt(current)` is named like a picker that would open a UI, but it simply returns the next emoji in `EMOJI_PALETTE`:
  ```js
  function _pickEmojiPrompt(current) {
    const idx = EMOJI_PALETTE.indexOf(current);
    const next = (idx + 1) % EMOJI_PALETTE.length;
    return EMOJI_PALETTE[next];
  }
  ```
  The emoji span has `style="cursor:pointer"` implying it's interactive, but clicking cycles to the next emoji silently. Users who want a specific emoji must click through up to 32 emojis to reach it. This is a placeholder that was never replaced with a proper grid picker.
- **Fix:** Replace `_pickEmojiPrompt` with an inline emoji grid picker that opens on click. When the emoji span is clicked, insert a `<div class="emoji-picker-popup">` below it containing the full `EMOJI_PALETTE` as buttons, and close it on selection or outside click. This is a self-contained UI change within `_openBucketEditInline()`. The commitments form already has this as a full grid (`cm-emoji-grid` in `_renderForm`, commitments.js:364–368) — reuse that exact HTML/CSS pattern. Extract the emoji grid HTML into a shared helper:
  ```js
  // In a shared util or inline:
  function renderEmojiGrid(selectedEmoji, onSelect) { ... }
  ```
- **Risk:** Low — purely additive UX improvement. Does not touch data layer.
- **Dependencies:** None

---

### [DEBT-017] Onboarding hardcodes `dueDate: 1` when a recurring bucket creates a Commitment
- **File:** `src/pages/onboarding.js` (line 818)
- **Category:** Refactor
- **Severity:** Low
- **Issue:** In `finishOnboarding()`, when `b.isRecurring` is true, a Commitment is created with `dueDate: 1` hardcoded:
  ```js
  addCommitment({
    name: b.name,
    emoji: b.emoji,
    amount: b.allocated ?? 0,
    dueDate: 1,   // ← always the 1st
    macroType,
  });
  ```
  The user marked the bucket as recurring (🔄 toggle in Step 4) but had no opportunity to specify when the bill is due. The commitment will show as "Due on the 1st" even for something like a credit card bill due on the 25th.
- **Fix:** Add a `dueDate` field to the onboarding bucket data structure. When the recurring toggle is activated for a bucket in Step 4, show a compact day-of-month chip row (reuse `renderDayPicker`/`bindDayPicker` from `utils/day-of-month-picker.js`) underneath that bucket's row — pre-selected to 1. Store the selected day in `bucket.dueDate`. Pass `dueDate: b.dueDate ?? 1` to `addCommitment()`. The chip row should only appear when `b.isRecurring === true`, collapsing when toggled off.
- **Risk:** Low — additive to existing bucket form. The `renderBucketItem()` function must be updated to include the inline picker, and `wireUpBucketEvents` must handle `bindDayPicker` for each recurring bucket row.
- **Dependencies:** None

---

### [DEBT-018] Transaction modal keypad has no decimal key; income modal does — inconsistency
- **File:** `src/pages/transaction-modal.js` (lines 149–151), `src/pages/income-modal.js` (line 81)
- **Category:** Refactor
- **Severity:** Low
- **Issue:** The expense transaction modal keypad renders keys `[1,2,3,4,5,6,7,8,9,'C',0,'⌫']` — no decimal point. The income modal renders `['1','2','3','4','5','6','7','8','9','.','0','⌫']` — with a decimal. INR amounts for individual expenses are almost always whole rupees, but the UI inconsistency is jarring for users who expect parity. The `_handleKey()` function in `transaction-modal.js` already calls `parseFloat(_amountStr)`, so decimals would work if the key were present.
- **Fix:** Replace `'C'` in the transaction modal keypad keys array at `transaction-modal.js:149` with `'.'`:
  ```js
  ${[1,2,3,4,5,6,7,8,9,'.',0,'⌫'].map(...)}
  ```
  Update `_handleKey()` to handle `'.'` (same logic as income modal line 102–103): add a dot only if `_amountStr` doesn't already contain one. Remove or re-purpose the `'C'` (clear all) key — it can be replaced by holding `⌫`, or move it to a separate "Clear" button.
- **Risk:** Low — `_handleKey` already parses with `parseFloat`, so decimal input works; only the key needs adding.
- **Dependencies:** None

---

### [DEBT-019] `updateAllocCards()` and `renderDonut()` in onboarding use `document.querySelector` — should be scoped
- **File:** `src/pages/onboarding.js` (lines 422–431, 434)
- **Category:** Refactor
- **Severity:** Low
- **Issue:** `updateAllocCards()` calls `document.querySelector(\`#alloc-${type}\`)` and `renderDonut()` calls `document.getElementById('donut-chart')`. These are global DOM queries rather than scoped to the onboarding container. This is safe as long as only one onboarding instance exists, but it's fragile: if the DOM is ever rendered in a shadow DOM, an iframe, or multiple instances, the selectors will silently pick the wrong element. All other step-specific interactions in onboarding correctly scope queries to `container`.
- **Fix:** Thread the `container` reference through to `updateAllocCards` and `renderDonut`. Change their signatures:
  ```js
  function updateAllocCards(salary, container) { ... }
  function renderDonut(container) { ... }
  ```
  Inside each, replace `document.querySelector(...)` with `container.querySelector(...)`. Update all call sites to pass the step container (the `stepContent` element from `renderStep3`).
- **Risk:** None — same behaviour, scoped correctly.
- **Dependencies:** None

---

### [DEBT-020] User-controlled strings (bucket names, notes) inserted unescaped into `innerHTML`
- **File:** Multiple — `src/main.js` (lines 633–634, 636), `src/pages/transactions.js` (lines 191, 197), `src/pages/commitments.js` (lines 199), `src/pages/settings.js` (line 207), and others
- **Category:** Structural
- **Severity:** Medium
- **Issue:** All page renderers build HTML via template literals and assign to `innerHTML`. User-controlled values — bucket names (e.g., `b.name`), transaction notes (`t.note`), commitment names (`c.name`) — are interpolated directly without HTML escaping. A user who types `<img src=x onerror="alert(1)">` as a bucket name would execute arbitrary JavaScript when that name is rendered anywhere in the UI. While this is a local-only PWA with no multi-user surface, the risk increases if: (a) the app ever allows importing state from a JSON file (already supported in `exportAllDataJSON`), meaning a malicious JSON could inject scripts; or (b) a BaaS backend syncs data from another device/user.
- **Fix:** Add a one-line HTML escaper to `src/utils/helpers.js`:
  ```js
  export function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  ```
  Import and apply `escapeHtml()` to all user-provided string values interpolated inside innerHTML template literals. Values from `models.js` constants (like `EMOJI_PALETTE`, `BUCKET_TEMPLATES`) are trusted and don't need escaping. Apply to: `b.name`, `b.emoji` (emojis are safe but be consistent), `t.note`, `c.name`, `user.name` in `updateHeaderGreeting()`. Note: `value="${...}"` in input elements is also a risk for attribute injection — use `escapeHtml()` there too.
- **Risk:** Medium — a missed escaping call anywhere in the codebase reintroduces the vulnerability. Consider a lint rule or a templating wrapper function. After applying, test the import-JSON flow with a state file containing `<script>` tags in bucket names to verify it renders safely.
- **Dependencies:** None

---

### [DEBT-021] Page CSS files accumulate as global stylesheets and are never unloaded on navigation
- **File:** `src/pages/onboarding.js:11`, `transactions.js:10`, `transaction-modal.js:11`, `commitments.js:12`, `payday.js:8`, `settings.js:8`, `income-modal.js:10`
- **Category:** Scalability
- **Severity:** Low
- **Issue:** Each page module imports its CSS: `import './onboarding.css'`. Vite injects these as `<style>` tags when the module is first loaded (dynamically imported pages get their CSS injected on first visit). These tags are never removed when navigating away. All page CSS is globally scoped once loaded. Currently safe because all selectors use unique prefixes (`.onboarding__`, `.txn-`, `.cm-`, `.pd-`, `.settings-`). As the codebase grows, conflicting class names between pages become a risk.
- **Fix:** This is largely inherent to Vite's CSS handling without CSS Modules. The mitigation is: (1) enforce the naming convention rule in code review (each page must prefix all classes with `<page>__`); (2) optionally migrate to CSS Modules (rename files to `*.module.css` and use `import styles from './page.module.css'`). For now, document the constraint in `ARCHITECTURE.md` under Design Decisions.
- **Risk:** Low for current codebase — no conflicts exist today.
- **Dependencies:** None

---

### [DEBT-022] Service worker cache version `'fiscal-fold-v1'` is hardcoded — stale assets after deploy
- **File:** `public/sw.js` (line 9)
- **Category:** Observability
- **Severity:** Low
- **Issue:** `const CACHE = 'fiscal-fold-v1'` is a static string. The SW's `activate` handler deletes all caches whose name is not `'fiscal-fold-v1'`. When new assets are deployed but the SW file itself doesn't change, the SW won't reinstall and the old cache version keeps serving. Assets are revalidated in the background (stale-while-revalidate strategy), so users eventually get updates — but only after the first cache hit serves the stale version.
- **Fix:** Inject the cache name from the build. In `vite.config.js` (create if it doesn't exist), use `define` to inject a build-time cache buster:
  ```js
  // vite.config.js
  export default {
    define: {
      __CACHE_VERSION__: JSON.stringify(`fiscal-fold-${Date.now()}`),
    },
  };
  ```
  In `sw.js`, change line 9 to `const CACHE = '__CACHE_VERSION__';`. This causes the SW to change on every build, triggering reinstall and old-cache deletion. Alternatively, use Vite's `workbox` plugin for full SW lifecycle management.
- **Risk:** Low — only affects SW behavior. If the `vite.config.js` approach is used, `__CACHE_VERSION__` must be a `define` key (not just `import.meta.env`) since SWs don't support ES module syntax.
- **Dependencies:** None

---

### ✅ [DEBT-023] Post-sweep overdraft — `addTransaction` accepts expenses against already-swept buckets — fixed in 430d943
- **File:** `src/data/store.js` (`addTransaction`, lines 381–412; `runSweep`, lines 555–597)
- **Category:** Structural
- **Severity:** High
- **Issue:** `runSweep()` records `b.swept = remaining` on each bucket and writes a `Sweep` record promising that money to the next cycle's Future allocation. However, `addTransaction()` has no guard against this — it will happily debit a bucket that has `swept > 0`, silently spending money that was already committed to the next cycle. The inconsistency means `getSafeToSpend()` (which subtracts `b.swept` from remaining) can go negative without throwing, and the next cycle's Future allocation will be over-counted by whatever was spent post-sweep. This is a **confirmed bug** tracked by a `it.fails` canary in `tests/integration/lifecycle.spec.js:119`. The test comment lists two acceptable fixes: (a) reject the transaction in `addTransaction` when `bucketId` has `swept > 0`, or (b) lock the bucket in `runSweep`.
- **Fix (option a — minimal, preferred):** In `addTransaction()` at `store.js:398`, after finding the bucket, add a guard before the `if (type === 'expense')` branch:
  ```js
  if (bucket && type === 'expense' && (bucket.swept ?? 0) > 0) {
    throw new Error(`addTransaction: bucket "${bucket.name}" has been swept — start a new cycle before logging expenses`);
  }
  ```
  After applying the fix, remove the `.fails` marker from `lifecycle.spec.js:119` (change `it.fails(` to `it(`).
- **Risk:** Medium. Any call site that logs an expense after sweep without starting a new cycle will now throw. Verify the payday flow: `_startNewCycle` in `payday.js` calls `runSweep()` then immediately calls `createCycle()` and `copyBucketsToNewCycle()` — the new cycle's buckets are fresh (no `swept`), so post-cycle transactions are safe. The only risky path is if a user somehow logs a transaction between `runSweep()` and `createCycle()`, which is impossible through the UI (the sweep and new-cycle creation are sequential in `_startNewCycle`).
- **Dependencies:** None

---

## Priority Queue

Ordered by ROI for agentic development velocity (highest impact, lowest risk first):

1. **DEBT-001** — Seed ISO timestamp bug breaks all date math in demo mode (users see "0 days remaining" immediately)
2. **DEBT-023** — Post-sweep overdraft: confirmed `it.fails` bug in `lifecycle.spec.js:119`, minimal one-line guard fix
3. **DEBT-003** — Income shows as negative on dashboard (wrong sign — visible regression)
4. **DEBT-005** — Add `getAllCommitments()` (prerequisite for DEBT-002, low-risk, high structural value)
5. **DEBT-013** — Search debounce (single-line fix, high UX payoff at scale)
6. **DEBT-002** — Make `getState()` return a copy (hardened store integrity; do after DEBT-005)
7. **DEBT-010** — Leak warnings on expired cycle (misleads user at payday)
8. **DEBT-014** — Remove lazy router imports in commitments/payday (remove async error gap)
9. **DEBT-004** — Replace `window.confirm()` with inline confirmation (design system consistency)
10. **DEBT-007** — Record untargeted income as a transaction (history visibility)
11. **DEBT-008** — Largest-remainder rounding (financial precision, extract reusable helper)
12. **DEBT-020** — HTML escaping for user-controlled strings (security hygiene)
13. **DEBT-006** — Use `uid()` in seed data (structural cleanliness)
14. **DEBT-011** — Lexicographic timestamp sort (performance, minor)
15. **DEBT-012** — Remove dead code in income-modal confirm step (clarity)
16. **DEBT-015** — Extract dashboard page to `src/pages/dashboard.js` (structural; large refactor, do last among mediums)
17. **DEBT-017** — Onboarding commitment dueDate input
18. **DEBT-018** — Add decimal key to transaction modal keypad
19. **DEBT-016** — Replace `_pickEmojiPrompt` with a real grid picker
20. **DEBT-019** — Scope `document.querySelector` calls in onboarding
21. **DEBT-022** — Build-time SW cache busting
22. **DEBT-021** — Document CSS naming convention (no code change needed, just ARCHITECTURE.md note)

---

## Intentional Decisions (Do Not Change)

The following patterns look like debt but are deliberate design choices verified against the actual source code and commit history. An agent must not refactor these:

1. **No JavaScript framework.** Vanilla JS is intentional for bundle size and PWA philosophy. Do not introduce React, Vue, Svelte, or any VDOM layer.

2. **Hash-based routing.** `src/router.js` uses `window.location.hash`. Do not migrate to History API routing — it requires server-side fallback config incompatible with any static host.

3. **JSDoc types over TypeScript.** All type annotations are JSDoc `@typedef`s. Do not add `tsconfig.json` or rename files to `.ts`. The decision was explicit: "IDE autocompletion without a build step."

4. **`localStorage` as the only persistence layer.** No IndexedDB for app state (only for the offline queue sync marker). `src/data/store.js` is the single source of truth. Do not add a second persistence path.

5. **`offlineQueue.js` is a BaaS sync stub.** `enqueue()` is called but `flush()` only returns queued items and logs them — there is no actual HTTP sync. This is deliberate: "purely a sync-marker until a cloud backend is wired in." Do not add real HTTP sync without a broader BaaS sprint.

6. **Needs budget surplus is forfeited at cycle end.** In `runSweep()` (`store.js:556–562`), only `wants` and `future` buckets are swept. The comment `// Needs surplus is intentionally forfeited at cycle end (D3)` documents this. Do not add Needs to the sweep.

7. **`percent` in `getMacroSummary` is not clamped to 100.** The canary test in `store.selectors.spec.js` line 39 explicitly asserts `percent` can exceed 100 (250 in the test case). The UI in `renderMacroBar` uses `Math.max(0, remainingPct)` to clamp the visual, but the raw `summary.percent` is unclamped for consumer flexibility. Do not add clamping in `getMacroSummary`.

8. **Module-level state in page modules.** `onboarding.js` (`currentStep`, `formData`), `transactions.js` (`_activeFilter`, `_searchQuery`, `_viewMode`), `transaction-modal.js` (`_step`, `_amount`, etc.) all use module-level variables. This is the explicit state-management pattern for local page/modal state that predates a component system. These are always reset at the entry point of each render call. Do not refactor to class instances or closures unless extracting pages to their own modules.

9. **`getCommitments()` returns only active commitments.** This is the correct behavior for the dashboard and all budget calculations. Pages that need inactive commitments use `getAllCommitments()` (after DEBT-005) or raw state. Do not change `getCommitments()` to return all commitments.

10. **INR currency formatting with `Intl.NumberFormat('en-IN', { currency: 'INR' })`** — Indian lakh/crore grouping is intentional for the primary audience. Do not change the locale or currency.

11. **Amber/warn color for over-budget, never red.** Core UX philosophy. `var(--warn)` is the over-budget color. Do not use `--danger` or red for budget warnings (only for the Danger Zone reset button in Settings).

12. **"unassigned" wording in the onboarding pool counter.** Commit `05fb0ef` ("Rename legend/counter copy: quick access, unassigned") deliberately changed the counter label from `'left to assign'` to `'unassigned'` — described as "less instructional, more factual." Do not change it back.

---

## Agent Instructions

Rules the fixing agent must follow for every debt item:

- **Always run `npm run build` after each fix** to verify no regressions before committing.
- **Always run `npm test` after any change to `src/data/store.js`, `src/utils/helpers.js`, or `src/utils/txn-grouping.js`** (these are in coverage scope).
- **Commit after each DEBT-ID is resolved.** Use the commit message format: `fix: resolve DEBT-XXX — <short description>`. Do not batch multiple DEBT fixes into one commit.
- **Update this document after each fix:** mark the resolved item with ✅ and the commit hash. Example: `### ✅ [DEBT-001] Seed data uses full ISO datetime strings — fixed in abc1234`
- **Grep the codebase** before touching any function to find all callers. Use `grep -r "functionName" src/` to avoid breaking unlisted callers.
- **Do not refactor anything not listed.** Scope each fix to exactly the lines described. Resist the urge to clean up nearby code.
- **Test the demo flow** (click "Try a sample dashboard first →" on the landing page) after any change to `src/data/seed.js` or `src/data/store.js`.
- **Test the full onboarding flow** (complete all 4 steps and reach the dashboard) after any change to `src/pages/onboarding.js` or `src/data/store.js`.
- **If a fix requires a new export from `store.js`**, always add a corresponding unit test in `tests/unit/store.selectors.spec.js` or `tests/unit/store.mutators.spec.js`.
