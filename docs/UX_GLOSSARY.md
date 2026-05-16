# UX Glossary — Fiscal Fold

Every user-facing concept in the app, the language we use for it, and the
language we deliberately *don't*. Use this as a copy reference for any new
feature so the experience stays consistent.

## Core jars (the three macros)

| In code | In UI | One-liner shown to users |
|---|---|---|
| `needs` | **Needs** | rent, groceries, bills, transport |
| `wants` | **Wants** | dining, shopping, subscriptions, fun |
| `future` | **Future** | savings, investments, emergency fund |

Onboarding Step 3 surfaces these definitions in a `data-testid="macro-defs"`
card *before* asking the user to allocate percentages — they're no longer
expected to know what a "Need" vs a "Want" is by intuition.

## Buckets

Defined in Step 4 onboarding as: *"A bucket is a spending category with its own
budget — like an envelope for each expense type."* Each bucket has an emoji, a
name, an allocation (₹), and an optional **pin** that promotes it to a
**Quick Bucket** on the dashboard for one-tap logging (max 4 pins).

## Cycle

The budget period between paydays. Surfaced as plain language wherever
possible — Settings → Help defines it explicitly.

At payday:
- **Unspent Wants & Future** roll into next cycle's **Future** allocation.
- **Unspent Needs resets** — the payday ritual page calls this out explicitly so
  users aren't confused why their Needs surplus disappeared.

## Safe to Spend

The remaining **Wants** balance for this cycle, minus unpaid commitments.
The dashboard hero card is now labelled *"Wants budget — safe to spend"*
(no longer just "Safe to Spend" with the scope buried as a footnote), with
a supporting line that says *"Needs & Future are set aside — this is your
guilt-free Wants money for the next N days."*

## Trade-off — say "Cover," never "Borrow"

When a bucket is short for a transaction, the user can **cover** the
shortfall from another bucket. The original copy said "Borrow," which
implied a payback that never happens. The current language:

| ❌ Old | ✅ New |
|---|---|
| `Borrow ₹X from another bucket?` | `Cover the missing ₹X from another bucket?` |
| `Choose a bucket to borrow from:` | `Cover the shortfall from:` |
| `Shopping borrows ₹500` | `Shopping covers ₹500` |
| (nothing) | `This moves money permanently — there's no payback.` |
| `Confirm Trade-Off` | `Confirm Split` |
| `Partial` badge on donor row | `Can cover ₹X / Only ₹Y available` hint line |

## Empty buckets

Buckets at ₹0 are no longer silently disabled in the picker. They render
with a *"No budget left this cycle"* hint and routing into the trade-off
flow when tapped.

## Quick Buckets

Pinned buckets that appear on the dashboard as a horizontal row of chips
above the macro health bars. The onboarding Step 4 tip line explains:
*"📌 Pin up to 4 buckets for one-tap logging on the dashboard."* The dashboard
section header reads *"Quick Buckets — tap to log a spend"*.

## Commitments

Recurring monthly bills (rent, EMI, subscriptions) that are **set aside from
the macro budget before you spend**. The Commitments page subtitle now
explicitly says this — and adds *"Mark paid to record the expense to a
bucket."*

**Marking paid** opens a drawer that asks which bucket inside the chosen
macro the payment should be debited to, then logs a real transaction (note:
`Commitment: <name>`). There's a "Mark paid without logging" escape hatch
for the rare case where the user just wants to update the status.

## Salary date

Onboarding Step 2 and Settings → Edit Salary Date now offer:
`1st, 5th, 7th, 10th, 15th, 20th, 25th, 28th, 30th, 31st, Last day`.

`Last day` is stored as the sentinel `salaryDate: 99` and resolves to
`new Date(year, month + 1, 0).getDate()` at cycle creation. Picking 31st
on a month that doesn't have one falls back to the actual last day.

## Variable income

Onboarding Step 2 subtitle acknowledges variable income:
*"Use your fixed take-home salary. Variable income? Use your minimum
expected — log bonuses later."* The dedicated `Income →` shortcut on the
FAB transaction modal makes bonus logging easy.

## Pool counter (Step 4 + Settings)

| State | Copy |
|---|---|
| Sum = macro total | `✓ All assigned` |
| Sum < macro total | `₹X left to assign` |
| Sum > macro total | `₹X over budget` |

Old copy ("unallocated" / "Fully allocated") was jargon-ish and didn't make
the action obvious. Banners on the dashboard also use "left to assign" and
are clickable, navigating to Settings.

## Leak warnings

Old: *"[Bucket] is running hot — X% spent with N days left. Tap to
re-balance →"*

New: *"[Bucket] — X% spent with N day(s) left — Tap to log a spend here or
adjust the budget."* No slang, accurate action label.

## Payday ritual

| ❌ Old | ✅ New |
|---|---|
| `Sweep & Start New Cycle →` | `Roll over savings & start next cycle →` |
| (nothing about Needs) | `Unspent Needs resets — Needs budgets are fresh each cycle.` |

## Settings — Backup

Renamed *"Export All Data (JSON)"* → *"Download full backup (JSON file)"*
because raw "JSON" is developer terminology.

## Settings — Danger Zone

Now a visible card with:
- A `Danger Zone` heading in danger red
- An intro line: *"Deleting your data is permanent. There is no cloud
  backup."*
- A red-outline "Reset all data" button (no longer a near-invisible tertiary
  text link)

## Settings — Help section

A `data-testid="settings-help"` card defines:
- **Needs / Wants / Future**
- **Buckets**
- **Cycle**
- **Quick Buckets**
- **Commitments**

So users can revisit any term after onboarding — there's no hidden vocabulary.

## Landing page copy

| Element | Copy |
|---|---|
| Headline | `Fiscal Fold` |
| Tagline (`data-testid="landing-tagline"`) | `Know exactly what's safe to spend — without a spreadsheet.` |
| Primary CTA | `Set up my budget` |
| Secondary CTA | `Try a sample dashboard first →` |
| Privacy line (`data-testid="landing-privacy"`) | `No account, no cloud sync. Your data lives only on this device.` |

The old tagline ("Smart envelope budgeting") led with jargon. The old
privacy line ("No account needed. Your data stays on your device.") clashed
with the offline-queue toast ("will sync when online") — now resolved.

## PWA install banner

Deferred until **both** of the following are true:
1. `isOnboardingComplete()` returns `true`
2. The user has logged at least one transaction (`getTransactions({ limit: 1 }).length > 0`)

Plus the existing `pwa-install-dismissed` flag. No more first-load nag.
