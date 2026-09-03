/* Joins class names and drops the falsy ones — the one utility every component
 * in this package calls, 111 of them. It exists so a conditional class is
 * written the same way everywhere: `cn('card', open && 'is-open')` rather than
 * a template string per component, which is how a stray `undefined` reaches the
 * DOM as a class name. Reach for it whenever a class depends on a prop. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
