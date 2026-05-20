## 2024-03-24 - Accessibility Labels for Icon-only Buttons and Inputs
**Learning:** Icon-only buttons and inputs without visible labels (like the Note input in the income modal) require explicit `aria-label` attributes for screen reader accessibility. This pattern is common across various modal implementations and setting rows.
**Action:** When creating new components with icon-only buttons or inputs lacking visible labels, proactively add `aria-label` attributes during initial implementation.
