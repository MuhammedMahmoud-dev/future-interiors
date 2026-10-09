/**
 * The single source of truth for every money calculation in this project.
 * Nothing else may add up expenses or payments.
 *
 * Formula (fixed by spec, do not "improve"):
 *   total_cost      = SUM(expenses.amount)          // includes negatives (discounts)
 *   supervision_fee = ROUND(total_cost * rate)      // nearest pound
 *   grand_total     = total_cost + supervision_fee
 *   total_payments  = SUM(payments.amount)
 *   balance         = total_payments - grand_total  // positive = client is ahead
 */

/** A row as it arrives from Postgres: `numeric` columns come back as strings. */
export type MoneyRow = { amount: number | string };

export type Statement = {
  total_cost: number;
  supervision_fee: number;
  grand_total: number;
  total_payments: number;
  balance: number;
};

/**
 * All arithmetic happens in whole piastres (1/100 pound), never in fractional
 * pounds. Binary floats cannot represent 0.1 exactly, so adding pound amounts
 * directly drifts: 0.1 + 0.2 = 0.30000000000000004, and a ledger of a few
 * hundred decimal rows can end up showing a balance of -0.0000001 or rounding
 * a fee the wrong way. Integers below 2^53 add exactly.
 */
function toPiastres(value: number): number {
  const piastres = Math.round(value * 100);
  if (!Number.isSafeInteger(piastres)) {
    throw new Error(`finance: amount out of range ${value}`);
  }
  return piastres;
}

function fromPiastres(piastres: number): number {
  return piastres / 100;
}

/** Half away from zero, so a refund of -0.5 rounds to -1 just like 0.5 rounds to 1. */
function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value)) || 0;
}

/**
 * Exact sum of plain numbers, for running totals shown in the UI. Callers must
 * use this instead of `reduce((a, b) => a + b)` so on-screen totals match the
 * statement to the piastre.
 */
export function addMoney(values: readonly number[]): number {
  return fromPiastres(values.reduce((total, value) => total + toPiastres(value), 0));
}

/**
 * Postgres returns `numeric` as a string, so `rows.reduce((a, r) => a + r.amount, 0)`
 * silently concatenates ("0" + "100" + "-20" = "0100-20") instead of adding.
 * Every amount goes through Number() here, and nowhere else.
 */
function sumPiastres(rows: readonly MoneyRow[]): number {
  return rows.reduce((total, row) => {
    const value = Number(row.amount);
    if (!Number.isFinite(value)) {
      throw new Error(`finance: non-numeric amount ${JSON.stringify(row.amount)}`);
    }
    return total + toPiastres(value);
  }, 0);
}

export function sumAmounts(rows: readonly MoneyRow[]): number {
  return fromPiastres(sumPiastres(rows));
}

export function computeStatement(
  expenses: readonly MoneyRow[],
  payments: readonly MoneyRow[],
  supervisionRate: number | string,
): Statement {
  const rate = Number(supervisionRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`finance: supervision rate out of range ${JSON.stringify(supervisionRate)}`);
  }

  // The column is numeric(5,4), so the rate is an exact count of 1/10000ths.
  const rateUnits = Math.round(rate * 10_000);

  const costPiastres = sumPiastres(expenses);
  const paymentPiastres = sumPiastres(payments);

  const feeProduct = costPiastres * rateUnits; // piastres x 1/10000
  if (!Number.isSafeInteger(feeProduct)) {
    throw new Error("finance: total too large to compute the fee exactly");
  }
  // Nearest whole pound: 100 piastres x 10000 rate units per pound.
  const feePiastres = roundHalfAwayFromZero(feeProduct / 1_000_000) * 100;
  const grandPiastres = costPiastres + feePiastres;

  // The rate itself is never returned — it must not leak into any payload.
  return {
    total_cost: fromPiastres(costPiastres),
    supervision_fee: fromPiastres(feePiastres),
    grand_total: fromPiastres(grandPiastres),
    total_payments: fromPiastres(paymentPiastres),
    balance: fromPiastres(paymentPiastres - grandPiastres),
  };
}

/**
 * Parses an amount typed by hand or pasted out of Excel.
 *
 * Real paste data is messy: thousands separators, Arabic-Indic digits from an
 * Arabic Windows locale, "ج.م" suffixes, and Excel's accounting style where a
 * negative is wrapped in parentheses — "(500)" means -500. Returns null when the
 * text is not a number at all, so the caller can reject the row instead of
 * silently storing NaN.
 */
export function parseAmount(input: string | number | null | undefined): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input === null || input === undefined) return null;

  let text = String(input).trim();
  if (!text) return null;

  // Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits to Latin.
  text = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  text = text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  // Arabic decimal separator and thousands separator.
  text = text.replace(/٫/g, ".").replace(/٬/g, "");

  // Accounting-style negatives: (500) -> -500
  const parenthesised = /^\((.*)\)$/.exec(text);
  if (parenthesised) text = `-${parenthesised[1]}`;

  // Strip everything that is not a digit, sign, or decimal point.
  text = text.replace(/[^\d.\-+]/g, "");
  if (!text || text === "-" || text === "+" || text === ".") return null;

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Western digits with thousands separators, in both locales: "1,026,955". */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
