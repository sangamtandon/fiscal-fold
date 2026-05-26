## 2024-05-24 - Cross-Site Scripting (XSS) in Vanilla JS innerHTML Rendering
**Vulnerability:** User-controlled data (bucket names and emojis) was being injected unescaped directly into the DOM via `innerHTML` within inline forms and confirmation strips in `src/pages/settings.js`.
**Learning:** Due to the vanilla JS architecture, rendering components often relies on template strings via `innerHTML`. Any unsanitized user inputs or local storage data interpolated into these templates expose the app to XSS vulnerabilities.
**Prevention:** Always ensure any variables that originate from user input or storage state (like names, emojis, IDs) are wrapped with the `escapeHtml` utility from `src/utils/helpers.js` before being interpolated into template strings assigned to `innerHTML`.
