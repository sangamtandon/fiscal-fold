## 2024-10-24 - Unescaped variables in innerHTML templates
**Vulnerability:** Found variables `bucket.emoji` and `bucket.name` directly interpolated into an `innerHTML` string during bucket removal in `src/pages/settings.js`. This is an XSS vulnerability.
**Learning:** The project relies heavily on template literals and `innerHTML` for rendering the UI. Without a framework to handle automatic escaping, user-controlled inputs must be explicitly sanitized.
**Prevention:** Always use the provided `escapeHtml` utility from `src/utils/helpers.js` when interpolating any state derived from user input into `innerHTML` strings.
