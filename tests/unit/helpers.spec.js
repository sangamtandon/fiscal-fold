import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  percent,
  clamp,
  uid,
  daysRemaining,
  cycleDayCount,
  daysElapsed,
  debounce,
  timeAgo,
} from '../../src/utils/helpers.js';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('uses Indian lakh grouping', () => {
    expect(formatCurrency(100000)).toBe('₹1,00,000');
    expect(formatCurrency(12345678)).toBe('₹1,23,45,678');
  });

  it('formats negative values with minus sign', () => {
    expect(formatCurrency(-500)).toBe('-₹500');
  });

  it('hides decimals by default and rounds', () => {
    expect(formatCurrency(1234.49)).toBe('₹1,234');
    expect(formatCurrency(1234.5)).toBe('₹1,235');
  });

  it('shows two decimals when requested', () => {
    expect(formatCurrency(12345.67, true)).toBe('₹12,345.67');
  });

  it('produces stable strings for NaN and Infinity (pinned)', () => {
    // Pin current Intl behavior so future Node/ICU shifts surface as test diffs
    expect(formatCurrency(NaN)).toMatchInlineSnapshot(`"₹NaN"`);
    expect(formatCurrency(Infinity)).toMatchInlineSnapshot(`"₹∞"`);
  });
});

describe('formatNumber', () => {
  it('groups with Indian commas', () => {
    expect(formatNumber(100000)).toBe('1,00,000');
  });
});

describe('percent', () => {
  it('returns 0 when total is 0', () => {
    expect(percent(0, 0)).toBe(0);
  });

  it('returns 0 when total is negative (guard at helpers.js:61)', () => {
    expect(percent(50, -1)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(percent(50, 200)).toBe(25);
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
  });

  it('does NOT clamp above 100 — regression canary', () => {
    expect(percent(150, 100)).toBe(150);
  });
});

describe('clamp', () => {
  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('uid', () => {
  it('returns a non-empty string', () => {
    const id = uid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('produces no collisions over 10k calls', () => {
    const seen = new Set();
    for (let i = 0; i < 10_000; i++) seen.add(uid());
    expect(seen.size).toBe(10_000);
  });
});

describe('daysRemaining', () => {
  afterEach(() => vi.useRealTimers());

  it('returns 1 for today (ceil to end-of-day)', () => {
    // Pinned current behavior: daysRemaining uses ceil against a local-EOD
    // timestamp, so "today" reads as 1 day remaining until that day ends.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(daysRemaining('2026-05-15')).toBe(1);
  });

  it('returns 0 once the day has fully elapsed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00Z'));
    expect(daysRemaining('2026-05-15')).toBe(0);
  });

  it('returns positive for future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(daysRemaining('2026-05-20')).toBeGreaterThan(0);
  });

  it('returns 0 for past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(daysRemaining('2026-05-01')).toBe(0);
  });
});

describe('cycleDayCount', () => {
  it('counts inclusive days in a 31-day month', () => {
    expect(cycleDayCount('2026-05-01', '2026-05-31')).toBe(31);
  });

  it('handles leap February', () => {
    expect(cycleDayCount('2024-02-01', '2024-02-29')).toBe(29);
  });

  it('handles non-leap February', () => {
    expect(cycleDayCount('2026-02-01', '2026-02-28')).toBe(28);
  });
});

describe('daysElapsed', () => {
  afterEach(() => vi.useRealTimers());

  it('floors at 0', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(daysElapsed('2026-05-20')).toBe(0);
  });

  it('counts elapsed days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(daysElapsed('2026-05-10T12:00:00Z')).toBe(5);
  });
});

describe('debounce', () => {
  afterEach(() => vi.useRealTimers());

  it('calls only after delay with latest args', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const fn = debounce(spy, 300);
    fn('a');
    fn('b');
    fn('c');
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('c');
  });
});

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers());

  it('returns "just now" for very recent timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(timeAgo(new Date('2026-05-15T11:59:30Z'))).toBe('just now');
  });

  it('handles future timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    expect(timeAgo(new Date('2026-05-15T13:00:00Z'))).toBe('in the future');
  });
});
