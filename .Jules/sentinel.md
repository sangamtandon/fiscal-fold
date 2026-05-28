## 2026-05-28 - DOM-based XSS in Settings
**Vulnerability:** Unescaped bucket.name and bucket.emoji in innerHTML assignment inside _handleRemoveBucket.
**Learning:** Even internal app state (bucket names) can be maliciously manipulated if a user copies/pastes a payload or if sync logic is ever added. innerHTML is inherently dangerous when interpolating strings.
**Prevention:** Prefer using .textContent to inject dynamic user-provided strings into the DOM rather than innerHTML interpolation.
