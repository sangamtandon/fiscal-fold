/**
 * Fiscal Fold — Onboarding Flow (Sprint 3)
 * 
 * 4-Step "All Clear" wizard:
 *   Step 1: Identity (name)
 *   Step 2: The Anchor (salary + salary date)
 *   Step 3: The Golden Rule (ratio selector + live donut)
 *   Step 4: Emotional Anchors (micro-bucket setup)
 * 
 * Designed to reach "Aha!" in under 2 minutes.
 */

import {
  setUser,
  createCycle,
  addBucket,
  addCommitment,
  completeOnboarding,
} from '../data/store.js';
import { PRESETS, BUCKET_TEMPLATES, EMOJI_PALETTE, MAX_BUCKETS_PER_MACRO } from '../data/models.js';
import { formatCurrency, formatNumber, uid } from '../utils/helpers.js';
import { navigate } from '../router.js';
import { showToast } from '../utils/toast.js';

const MACRO_META = {
  needs: {
    desc: 'Essential expenses — survival, work, and basic functioning',
    eg: 'Rent, EMI, Groceries, Electricity, Mobile, Transport, Insurance, Medicines, Loan payments',
  },
  wants: {
    desc: 'Lifestyle, entertainment, and non-essential spending',
    eg: 'Restaurants, Food Delivery, Shopping, Streaming, Vacations, Gaming, Hobbies',
  },
  future: {
    desc: 'Money for future financial growth and security',
    eg: 'Emergency Fund, Mutual Funds, Stocks, PPF, NPS, FD, Extra Loan Repayment',
  },
};

// ---- Onboarding State (local, not persisted until completion) ----
let currentStep = 1;
const TOTAL_STEPS = 4;

let formData = {
  name: '',
  salary: 0,
  salaryDate: 1,
  preset: 'balanced',
  ratios: { ...PRESETS.balanced },
  buckets: { needs: [], wants: [], future: [] },
};

/**
 * Render the onboarding page.
 * @param {HTMLElement} container
 * @returns {Function} cleanup
 */
export function renderOnboarding(container) {
  currentStep = 1;
  formData = {
    name: '',
    salary: 0,
    salaryDate: 1,
    preset: 'balanced',
    ratios: { ...PRESETS.balanced },
    buckets: { needs: [], wants: [], future: [] },
  };

  renderCurrentStep(container);
}

function renderCurrentStep(container) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'onboarding page';
  wrapper.innerHTML = `
    <div class="onboarding__inner">
      <!-- Progress -->
      <div class="onboarding__progress">
        ${[1, 2, 3, 4].map(s => `
          <div class="onboarding__step-dot ${s === currentStep ? 'is-active' : ''} ${s < currentStep ? 'is-done' : ''}">
            ${s < currentStep ? '✓' : s}
          </div>
          ${s < 4 ? `<div class="onboarding__step-line ${s < currentStep ? 'is-done' : ''}"></div>` : ''}
        `).join('')}
      </div>

      <!-- Step Content -->
      <div class="onboarding__content" id="step-content"></div>

      <!-- Navigation -->
      <div class="onboarding__nav">
        <button class="btn btn-ghost" id="btn-back" ${currentStep === 1 ? 'style="visibility:hidden"' : ''}>
          ← Back
        </button>
        <button class="btn btn-primary btn-lg" id="btn-next" disabled>
          ${currentStep === TOTAL_STEPS ? 'Launch Dashboard 🚀' : 'Continue'}
        </button>
      </div>
    </div>
  `;

  container.appendChild(wrapper);

  // Render the step-specific content
  const stepContent = wrapper.querySelector('#step-content');
  switch (currentStep) {
    case 1: renderStep1(stepContent); break;
    case 2: renderStep2(stepContent); break;
    case 3: renderStep3(stepContent); break;
    case 4: renderStep4(stepContent); break;
  }

  // Wire navigation
  wrapper.querySelector('#btn-back').addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      renderCurrentStep(container);
    }
  });

  wrapper.querySelector('#btn-next').addEventListener('click', () => {
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      renderCurrentStep(container);
    } else {
      finishOnboarding();
    }
  });
}

