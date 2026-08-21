import { a11yViolations as base } from './harness/a11y'

/* The design system's own suites render components ALONE, with no page around
 * them, so the page-level "all content must sit inside a landmark" rule always
 * fires and says nothing about the component. Landmarks are the page's job
 * (AppLayout / the templates in src/blocks) — the shared harness takes the
 * page-level exclusions as an argument, and this wrapper fixes it for every
 * bare component render here. */
export function a11yViolations(el: Element): Promise<string[]> {
  return base(el, ['region'])
}
