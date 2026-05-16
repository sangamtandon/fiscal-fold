import { ordinalSuffix } from './helpers.js';

/**
 * @typedef {Object} DayPickerOptions
 * @property {number[]} days           - Preset day values to show as chips
 * @property {number}   [value]        - Currently selected day (defaults to days[0])
 * @property {boolean}  [lastDay]      - Append a "Last day" chip with sentinel value 99
 * @property {string}   [lastDayTestId]- data-testid for the "Last day" chip
 * @property {boolean}  [customInput]  - Render a number input below chips for any day 1–31
 * @property {string}   [inputId]      - id for the custom input (required when customInput: true)
 */

/**
 * Returns the HTML string for a day-of-month chip picker.
 * @param {DayPickerOptions} opts
 * @returns {string}
 */
export function renderDayPicker(opts) {
  const {
    days,
    value = days[0],
    lastDay = false,
    lastDayTestId = null,
    customInput = false,
    inputId = 'day-picker-custom',
  } = opts;

  const chips = days.map(d =>
    `<button class="day-picker__chip${value === d ? ' is-active' : ''}" data-day="${d}">${d}${ordinalSuffix(d)}</button>`
  ).join('');

  const lastDayChip = lastDay
    ? `<button class="day-picker__chip${value === 99 ? ' is-active' : ''}" data-day="99"${lastDayTestId ? ` data-testid="${lastDayTestId}"` : ''}>Last day</button>`
    : '';

  const customEl = customInput ? `
    <div class="day-picker__custom">
      <input
        type="number"
        class="input-field"
        id="${inputId}"
        placeholder="Custom day (1–31)"
        min="1"
        max="31"
        style="font-size:var(--text-sm)"
        value="${!days.includes(value) && value !== 99 ? value : ''}"
      />
    </div>` : '';

  return `<div class="day-picker">${chips}${lastDayChip}</div>${customEl}`;
}

/**
 * Binds click and input events for a rendered day picker.
 * @param {HTMLElement}    root     - Scope element containing the picker
 * @param {DayPickerOptions} opts
 * @param {function(number): void} onChange  - Called with the selected day value
 */
export function bindDayPicker(root, opts, onChange) {
  const { customInput = false, inputId = 'day-picker-custom' } = opts;
  const chips = root.querySelectorAll('[data-day]');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      if (customInput) {
        const inp = root.querySelector(`#${inputId}`);
        if (inp) inp.value = '';
      }
      onChange(parseInt(chip.dataset.day, 10));
    });
  });

  if (customInput) {
    const inp = root.querySelector(`#${inputId}`);
    if (inp) {
      inp.addEventListener('input', e => {
        const v = parseInt(e.target.value, 10);
        if (v >= 1 && v <= 31) {
          chips.forEach(c => c.classList.remove('is-active'));
          onChange(v);
        }
      });
    }
  }
}