// ---- Enable/Disable Next Button ----
function setNextEnabled(enabled) {
  const btn = document.getElementById('btn-next');
  if (btn) btn.disabled = !enabled;
}

// ===================================================================
// STEP 1 — Identity
// ===================================================================
function renderStep1(container) {
  container.innerHTML = `
    <div class="onboarding__step-header">
      <div class="onboarding__icon">👋</div>
      <h2 class="onboarding__title">What should we call you?</h2>
      <p class="onboarding__subtitle">So your plan feels like yours, not a template. You can change this later.</p>
    </div>
    <div class="onboarding__field">
      <input
        type="text"
        class="input-field onboarding__name-input"
        id="input-name"
        placeholder="Your first name"
        value="${formData.name}"
        autocomplete="given-name"
        maxlength="20"
        autofocus
      />
    </div>
    <div class="onboarding__preview card card--glass" id="greeting-preview" style="${formData.name ? '' : 'opacity: 0.3;'}">
      <span class="app-header__name">${formData.name ? `Hey, ${formData.name} 👋` : 'Hey, ... 👋'}</span>
      <span class="app-header__subtitle">Your finances, your rules.</span>
    </div>
  `;

  const input = container.querySelector('#input-name');
  const preview = container.querySelector('#greeting-preview');

  setNextEnabled(formData.name.trim().length > 0);

  input.addEventListener('input', (e) => {
    const name = e.target.value.trim();
    formData.name = name;
    setNextEnabled(name.length > 0);

    const greetEl = preview.querySelector('.app-header__name');
    greetEl.textContent = name ? `Hey, ${name} 👋` : 'Hey, ... 👋';
    preview.style.opacity = name ? '1' : '0.3';
  });

  // Auto-focus
  requestAnimationFrame(() => input.focus());
}

// ===================================================================
// STEP 2 — The Anchor (Salary + Salary Date)
// ===================================================================
function renderStep2(container) {
  container.innerHTML = `
    <div class="onboarding__step-header">
      <div class="onboarding__icon">💰</div>
      <h2 class="onboarding__title">Your monthly income</h2>
      <p class="onboarding__subtitle">Use your fixed take-home salary. Variable income? Use your minimum expected — log bonuses later.</p>
    </div>

    <div class="onboarding__salary-input-wrap">
      <span class="onboarding__currency-symbol">₹</span>
      <input
        type="text"
        class="input-currency onboarding__salary-field"
        id="input-salary"
        inputmode="numeric"
        placeholder="0"
        value="${formData.salary ? formatNumber(formData.salary) : ''}"
        autofocus
      />
    </div>

    <div class="onboarding__field mt-6">
      <label class="input-group__label">When do you get paid?</label>
      <div class="onboarding__date-grid" id="date-grid">
        ${[1, 5, 7, 10, 15, 20, 25, 28, 30, 31].map(d => `
          <button class="onboarding__date-chip ${formData.salaryDate === d ? 'is-active' : ''}" data-date="${d}">
            ${d}${ordinalSuffix(d)}
          </button>
        `).join('')}
        <button class="onboarding__date-chip ${formData.salaryDate === 99 ? 'is-active' : ''}" data-date="99" data-testid="payday-last">
          Last day
        </button>
      </div>
    </div>

    <div class="onboarding__preview card card--glass mt-4" id="salary-preview" style="${formData.salary > 0 ? '' : 'opacity: 0.3;'}">
      <div class="flex items-center justify-between">
        <span class="text-secondary" style="font-size: var(--text-sm);">Monthly income</span>
        <span class="text-mono font-bold" style="font-size: var(--text-lg);" id="preview-salary">${formData.salary > 0 ? formatCurrency(formData.salary) : '₹—'}</span>
      </div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-secondary" style="font-size: var(--text-sm);">Payday</span>
        <span class="text-mono font-medium" style="font-size: var(--text-sm);" id="preview-date">${formatPayday(formData.salaryDate)}</span>
      </div>
    </div>
  `;

  const salaryInput = container.querySelector('#input-salary');
  const previewSalary = container.querySelector('#preview-salary');
  const previewDate = container.querySelector('#preview-date');
  const previewCard = container.querySelector('#salary-preview');

  setNextEnabled(formData.salary > 0);

  // Salary input — format with commas as user types
  salaryInput.addEventListener('input', (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    formData.salary = num;

    // Format display
    e.target.value = num > 0 ? formatNumber(num) : '';
    previewSalary.textContent = num > 0 ? formatCurrency(num) : '₹—';
    previewCard.style.opacity = num > 0 ? '1' : '0.3';
    setNextEnabled(num > 0);
  });

  // Date chips
  container.querySelectorAll('.onboarding__date-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.onboarding__date-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      formData.salaryDate = parseInt(chip.dataset.date, 10);
      previewDate.textContent = formatPayday(formData.salaryDate);
    });
  });

  requestAnimationFrame(() => salaryInput.focus());
}

