import { ordinalSuffix } from './helpers.js';

const PRESET_DAYS = [1, 7, 25, 30];

/**
 * @typedef {Object} DayPickerOptions
 * @property {number}  value   - Currently selected day (1–31)
 * @property {string}  [selectId] - id for the custom <select> (default: 'day-picker-select')
 */

/**
 * Returns the HTML string for a day-of-month picker:
 * four preset chips (1st, 7th, 25th, 30th) and a 1–31 dropdown.
 * @param {DayPickerOptions} opts
 * @returns {string}
 */
export function renderDayPicker({ value = 1, selectId = 'day-picker-select' }) {
  const inPreset = PRESET_DAYS.includes(value);

  const chips = PRESET_DAYS.map(d =>
    `<button class="day-picker__chip${value === d ? ' is-active' : ''}" data-day="${d}">${d}${ordinalSuffix(d)}</button>`
  ).join('');

  const options = Array.from({ length: 31 }, (_, i) => i + 1).map(d =>
    `<option value="${d}"${!inPreset && value === d ? ' selected' : ''}>${d}${ordinalSuffix(d)}</option>`
  ).join('');

  return `
    <div class="day-picker">
      ${chips}
      <select class="day-picker__select" id="${selectId}">
        <option value="" ${inPreset ? 'selected' : ''} disabled>Custom…</option>
        ${options}
      </select>
    </div>`;
}

/**
 * Binds chip clicks and select changes for a rendered day picker.
 * @param {HTMLElement}              root      - Scope element containing the picker
 * @param {DayPickerOptions}         opts
 * @param {function(number): void}   onChange  - Called with the selected day (1–31)
 */
export function bindDayPicker(root, opts, onChange) {
  const { selectId = 'day-picker-select' } = opts;
  const chips = root.querySelectorAll('[data-day]');
  const sel = root.querySelector(`#${selectId}`);

  function activateChip(day) {
    chips.forEach(c => c.classList.remove('is-active'));
    const match = root.querySelector(`[data-day="${day}"]`);
    if (match) match.classList.add('is-active');
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const v = parseInt(chip.dataset.day, 10);
      activateChip(v);
      if (sel) sel.value = '';
      onChange(v);
    });
  });

  if (sel) {
    sel.addEventListener('change', e => {
      const v = parseInt(e.target.value, 10);
      if (v >= 1 && v <= 31) {
        if (PRESET_DAYS.includes(v)) {
          activateChip(v);
          sel.value = '';
        } else {
          chips.forEach(c => c.classList.remove('is-active'));
        }
        onChange(v);
      }
    });
  }
}
