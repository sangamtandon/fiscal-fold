## 2026-05-18 - Missing ARIA Labels on Modals and Keypads
**Learning:** Icon-only buttons in dynamically rendered modals (like Close, Back, and Backspace keys) were missing screen-reader accessible names, rendering them silent or ambiguous to assistive technologies.
**Action:** Always verify that every icon-only button and symbol-based interactive element (`←`, `✕`, `⌫`) has an explicit `aria-label` explaining its function, particularly when generated via JavaScript templates.