// ===================================================================
// STEP 3 — The Golden Rule (Ratio Selector)
// ===================================================================
function renderStep3(container) {
  const salary = formData.salary;

  container.innerHTML = `
    <div class="onboarding__step-header">
      <div class="onboarding__icon">⚖️</div>
      <h2 class="onboarding__title">Your budget split</h2>
      <p class="onboarding__subtitle">Pick how your salary divides into three jars.</p>
    </div>

    <!-- Macro Definitions -->
    <div class="onboarding__macro-defs" data-testid="macro-defs">
      <div class="onboarding__macro-def">
        <span class="onboarding__alloc-dot" style="background: var(--needs);"></span>
        <div>
          <span class="font-semibold" style="font-size: var(--text-sm);">Needs</span>
          <span class="text-tertiary" style="font-size: var(--text-xs);">— rent, groceries, bills, transport</span>
        </div>
      </div>
      <div class="onboarding__macro-def">
        <span class="onboarding__alloc-dot" style="background: var(--wants);"></span>
        <div>
          <span class="font-semibold" style="font-size: var(--text-sm);">Wants</span>
          <span class="text-tertiary" style="font-size: var(--text-xs);">— dining, shopping, subscriptions, fun</span>
        </div>
      </div>
      <div class="onboarding__macro-def">
        <span class="onboarding__alloc-dot" style="background: var(--future);"></span>
        <div>
          <span class="font-semibold" style="font-size: var(--text-sm);">Future</span>
          <span class="text-tertiary" style="font-size: var(--text-xs);">— savings, investments, emergency fund</span>
        </div>
      </div>
    </div>

    <!-- Preset Chips -->
    <div class="onboarding__preset-row" id="preset-row">
      ${Object.entries(PRESETS).map(([key, val]) => `
        <button class="onboarding__preset-chip ${formData.preset === key ? 'is-active' : ''}" data-preset="${key}">
          <span class="onboarding__preset-label">${presetLabel(key)}</span>
          <span class="onboarding__preset-ratio">${val.needs}/${val.wants}/${val.future}</span>
          <span class="onboarding__preset-hint">${presetHint(key)}</span>
        </button>
      `).join('')}
      <button class="onboarding__preset-chip ${formData.preset === 'custom' ? 'is-active' : ''}" data-preset="custom">
        <span class="onboarding__preset-label">Custom ✏️</span>
        <span class="onboarding__preset-ratio">Your own</span>
        <span class="onboarding__preset-hint">Set each slice yourself</span>
      </button>
    </div>

    <!-- Donut Chart -->
    <div class="onboarding__donut-wrap">
      <svg class="onboarding__donut" viewBox="0 0 200 200" id="donut-chart"></svg>
      <div class="onboarding__donut-center">
        <span class="text-mono font-bold" style="font-size: var(--text-lg);">${formatCurrency(salary)}</span>
        <span class="text-tertiary" style="font-size: var(--text-xs);">per month</span>
      </div>
    </div>

    <!-- Allocation Breakdown -->
    <div class="onboarding__alloc-cards" id="alloc-cards">
      ${renderAllocCard('needs', 'Needs', formData.ratios.needs, salary)}
      ${renderAllocCard('wants', 'Wants', formData.ratios.wants, salary)}
      ${renderAllocCard('future', 'Future', formData.ratios.future, salary)}
    </div>

    <!-- Sliders (for custom mode) -->
    <div class="onboarding__sliders ${formData.preset !== 'custom' ? 'hidden' : ''}" id="sliders-wrap">
      ${renderSlider('needs', 'Needs', formData.ratios.needs)}
      ${renderSlider('wants', 'Wants', formData.ratios.wants)}
      <div class="onboarding__slider-row">
        <span class="font-medium" style="font-size: var(--text-sm);">Future</span>
        <span class="text-mono font-semibold text-accent" id="slider-future-val">${formData.ratios.future}%</span>
      </div>
      <p class="text-tertiary" style="font-size: var(--text-xs); text-align: center;">Future is the remainder once you've picked Needs and Wants.</p>
    </div>

    <!-- Carry-forward callout -->
    <p class="onboarding__carry-note" data-testid="carry-note">
      💡 Unspent Wants & Future roll into next month's Future at payday.
    </p>
  `;

  setNextEnabled(true);
  renderDonut();

  // Preset chips
  container.querySelectorAll('.onboarding__preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const preset = chip.dataset.preset;
      formData.preset = preset;
      container.querySelectorAll('.onboarding__preset-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');

      const slidersWrap = container.querySelector('#sliders-wrap');
      if (preset === 'custom') {
        slidersWrap.classList.remove('hidden');
      } else {
        slidersWrap.classList.add('hidden');
        formData.ratios = { ...PRESETS[preset] };
      }

      updateAllocCards(salary);
      renderDonut();
    });
  });

  // Custom sliders
  container.querySelectorAll('input.onboarding__slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const needsVal = parseInt(container.querySelector('#slider-needs').value, 10);
      const wantsVal = parseInt(container.querySelector('#slider-wants').value, 10);
      let futureVal = 100 - needsVal - wantsVal;

      if (futureVal < 0) {
        // Clamp wants so future doesn't go negative
        const maxWants = 100 - needsVal;
        container.querySelector('#slider-wants').value = maxWants;
        futureVal = 0;
        formData.ratios.wants = maxWants;
      }

      formData.ratios.needs = needsVal;
      formData.ratios.wants = parseInt(container.querySelector('#slider-wants').value, 10);
      formData.ratios.future = futureVal;

      container.querySelector('#slider-needs-val').textContent = `${formData.ratios.needs}%`;
      container.querySelector('#slider-wants-val').textContent = `${formData.ratios.wants}%`;
      container.querySelector('#slider-future-val').textContent = `${futureVal}%`;

      updateAllocCards(salary);
      renderDonut();
    });
  });
}

