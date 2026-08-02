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
 * Postgres returns `numeric` as a string, so `rows.reduce((a, r) => a + r.amount, 0)`
 * silently concatenates ("0" + "100" + "-20" = "0100-20") instead of adding.
 * Every amount goes through Number() here, and nowhere else.
 */
export function sumAmounts(rows: readonly MoneyRow[]): number {
  return rows.reduce((total, row) => {
    const value = Number(row.amount);
    if (!Number.isFinite(value)) {
      throw new Error(`finance: non-numeric amount ${JSON.stringify(row.amount)}`);
    }
    return total + value;
  }, 0);
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

  const total_cost = sumAmounts(expenses);
  const supervision_fee = Math.round(total_cost * rate);
  const grand_total = total_cost + supervision_fee;
  const total_payments = sumAmounts(payments);

  // The rate itself is never returned — it must not leak into any payload.
  return {
    total_cost,
    supervision_fee,
    grand_total,
    total_payments,
    balance: total_payments - grand_total,
  };
}

/** Western digits with thousands separators, in both locales: "1,026,955". */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
