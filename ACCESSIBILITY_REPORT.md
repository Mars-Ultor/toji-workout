Accessibility sweep summary - Toji's Training Regimen

Date: 2025-10-03

What I changed (low-risk, high-value)

- Added aria-labels to email/password and countdown inputs.
- Added aria-describedby linking auth inputs to the `#auth-error` element.
- Ensured modals reference their visible headings via `aria-labelledby` and created heading IDs (`alternative-modal-title`, `reset-modal-title`, `delete-modal-title`).
- Added `tabindex="-1"` to modal title elements and focused them when opening a modal (via `openGenericModal`) so screen readers announce the title on open.
- Made schedule day cards keyboard operable: `role="button"`, `tabindex="0"`, and Enter/Space activation.

Remaining recommended items (prioritized)

1. Run a screen-reader test (NVDA/VoiceOver) and keyboard-only walkthrough to validate announcements and tab order.
2. Ensure every form control has an associated label (measurement inputs are generated with labels; double-check dynamic content at runtime).
3. Add ARIA live regions for important status updates (e.g., "Workout saved", "Workout restored") for SR users — currently we use toasts which are not ARIA-live by default.
4. Audit color contrast (Tailwind palette mostly okay but verify against WCAG 2.1 AA for key text colors).
5. Mark interactive custom controls (rating buttons, set buttons) with proper aria-pressed/state where applicable.
6. Ensure all dynamically injected buttons have accessible names (we added many via DOM; run axe or similar to catch any missed elements).

How to validate locally

- Manual:
  1. Open the app in a browser.
  2. Use only keyboard (Tab/Shift+Tab/Enter/Space) to navigate all UI elements; ensure modals trap focus and return focus on close.
  3. Use a screen reader (NVDA on Windows, VoiceOver on macOS) and confirm modal title is announced when opening.
- Automated:
  - Run axe-core against the running site (e.g., axe DevTools or axe-core Puppeteer integration).

If you want, I can:

- Integrate axe-core into the small smoke test script I added (requires test credentials and local execution).
- Sweep dynamic content further and add aria-live for toasts.

---

If you'd like me to proceed with automated testing or to implement aria-live for the toast system, tell me which to prioritize.
