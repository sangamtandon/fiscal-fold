## 2024-05-31 - Missing aria-label with title on icon-only buttons
**Learning:** Icon-only buttons with `btn-icon` sometimes miss `aria-label` or even `title` making them completely inaccessible to screen readers. For example, in `src/pages/income-modal.js`, the back and close buttons (`ic-back` and `ic-close`) lack any text alternatives.
**Action:** Always ensure that icon-only buttons (`.btn-icon`) in Vanilla JS templates include an `aria-label` paired with a `title` attribute for both screen reader accessibility and mouse hover tooltips.
