/* One writing of a number per system.
 *
 * A table's numbers are compared down a column, so the writing has to be the
 * same in every row and in every product: the same grouping, the same number of
 * decimals, the same place for the currency. Left to each caller, the same
 * amount ends up written three ways on one screen, which is how a total stops
 * adding up to what is above it.
 *
 * The UNIT belongs in the column header, not in every cell ("Amount (EUR)"),
 * so `money` takes `currency: false` for exactly that case. */

type MoneyOptions = {
  /** ISO code. `false` writes the bare number for a column whose header
   *  already names the currency. */
  currency?: string | false
  locale?: string
  /** Amounts are compared, not audited: whole units by default. Pass 2 for a
   *  ledger, where the cents are the point. */
  decimals?: number
}

/** An amount, grouped and aligned. Pair with `<Td align="end">`, which brings
 *  the tabular figures the comparison needs.
 *  @public Products format their own amounts; the writing lives here. */
export function money(value: number, { currency = 'EUR', locale = 'en-GB', decimals = 0 }: MoneyOptions = {}) {
  return new Intl.NumberFormat(locale, {
    style: currency === false ? 'decimal' : 'currency',
    currency: currency === false ? undefined : currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** A share, written the way a reader says it. `value` is the ratio (0.42), not
 *  the percentage, because that is what a computation produces.
 *  @public */
export function percent(value: number, { locale = 'en-GB', decimals = 0 }: { locale?: string; decimals?: number } = {}) {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

/** A count: grouped, never abbreviated. "1,284" and not "1.3k", because a count
 *  in a table is read against the counts above and below it.
 *  @public */
export function count(value: number, { locale = 'en-GB' }: { locale?: string } = {}) {
  return new Intl.NumberFormat(locale).format(value)
}
