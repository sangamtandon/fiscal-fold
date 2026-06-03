## 2024-06-03 - Added ARIA labels to Icon Buttons
**Learning:** Found multiple instances where `.btn-icon` classes were missing `aria-label` but had `title`. Adding paired `aria-label` and `title` ensures both hover/tooltip support and screen reader accessibility.
**Action:** Always ensure that icon-only buttons (`.btn-icon`) have both `aria-label` and `title` paired together.
