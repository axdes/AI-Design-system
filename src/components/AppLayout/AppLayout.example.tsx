/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { AppLayout } from './AppLayout'
import { BrandMark } from '../BrandMark'
import { Card, CardTitle } from '../Card'
import { Grid, Stack } from '../Layout'
import { Icon } from '../Icon'
import { PageHeader } from '../PageHeader'
import { Prose } from '../Prose'
import { SideNav } from '../SideNav'

/* THIS IS THE SHELL AS A PRODUCT ACTUALLY BUILDS IT, checked against the one
 * this system's own site runs on (apps/showcase/src/site/SiteShell.tsx). An
 * example that composes the frame differently from every product using it
 * teaches a shell nobody has.
 *
 * Three things make it the real thing rather than a sketch:
 *
 *   THE BRAND IS <BrandMark> IN BOTH SLOTS, and the collapsed one points
 *   outward. The cap is what keeps the mark the same shape when the rail
 *   changes width; a bare glyph in `logo` and another in `logoMark` is two
 *   pictures of one brand.
 *
 *   THE ITEMS ARE LINKS. `href` makes them anchors, which is what navigation
 *   is: middle-click, copy-address and the browser's own back all work. In a
 *   single-page app `href` alone reloads the document, so `render` hands the
 *   anchor to the router — the escape SideNav gained on 2026-08-23 for exactly
 *   this, and the reason `onSelect` is the fallback rather than the default.
 *
 *   THE RAIL SAYS IT COLLAPSES AND WHAT DOES IT. `collapsible` with
 *   `collapseControl="logo"`: collapsed, the biggest target on the rail is what
 *   opens it.
 *
 * `arrangement` is not varied here on purpose. It is a decision about the
 * PRODUCT, made once in the shell — rail, float, top or none — and two shells
 * side by side to compare it would teach an arrangement no product has. The
 * four are described on the prop, where a reader meets them.
 *
 * On narrow screens a side arrangement becomes an overlay drawer, which is what
 * `navOpen` and `onNavClose` drive.
 */
const BRAND = <Icon name="auto_awesome" size="md" />

export function Example() {
  const [navOpen, setNavOpen] = useState(false)
  const [active, setActive] = useState('/library')

  const item = (href: string, label: string, icon: 'folder' | 'check_circle') => ({
    id: href,
    label,
    icon,
    href,
    active: active === href,
    /* Stands in for a router link. A product returns its own <NavLink>. */
    render: (inner: React.ReactNode, props: Record<string, unknown>) => (
      <a {...props} href={href} onClick={(e) => { e.preventDefault(); setActive(href) }}>{inner}</a>
    ),
  })

  return (
    <AppLayout
      arrangement="rail"
      navOpen={navOpen}
      onNavClose={() => setNavOpen(false)}
      nav={
        <SideNav
          aria-label="Primary"
          collapsible
          collapseControl="logo"
          logo={<><BrandMark>{BRAND}</BrandMark><strong>Acme</strong></>}
          logoMark={<BrandMark direction="expand">{BRAND}</BrandMark>}
          groups={[
            {
              label: 'Workspace',
              items: [item('/library', 'Library', 'folder'), item('/review', 'For review', 'check_circle')],
            },
          ]}
        />
      }
    >
      {/* What goes in `children` is always a PAGE — a header and content under
          it — because the one thing this component arranges is the relationship
          between the rail and what stands beside it. */}
      <PageHeader title="Content library" />
      <Stack gap={4}>
        <Grid gap={4} min="md">
          <Card>
            <CardTitle as="h2">Drafts</CardTitle>
            <Prose size="sm">Twelve items, four of them edited this week.</Prose>
          </Card>
          <Card>
            <CardTitle as="h2">Published</CardTitle>
            <Prose size="sm">Ninety items. Nothing is waiting on you here.</Prose>
          </Card>
        </Grid>
      </Stack>
    </AppLayout>
  )
}
