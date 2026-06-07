## 2024-06-07 - Ensure icon-only buttons have paired ARIA labels and titles
**Learning:** Icon-only buttons without `aria-label` and `title` leave screen reader users without context and mouse users without tooltips. A paired `aria-label` and `title` ensures accessibility for all modalities.
**Action:** Always ensure icon-only buttons (like `.btn-icon` or `✕` / `←`) have both `aria-label` and `title` attributes.
