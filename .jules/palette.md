## 2024-05-24 - Add titles and aria-labels to settings icon buttons
**Learning:** Found multiple icon-only buttons (`.btn-icon`) in settings bucket rows that lack `aria-label` or explicit definitions, making them inaccessible to screen readers and difficult to understand when no tooltip is rendered properly (e.g., settings-bucket-btn). Specifically `✏️` and `×` buttons needed `aria-label`s.
**Action:** Always add `aria-label` in conjunction with `title` for icon-only action buttons.
