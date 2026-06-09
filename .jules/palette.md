## 2024-06-09 - Accessible Icon Buttons
**Learning:** Icon-only buttons used frequently across vanilla JS templates (like modals and settings) were lacking accessibility, preventing screen readers from understanding their purpose and missing tooltips for mouse users.
**Action:** When creating or modifying icon-only buttons (e.g., `.btn-icon`), always pair an `aria-label` with a `title` attribute to maintain dual accessibility for both screen readers and pointer devices.
