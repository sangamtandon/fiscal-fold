## 2024-10-24 - [CRITICAL] Fix XSS in settings deletion confirm
**Vulnerability:** User-provided bucket.name and bucket.emoji were rendered directly into the DOM using innerHTML during the bucket deletion confirmation flow without escapeHtml in src/pages/settings.js.
**Learning:** Missed using escapeHtml on user input variables while generating innerHTML directly using template literals inside a Vanilla JS app.
**Prevention:** Always wrap any variables directly originating from user input (e.g. bucket names) with escapeHtml() from src/utils/helpers.js when interpolating into innerHTML templates.