function renderAllocCard(type, label, pct, salary) {
  const amount = Math.round(salary * pct / 100);
  const colors = { needs: 'var(--needs)', wants: 'var(--wants)', future: 'var(--future)' };
  return `
    <div class="onboarding__alloc-card" id="alloc-${type}">
      <div class="onboarding__alloc-dot" style="background: ${colors[type]};"></div>
      <div style="flex:1;">
        <span class="font-semibold" style="font-size: var(--text-sm);">${label}</span>
        <span class="text-tertiary" style="font-size: var(--text-xs); margin-left: var(--space-2);">${pct}%</span>
      </div>
      <span class="text-mono font-semibold" style="font-size: var(--text-sm);">${formatCurrency(amount)}</span>
    </div>
  `;
}

function renderSlider(type, label, value) {
  return `
    <div class="onboarding__slider-row">
      <span class="font-medium" style="font-size: var(--text-sm);">${label}</span>
      <input type="range" class="onboarding__slider" id="slider-${type}" min="5" max="80" value="${value}" />
      <span class="text-mono font-semibold" id="slider-${type}-val" style="min-width: 38px; text-align: right;">${value}%</span>
    </div>
  `;
}

function updateAllocCards(salary) {
  ['needs', 'wants', 'future'].forEach(type => {
    const card = document.querySelector(`#alloc-${type}`);
    if (!card) return;
    const pct = formData.ratios[type];
    const amount = Math.round(salary * pct / 100);
    card.querySelector('.text-tertiary').textContent = `${pct}%`;
    card.querySelector('.text-mono').textContent = formatCurrency(amount);
  });
}

