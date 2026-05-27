## 2024-12-07 - Settings inline remove XSS
**Vulnerability:** XSS vulnerability in `settings.js` when rendering the inline remove bucket confirmation, user-controlled fields (`bucket.name` and `bucket.emoji`) were passed to `innerHTML` without HTML escaping.
**Learning:** Even internal app settings pages relying on `innerHTML` for dynamic components are susceptible to XSS if they include unsanitized user inputs, especially when state is stored locally without a backend sanitizer.
**Prevention:** Always use the `escapeHtml` utility provided in `src/utils/helpers.js` when interpolating user-provided inputs into `innerHTML` strings.
