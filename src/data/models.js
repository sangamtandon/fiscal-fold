/**
 * Fiscal Fold — Data Models
 * 
 * All data shapes used throughout the app.
 * These are documented as JSDoc typedefs for IDE autocompletion
 * without requiring a TypeScript build step.
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user ID
 * @property {string} name - Display name
 * @property {number} salary - Fixed monthly salary amount
 * @property {number} salaryDate - Day of month salary is credited (1–31)
 * @property {'balanced'|'aggressive'|'conservative'|'custom'} preset - Budget strategy preset
 * @property {{ needs: number, wants: number, future: number }} ratios - Macro allocation percentages (must sum to 100)
 * @property {string} createdAt - ISO date string
 * @property {string} updatedAt - ISO date string
 */

/**
 * @typedef {Object} BudgetCycle
 * @property {string} id - Unique cycle ID
 * @property {string} startDate - ISO date string (cycle start)
 * @property {string} endDate - ISO date string (cycle end)
 * @property {number} salary - Salary for this cycle (may differ from user.salary for prorated/bonus)
 * @property {{ needs: number, wants: number, future: number }} allocations - Calculated ₹ amounts per macro
 * @property {boolean} isActive - Whether this is the current cycle
 * @property {number|null} sweepAmount - Amount swept to Future at cycle end (null if cycle is active)
 * @property {string} createdAt - ISO date string
 */

/**
 * @typedef {'needs'|'wants'|'future'} MacroType
 */

/**
 * @typedef {Object} MicroBucket
 * @property {string} id - Unique bucket ID
 * @property {string} cycleId - Parent budget cycle ID
 * @property {MacroType} macroType - Parent macro category
 * @property {string} name - Emotional/descriptive name
 * @property {string} emoji - Emoji identifier
 * @property {number} allocated - Allocated amount for this cycle
 * @property {number} spent - Total spent amount
 * @property {boolean} isPinned - Whether this is a "Quick Bucket"
 * @property {number} sortOrder - Display order within macro
 * @property {string} createdAt - ISO date string
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - Unique transaction ID
 * @property {string} cycleId - Parent budget cycle ID
 * @property {string} bucketId - Target micro bucket ID
 * @property {number} amount - Transaction amount (always positive)
 * @property {'expense'|'income'|'refund'} type - Transaction type
 * @property {string} [note] - Optional note
 * @property {string|null} borrowedFrom - Bucket ID if funds were borrowed (trade-off)
 * @property {number} [borrowedAmount] - Amount borrowed from the source bucket
 * @property {string} timestamp - ISO date string
 */

/**
 * @typedef {Object} Commitment
 * @property {string} id - Unique commitment ID
 * @property {string} name - Commitment name (e.g., "Rent", "Netflix")
 * @property {string} emoji - Emoji identifier
 * @property {number} amount - Monthly amount
 * @property {number} dueDate - Day of month (1–31)
 * @property {MacroType} macroType - Which macro category this falls under
 * @property {boolean} isActive - Toggle for seasonal commitments
 * @property {boolean} isPaid - Whether paid in current cycle
 * @property {string} createdAt - ISO date string
 */

/**
 * @typedef {Object} Sweep
 * @property {string} id - Unique sweep ID
 * @property {string} cycleId - Budget cycle that was swept
 * @property {number} amount - Total amount swept
 * @property {string} sweptTo - Target (always 'future' for Phase 1)
 * @property {{ bucketId: string, bucketName: string, amount: number }[]} breakdown - Per-bucket sweep amounts
 * @property {string} timestamp - ISO date string
 */

/**
 * @typedef {Object} AppState
 * @property {User|null} user - Current user
 * @property {BudgetCycle[]} cycles - All budget cycles
 * @property {MicroBucket[]} buckets - All micro buckets across cycles
 * @property {Transaction[]} transactions - All transactions
 * @property {Commitment[]} commitments - Recurring commitments
 * @property {Sweep[]} sweeps - Sweep records
 * @property {boolean} onboardingComplete - Whether onboarding is done
 * @property {string} currentCycleId - ID of the active cycle
 */

/**
 * Default preset ratios.
 */
export const PRESETS = {
  balanced: { needs: 50, wants: 30, future: 20 },
  aggressive: { needs: 40, wants: 20, future: 40 },
  conservative: { needs: 60, wants: 25, future: 15 },
};

/**
 * Suggested starter bucket templates.
 */
export const BUCKET_TEMPLATES = {
  needs: [
    { name: 'Groceries', emoji: '🛒' },
    { name: 'Transport', emoji: '🚕' },
    { name: 'Utilities', emoji: '💡' },
    { name: 'Healthcare', emoji: '🏥' },
    { name: 'Household', emoji: '🏠' },
  ],
  wants: [
    { name: 'Dining Out', emoji: '🍕' },
    { name: 'Entertainment', emoji: '🎬' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Chai & Snacks', emoji: '☕' },
    { name: 'Self Care', emoji: '💆' },
  ],
  future: [
    { name: 'Emergency Fund', emoji: '🛡️' },
    { name: 'Investment', emoji: '📈' },
    { name: 'Dream Goal', emoji: '✨' },
  ],
};

/**
 * Suggested starter commitment templates (recurring bills).
 * Used in onboarding Step 5 to seed common bills with a sensible macro/due-date.
 */
export const COMMITMENT_TEMPLATES = [
  { name: 'Rent', emoji: '🏠', macroType: 'needs', dueDate: 1 },
  { name: 'EMI', emoji: '🏦', macroType: 'needs', dueDate: 5 },
  { name: 'Electricity', emoji: '💡', macroType: 'needs', dueDate: 10 },
  { name: 'Internet', emoji: '🌐', macroType: 'needs', dueDate: 7 },
  { name: 'Mobile', emoji: '📱', macroType: 'needs', dueDate: 15 },
  { name: 'Insurance', emoji: '🛡️', macroType: 'needs', dueDate: 20 },
  { name: 'Streaming', emoji: '🎬', macroType: 'wants', dueDate: 10 },
  { name: 'Gym', emoji: '🏋️', macroType: 'wants', dueDate: 5 },
];

/**
 * Maximum micro-buckets per macro category.
 */
export const MAX_BUCKETS_PER_MACRO = 10;

/**
 * Quick buckets limit (pinned row).
 */
export const MAX_QUICK_BUCKETS = 4;

/**
 * Default emoji palette for bucket creation.
 */
export const EMOJI_PALETTE = [
  '🍕', '☕', '🛒', '🚕', '💡', '🏥', '🏠', '🎬',
  '🛍️', '💆', '🛡️', '📈', '✨', '🐕', '✈️', '🎮',
  '📚', '👔', '🎵', '🏋️', '🍳', '🎂', '🌸', '💰',
  '🏖️', '🚗', '📱', '🎓', '🧘', '🍜', '🎁', '🏡',
];