function renderDonut() {
  const svg = document.getElementById('donut-chart');
  if (!svg) return;

  // Read live CSS var values so the donut matches dashboard macro colors
  // exactly — no drift if the design tokens change.
  const css = getComputedStyle(document.documentElement);
  const needsColor = (css.getPropertyValue('--needs') || '#818cf8').trim();
  const wantsColor = (css.getPropertyValue('--wants') || '#34d399').trim();
  const futureColor = (css.getPropertyValue('--future') || '#06b6d4').trim();

  const { needs, wants, future } = formData.ratios;
  const total = needs + wants + future;
  const radius = 80;
  const cx = 100, cy = 100;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { pct: needs / total, color: needsColor },
    { pct: wants / total, color: wantsColor },
    { pct: future / total, color: futureColor },
  ];

  let offset = 0;
  svg.innerHTML = segments.map(seg => {
    const dashLength = seg.pct * circumference;
    const dashGap = circumference - dashLength;
    const rotation = offset * 360 - 90;
    offset += seg.pct;
    return `
      <circle
        cx="${cx}" cy="${cy}" r="${radius}"
        fill="none"
        stroke="${seg.color}"
        stroke-width="20"
        stroke-dasharray="${dashLength} ${dashGap}"
        transform="rotate(${rotation} ${cx} ${cy})"
        style="transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);"
      />
    `;
  }).join('');
}

// ===================================================================
// STEP 4 — Emotional Anchors (Micro-Bucket Setup)
// ===================================================================
function renderStep4(container) {
  container.innerHTML = `
    <div class="onboarding__step-header">
      <div class="onboarding__icon">🪣</div>
      <h2 class="onboarding__title">Set up your buckets</h2>
      <p class="onboarding__subtitle">Pick what you spend on and set a monthly budget for each.</p>
    </div>

    <div class="onboarding__bucket-sections" id="bucket-sections">
      ${renderBucketSection('needs', 'Needs')}
      ${renderBucketSection('wants', 'Wants')}
      ${renderBucketSection('future', 'Future')}
    </div>
  `;

  setNextEnabled(true);
  wireUpBucketEvents(container);
}

function renderBucketSection(macroType, label) {
  const buckets = formData.buckets[macroType];
  const colors = { needs: 'var(--needs)', wants: 'var(--wants)', future: 'var(--future)' };
  const macroAmount = Math.round(formData.salary * formData.ratios[macroType] / 100);
  const canAdd = buckets.length < MAX_BUCKETS_PER_MACRO;
  const sumAllocated = buckets.reduce((s, b) => s + (b.allocated ?? 0), 0);
  const unallocated = macroAmount - sumAllocated;

  const activeNames = new Set(buckets.map(b => b.name));
  const templateChips = BUCKET_TEMPLATES[macroType].map(t => `
    <button class="onboarding__template-chip ${activeNames.has(t.name) ? 'is-active' : ''}"
      data-macro="${macroType}" data-name="${t.name}" data-emoji="${t.emoji}">
      ${t.emoji} ${t.name}
    </button>
  `).join('');

  return `
    <div class="onboarding__bucket-section" data-macro="${macroType}">
      <div class="onboarding__macro-header">
        <div class="flex items-center gap-2">
          <div class="onboarding__alloc-dot" style="background: ${colors[macroType]};"></div>
          <span class="onboarding__macro-label">${label}</span>
        </div>
        <span class="onboarding__macro-amount">${formatCurrency(macroAmount)}</span>
      </div>
      <div class="onboarding__template-chips">${templateChips}</div>
      <div class="onboarding__pool-row" id="pool-row-${macroType}">${renderPoolRow(macroType)}</div>
      <div class="onboarding__bucket-list" data-macro="${macroType}">
        ${buckets.map(b => renderBucketItem(b, macroType)).join('')}
      </div>
      ${canAdd ? `
        <button class="onboarding__add-bucket-btn" data-macro="${macroType}">
          + Add custom bucket
        </button>
      ` : ''}
    </div>
  `;
}

