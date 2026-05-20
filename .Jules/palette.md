## 2025-05-17 - Missing Semantic Labels on Form Inputs
**Learning:** Found that custom forms (like Commitments) used `<p class="cm-form__label">` instead of semantic `<label for="id">` tags. This hurts screen reader users and reduces clickable hit areas (clicking a proper label focuses the input).
**Action:** When adding or updating forms, always ensure proper `<label>` tags are used and explicitly linked to inputs via `for` and `id` attributes.
