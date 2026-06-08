## 2025-03-05 - Fix XSS vulnerability in settings
**Vulnerability:** Untrusted user input (`bucket.emoji` and `bucket.name`) was being directly interpolated into `innerHTML` when confirming the removal of a bucket in `src/pages/settings.js`.
**Learning:** Vanilla JS architectures heavily rely on `innerHTML`, making them particularly susceptible to XSS if user inputs aren't systematically escaped.
**Prevention:** Always wrap user-controlled strings in `escapeHtml()` when interpolating them into HTML strings for `innerHTML`, or prefer `.textContent` when feasible.