function renderBucketItem(bucket, macroType) {
  return `
    <div class="onboarding__bucket-item" data-id="${bucket.id}" data-macro="${macroType}">
      <span class="onboarding__bucket-emoji">${bucket.emoji}</span>
      <input
        type="text"
        class="onboarding__bucket-name"
        value="${bucket.name}"
        placeholder="Bucket name"
        maxlength="25"
        data-id="${bucket.id}"
        data-macro="${macroType}"
      />
      <div class="onboarding__amount-wrap">
        <span class="onboarding__amount-prefix">₹</span>
        <input
          type="number"
          class="onboarding__bucket-allocated"
          value="${bucket.allocated ?? 0}"
          min="0"
          inputmode="numeric"
          data-id="${bucket.id}"
          data-macro="${macroType}"
          placeholder="0"
        />
      </div>
      <button class="onboarding__bucket-recurring ${bucket.isRecurring ? 'is-active' : ''}" data-id="${bucket.id}" data-macro="${macroType}" title="Fixed monthly bill — will be set up as a Commitment">
        🔄
      </button>
      <button class="onboarding__bucket-pin ${bucket.isPinned ? 'is-active' : ''}" data-id="${bucket.id}" data-macro="${macroType}" title="Pin as Quick Bucket">
        📌
      </button>
      <button class="onboarding__bucket-remove" data-id="${bucket.id}" data-macro="${macroType}" title="Remove">
        ×
      </button>
    </div>
  `;
}

function renderPoolRow(macroType) {
  const macroAmount = Math.round(formData.salary * formData.ratios[macroType] / 100);
  const buckets = formData.buckets[macroType];
  const sumAllocated = buckets.reduce((s, b) => s + (b.allocated ?? 0), 0);
  const unallocated = macroAmount - sumAllocated;

  let poolText, poolClass;
  if (buckets.length === 0) {
    poolText = `${formatCurrency(macroAmount)} to assign`;
    poolClass = 'onboarding__pool-counter';
  } else if (unallocated === 0) {
    poolText = '✓ All assigned';
    poolClass = 'onboarding__pool-counter onboarding__pool-counter--ok';
  } else if (unallocated > 0) {
    poolText = `${formatCurrency(unallocated)} left to assign`;
    poolClass = 'onboarding__pool-counter';
  } else {
    poolText = `${formatCurrency(-unallocated)} over — <button class="onboarding__adjust-split-link" data-action="adjust-split">adjust split?</button>`;
    poolClass = 'onboarding__pool-counter onboarding__pool-counter--warn';
  }

  const legend = buckets.length > 0
    ? `<span class="onboarding__bucket-legend">📌 pin to dashboard &nbsp;·&nbsp; 🔄 monthly</span>`
    : '';

  return `${legend}<span class="${poolClass}">${poolText}</span>`;
}

function refreshBucketSections(container) {
  const sectionsEl = container.querySelector('#bucket-sections');
  if (sectionsEl) {
    sectionsEl.innerHTML =
      renderBucketSection('needs', 'Needs') +
      renderBucketSection('wants', 'Wants') +
      renderBucketSection('future', 'Future');
  }
}

function updatePoolCounter(macroType) {
  const el = document.getElementById(`pool-row-${macroType}`);
  if (!el) return;
  el.innerHTML = renderPoolRow(macroType);
}

