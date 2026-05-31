## 2026-05-31 - Fix XSS vulnerability in Settings Bucket Removal
**Vulnerability:** XSS vulnerability in `src/pages/settings.js` where `bucket.emoji` and `bucket.name` were interpolated into `innerHTML` without being escaped in `_handleRemoveBucket`.
**Learning:** Any user-provided data interpolated into `innerHTML` MUST go through `escapeHtml`, even if it is during a transient state like a confirmation prompt.
**Prevention:** Always use `escapeHtml` for any user input when interpolating into `innerHTML` templates. Review all uses of `innerHTML` for missing `escapeHtml` calls.
