## 2024-06-02 - Accessible Icon-only Buttons
**Learning:** Icon-only buttons (like `✕` or `←`) used pervasively in the app frequently lack screen reader accessibility. While users often perceive the visual icon, screen readers remain completely unaware of the button's purpose without an `aria-label`.
**Action:** When creating or modifying icon-only buttons in the Vanilla JS architecture, ensure an `aria-label` is always included. Additionally, match it with a `title` attribute so hover interactions provide context for mouse users, aligning with accessibility best practices.
