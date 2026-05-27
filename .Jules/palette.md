## 2025-02-09 - Native Button vs Interactive Divs
**Learning:** Found a pattern in the app (Quick Buckets component) where interactive components triggering actions were constructed using `<div>` with `click` listeners instead of native `<button type="button">`. This breaks keyboard navigation and semantic screen reader reading.
**Action:** Always prefer semantic native `<button type="button">` over generic containers like `<div>`. Applied `role="group"` to the parent for additional screen reader context.
