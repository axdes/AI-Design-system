/** Short localized date — "May 15, 2026" / Arabic equivalent. */
/* Published because: a product takes it on three screens, and nothing in this
 * package renders a date without a component around it. Kept here rather than in
 * that product because a date rendered two ways in one system is the same defect
 * as a colour decided twice, and the second product to need it would have copied
 * the first one's. (2026-09-02) */
export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
