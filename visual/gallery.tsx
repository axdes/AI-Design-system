/* Visual gallery — the page scripts/visual-check.mjs screenshots.
 *
 * One case is mounted at a time, on purpose: the golden examples include dialogs
 * that portal to <body>, and a gallery that renders everything at once would
 * bury the other cases under an overlay. The checker calls window.__show(name)
 * between screenshots instead of reloading the page.
 *
 * The cases ARE the golden examples — the same code the registry publishes and
 * the test suite renders, so a visual baseline can never drift away from the
 * documented usage. */
import { StrictMode, useEffect, useState, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import './gallery.css'
import './i18n'
import { ToastProvider } from '../src/lib/ToastProvider'
import { CardHeader, CardTitle } from '../src/components/Card'
import { Icon } from '../src/components/Icon'
import { Row, Stack } from '../src/components/Layout'
import { Select } from '../src/components/Select'
import { SegmentedControl } from '../src/components/SegmentedControl'
import { Table, TBody, Td, Th, THead, Tr } from '../src/components/Table'
import { PageHeader } from '../src/components/PageHeader'
import { SectionLabel } from '../src/components/SectionLabel'
import surfaces from '../src/components/surfaces.json'
import registry from '../component-registry.json'
import { RENDER, type RenderProps } from '../src/specimens'

const modules = import.meta.glob<{ Example?: () => ReactElement }>('../src/**/*.example.tsx', {
  eager: true,
})

const CASES = Object.entries(modules)
  .map(([path, mod]) => ({
    name: path.split('/').pop()!.replace('.example.tsx', ''),
    Example: mod.Example,
  }))
  .filter((c): c is { name: string; Example: () => ReactElement } => Boolean(c.Example))
  .sort((a, b) => a.name.localeCompare(b.name))

declare global {
  interface Window {
    __cases: string[]
    __show: (name: string, theme?: 'light' | 'dark') => void
  }
}

/* The screenshot harness loads `/visual/` bare and captures the whole page, so
 * the browse toolbar must never render for it. It is gated on `?browse`, a param
 * the harness never uses; open `/visual/?browse` to click through the examples. */
const BROWSE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('browse')

/* Variant data + how to render a component — reused from the contract test's
 * render map, driven by the registry, so the Variants view can never list a
 * variant the system doesn't actually have. */
type VariantDef = { prop: string; values?: string[] }
const ENTRIES = { ...registry.components, ...registry.blocks } as unknown as Record<string, { variants?: Record<string, VariantDef> }>
/* Modal portals a full-screen overlay when open — one per value would stack and
 * bury the page, so it opts out of the matrix (its example still shows it). */
const NO_MATRIX = new Set(['Modal'])

function variantDefs(name: string): VariantDef[] {
  const v = ENTRIES[name]?.variants
  if (!v) return []
  return Object.values(v).filter((d) => (d.values ?? []).length > 0)
}
function canShowVariants(name: string) {
  return !!RENDER[name] && !NO_MATRIX.has(name) && variantDefs(name).length > 0
}

/* Sample values per variant. A boolean variant reaches the registry as just
 * ["true"], but "what does this flag DO" is only answerable against the flag
 * being off, so booleans are always shown as the pair. */
function sampleValues(d: VariantDef): { value: unknown; label: string }[] {
  const values = d.values ?? []
  if (values.length === 1 && values[0] === 'true') {
    return [{ value: false, label: 'false' }, { value: true, label: 'true' }]
  }
  return values.map((v) => ({ value: v, label: v }))
}

/* Fixtures that make a variant legible. Some variants say nothing with the
 * default fixture: `iconEnd` only differs when there IS an icon, Card's flags are about padding and
 * elevation and need real content, and `fill` means "take the size of the
 * parent", which is meaningless without a parent — so a fixture can also wrap
 * the sample in a dashed slot standing in for that parent. Keyed by component
 * then prop; `*` applies to every value of that prop. */
type Fixture = { props?: RenderProps; slot?: 'square' | 'tall' }

const FIXTURE: Record<string, Record<string, (value: unknown) => Fixture>> = {
  Button: {
    iconEnd: (v) => ({
      props: { children: v ? <>Create<Icon name="add" /></> : <><Icon name="add" />Create</> },
    }),
    loading: () => ({ props: { children: 'Save', loadingLabel: 'Saving' } }),
    block: () => ({ slot: 'tall' }),
  },
  IconButton: { loading: () => ({ props: { loadingLabel: 'Saving' } }) },
  Card: {
    '*': () => ({
      props: {
        children: (
          <>
            <CardHeader><CardTitle as="h3">Quarterly report</CardTitle></CardHeader>
            <p>Draft shared with the finance team.</p>
          </>
        ),
      },
    }),
    fill: () => ({
      props: {
        children: (
          <>
            <CardHeader><CardTitle as="h3">Quarterly report</CardTitle></CardHeader>
            <p>Draft shared with the finance team.</p>
          </>
        ),
      },
      slot: 'tall',
    }),
    /* `flush` exists for full-bleed content that owns its own edge spacing, so
     * the fixture has to BE that content. With a paragraph it just looks like a
     * card whose text fell off the edge. */
    flush: () => ({
      props: {
        children: (
          <Table aria-label="Reports">
            <THead><Tr><Th>Report</Th><Th>Status</Th></Tr></THead>
            <TBody>
              <Tr><Td>Quarterly</Td><Td>Draft</Td></Tr>
              <Tr><Td>Annual</Td><Td>Published</Td></Tr>
            </TBody>
          </Table>
        ),
      },
    }),
  },
  Avatar: { fill: () => ({ slot: 'square' }) },
}

function fixture(name: string, prop: string, value: unknown): Fixture {
  const build = FIXTURE[name]?.[prop] ?? FIXTURE[name]?.['*']
  return build ? build(value) : {}
}

/* A registry-driven spec sheet: for each variant prop, the component rendered
 * once per value on an identical stage, captioned underneath.
 *
 * The stage matters. Rendering samples straight onto the gallery page made half
 * of them unreadable — a Card is borderless by design and vanished on white, a
 * ghost Button had nothing to sit on — and every caption sat at a different
 * height because it followed its sample's box. So each sample gets a fixed-size
 * stage painted with the surface that component actually lives on
 * (surfaces.json), and the captions land on one line because the stages do. */
function VariantMatrix({ name }: { name: string }) {
  const render = RENDER[name]
  const surface = (surfaces as Record<string, string>)[name] ?? 'card'
  return (
    <Stack gap={8}>
      {variantDefs(name).map((d) => (
        <Stack gap={3} key={d.prop}>
          <SectionLabel>{d.prop}</SectionLabel>
          <div className="gallery-matrix">
            {sampleValues(d).map(({ value, label }) => {
              const { props, slot } = fixture(name, d.prop, value)
              const sample = render({ ...props, [d.prop]: value })
              return (
              <figure className="gallery-sample" key={label}>
                <div className="gallery-sample-stage" data-surface={surface}>
                  {slot ? <div className="gallery-slot" data-shape={slot}>{sample}</div> : sample}
                </div>
                <figcaption className="gallery-sample-label">
                  {d.prop}={label}
                </figcaption>
              </figure>
              )
            })}
          </div>
        </Stack>
      ))}
    </Stack>
  )
}

function Gallery() {
  const [name, setName] = useState(CASES[0]?.name ?? '')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mode, setMode] = useState<'example' | 'variants'>('example')

  useEffect(() => {
    window.__cases = CASES.map((c) => c.name)
    window.__show = (next, t) => {
      if (t) document.documentElement.dataset.theme = t
      setName(next)
    }
  }, [])

  useEffect(() => {
    if (BROWSE) document.documentElement.dataset.theme = theme
  }, [theme])

  const current = CASES.find((c) => c.name === name)
  if (!current) return null
  const { Example } = current
  /* Each example declares the surface it lives on (surfaces.json): 'page' owns the
   * viewport, 'region' brings its own surface (shown on the page), 'card' is a
   * control that lives inside a card (framed on a white card with padding). */
  const context = (surfaces as Record<string, string>)[name] ?? 'card'
  const body = (
    <div className="visual-case" data-case={name} data-context={context}>
      <Example />
    </div>
  )
  if (!BROWSE) return body

  const variantsAvailable = context !== 'page' && canShowVariants(name)
  const showVariants = variantsAvailable && mode === 'variants'

  const picker = (surface: 'base' | 'muted') => (
    <Row gap={3} align="center">
      <Select
        label="Component"
        surface={surface}
        value={name}
        onChange={setName}
        options={CASES.map((c) => ({ value: c.name, label: c.name }))}
      />
      {variantsAvailable && (
        <SegmentedControl<'example' | 'variants'>
          label="View"
          surface={surface}
          value={mode}
          onChange={setMode}
          options={[{ value: 'example', label: 'Example' }, { value: 'variants', label: 'Variants' }]}
        />
      )}
      <SegmentedControl<'light' | 'dark'>
        label="Theme"
        surface={surface}
        value={theme}
        onChange={setTheme}
        options={[{ value: 'light', label: 'Light', icon: 'light_mode' }, { value: 'dark', label: 'Dark', icon: 'dark_mode' }]}
      />
    </Row>
  )

  /* Full-page examples own the viewport; the picker floats over the top-right. */
  if (context === 'page') {
    return (
      <>
        {body}
        <div className="gallery-float">{picker('base')}</div>
      </>
    )
  }

  return (
    <div className="gallery-shell">
      <PageHeader title="Gallery" actions={picker('muted')} />
      <div className="gallery-scroll">
        {showVariants ? <div className="visual-case" data-context="region"><VariantMatrix name={name} /></div> : body}
      </div>
    </div>
  )
}

createRoot(document.getElementById('stage')!).render(
  <StrictMode>
    <ToastProvider>
      <Gallery />
    </ToastProvider>
  </StrictMode>,
)
