## 2026-05-22 - Missing escapeHtml in Vanilla JS innerHTML interpolations
**Vulnerability:** XSS vulnerability in settings.js due to unescaped bucket name and emoji being injected directly into innerHTML.
**Learning:** This codebase uses Vanilla JS and heavily relies on innerHTML for rendering UI components. The `escapeHtml` utility exists in `src/utils/helpers.js` but is sometimes forgotten during template string interpolation, especially in confirmation dialogues or inline edits.
**Prevention:** Always verify that any user-provided data (or data imported from settings JSON) is wrapped in `escapeHtml()` before being interpolated into template strings assigned to `innerHTML`.
