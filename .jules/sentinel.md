## 2024-05-24 - Cross-Site Scripting (XSS) in settings page
**Vulnerability:** XSS possible in bucket deletion confirmation UI because bucket details are not escaped before string interpolation via innerHTML.
**Learning:** `innerHTML` string interpolation with unescaped data from data stores (even if originating from user input) creates an XSS vulnerability when rendered directly. Even with a vanilla JS PWA, data loaded from localStorage MUST be escaped before being injected into the DOM via innerHTML.
**Prevention:** Consistently use the `escapeHtml` utility from `src/utils/helpers.js` for all variable interpolation when constructing HTML strings assigned to `innerHTML`.