function wireUpBucketEvents(container) {
  // Name and allocation editing
  container.addEventListener('input', (e) => {
    if (e.target.classList.contains('onboarding__bucket-name')) {
      const id = e.target.dataset.id;
      const macro = e.target.dataset.macro;
      const bucket = formData.buckets[macro].find(b => b.id === id);
      if (bucket) bucket.name = e.target.value.trim();
    }
    if (e.target.classList.contains('onboarding__bucket-allocated')) {
      const id = e.target.dataset.id;
      const macro = e.target.dataset.macro;
      const bucket = formData.buckets[macro].find(b => b.id === id);
      if (bucket) {
        bucket.allocated = Math.max(0, parseInt(e.target.value, 10) || 0);
        updatePoolCounter(macro);
      }
    }
  });

  // Click delegation for chips, pins, recurring toggles, removes, and add
  container.addEventListener('click', (e) => {
    const adjustSplitBtn = e.target.closest('[data-action="adjust-split"]');
    const chipBtn = e.target.closest('.onboarding__template-chip');
    const recurringBtn = e.target.closest('.onboarding__bucket-recurring');
    const pinBtn = e.target.closest('.onboarding__bucket-pin');
    const removeBtn = e.target.closest('.onboarding__bucket-remove');
    const addBtn = e.target.closest('.onboarding__add-bucket-btn');

    if (adjustSplitBtn) {
      currentStep = 3;
      renderCurrentStep(container.closest('.onboarding')?.parentElement ?? container);
      return;
    }

    if (chipBtn) {
      const macro = chipBtn.dataset.macro;
      const name = chipBtn.dataset.name;
      const emoji = chipBtn.dataset.emoji;
      const existingIdx = formData.buckets[macro].findIndex(b => b.name === name);
      if (existingIdx !== -1) {
        // Toggle off — remove the bucket
        formData.buckets[macro].splice(existingIdx, 1);
      } else {
        // Toggle on — add the bucket with blank amount (user fills it in)
        const wantsPinned = formData.buckets.wants.filter(b => b.isPinned).length;
        formData.buckets[macro].push({
          id: uid(),
          name,
          emoji,
          allocated: 0,
          isPinned: macro === 'wants' && wantsPinned < 2,
          isRecurring: false,
        });
      }
      refreshBucketSections(container);
    }

    if (recurringBtn) {
      const id = recurringBtn.dataset.id;
      const macro = recurringBtn.dataset.macro;
      const bucket = formData.buckets[macro].find(b => b.id === id);
      if (bucket) {
        bucket.isRecurring = !bucket.isRecurring;
        recurringBtn.classList.toggle('is-active');
      }
    }

    if (pinBtn) {
      const id = pinBtn.dataset.id;
      const macro = pinBtn.dataset.macro;
      const bucket = formData.buckets[macro].find(b => b.id === id);
      if (bucket) {
        bucket.isPinned = !bucket.isPinned;
        pinBtn.classList.toggle('is-active');
      }
    }

    if (removeBtn) {
      const id = removeBtn.dataset.id;
      const macro = removeBtn.dataset.macro;
      formData.buckets[macro] = formData.buckets[macro].filter(b => b.id !== id);
      refreshBucketSections(container);
    }

    if (addBtn) {
      const macro = addBtn.dataset.macro;
      if (formData.buckets[macro].length < MAX_BUCKETS_PER_MACRO) {
        const randomEmoji = EMOJI_PALETTE[Math.floor(Math.random() * EMOJI_PALETTE.length)];
        formData.buckets[macro].push({
          id: uid(),
          name: '',
          emoji: randomEmoji,
          allocated: 0,
          isPinned: false,
          isRecurring: false,
        });
        refreshBucketSections(container);
        // Focus the new input
        requestAnimationFrame(() => {
          const inputs = document.querySelectorAll(`[data-macro="${macro}"] .onboarding__bucket-name`);
          const last = inputs[inputs.length - 1];
          if (last) last.focus();
        });
      }
    }
  });
}

// ===================================================================
// FINISH — Create cycle, buckets, navigate to dashboard
// ===================================================================
function finishOnboarding() {
  const { name, salary, salaryDate, preset, ratios, buckets } = formData;

  const totalNamed = Object.values(buckets).flat().filter(b => b.name.trim()).length;
  if (totalNamed === 0) {
    showToast('Add at least one bucket name to continue');
    return;
  }

  // Block over-allocation: bucket sum per macro must not exceed the macro's share of salary
  const overAllocated = ['needs', 'wants', 'future'].filter(macroType => {
    const macroAmount = Math.round(salary * ratios[macroType] / 100);
    const sumAllocated = buckets[macroType].reduce((s, b) => s + (b.allocated ?? 0), 0);
    return sumAllocated > macroAmount;
  });
  if (overAllocated.length > 0) {
    const labels = { needs: 'Needs', wants: 'Wants', future: 'Future' };
    showToast(`Trim ${overAllocated.map(m => labels[m]).join(', ')} — buckets exceed the macro budget`);
    return;
  }

  // 1. Set user
  setUser({
    name,
    salary,
    salaryDate,
    preset,
    ratios,
  });

  // 2. Calculate cycle dates: start = today, end = the day before the next payday
  // (clamped if salaryDate doesn't exist in that month, or === month-end when
  // salaryDate is the 99 sentinel). Salary is used as-is — no pro-rating.
  const now = new Date();
  const lastDayOfMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const resolveDay = (year, month, day) => day === 99
    ? lastDayOfMonth(year, month)
    : Math.min(day, lastDayOfMonth(year, month));
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Find the next salaryDate from today
  let ey = now.getFullYear();
  let em = now.getMonth();
  const todayResolvedPayday = resolveDay(ey, em, salaryDate);
  if (now.getDate() >= todayResolvedPayday) {
    em = now.getMonth() + 1;
    if (em > 11) { em = 0; ey += 1; }
  }
  const endDate = new Date(ey, em, resolveDay(ey, em, salaryDate));
  endDate.setDate(endDate.getDate() - 1);

  const fmt = d => d.toISOString().split('T')[0];
  const startStr = fmt(startDate);
  const endStr = fmt(endDate);

  const allocations = {
    needs: Math.round(salary * ratios.needs / 100),
    wants: Math.round(salary * ratios.wants / 100),
    future: salary - Math.round(salary * ratios.needs / 100) - Math.round(salary * ratios.wants / 100),
  };

  // 3. Create cycle
  const cycle = createCycle({
    startDate: startStr,
    endDate: endStr,
    salary,
    allocations,
  });

  // 4. Create micro-buckets using user-set allocations.
  // Any unallocated remainder per macro is left as a derived value
  // (macro allocation minus sum of bucket allocations), surfaced on the
  // dashboard and in Settings — not absorbed into an auto-created bucket.
  ['needs', 'wants', 'future'].forEach(macroType => {
    const macroBuckets = buckets[macroType].filter(b => b.name.trim());
    macroBuckets.forEach((b) => {
      addBucket({
        macroType,
        name: b.name,
        emoji: b.emoji,
        allocated: b.allocated ?? 0,
        isPinned: b.isPinned,
      });
      if (b.isRecurring) {
        addCommitment({
          name: b.name,
          emoji: b.emoji,
          amount: b.allocated ?? 0,
          dueDate: 1,
          macroType,
        });
      }
    });
  });

  // 5. Complete onboarding
  completeOnboarding();

  // 6. Navigate to dashboard
  navigate('/dashboard');
}

// ---- Helpers ----

function presetLabel(key) {
  const labels = {
    balanced: 'Balanced',
    aggressive: 'Save More',
    conservative: 'More Essentials',
  };
  return labels[key] || key;
}

function presetHint(key) {
  const hints = {
    balanced: 'Even split — a safe starting point',
    aggressive: 'Less Wants, bigger savings',
    conservative: 'More room for must-pays',
  };
  return hints[key] || '';
}

function ordinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format the payday display, treating 99 as the special "Last day of month" sentinel.
 * Exported for tests + Settings reuse.
 */
export function formatPayday(n) {
  if (n === 99) return 'Last day of every month';
  return `${n}${ordinalSuffix(n)} of every month`;
}
