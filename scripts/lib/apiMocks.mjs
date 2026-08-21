// Serve a screen's API from committed fixtures instead of a running backend.
//
// The page gates covered exactly the two packages that need no server, and the
// note in screens-check.mjs said so plainly: "that is a fixture problem, not a
// decision that they matter less." This is the fixture problem, solved once.
//
// Why interception and not "just start the server": a real backend brings its
// own data directory, its own migrations and its own emptiness. A list screen
// with nothing in it exercises the empty state, not the card grid — and the grid
// is where the layout bugs were. Fixtures put a known, populated screen in front
// of the rules every time, on any machine, with no ports to wait for.
//
// Config shape, in config/screens.config.json:
//
//   "apiMocks": {
//     "**/api/projects":  "fixtures/projects.json",
//     "**/api/workshops": "fixtures/workshops.json"
//   }
//
// Paths are relative to the config file. A request that matches nothing is
// answered 404 with an empty object rather than left hanging, so a screen that
// calls an endpoint nobody thought about fails visibly instead of waiting out
// the `networkidle` timeout.
import { existsSync, readFileSync } from 'node:fs'

/**
 * @param {import('playwright').Page} page
 * @param {Record<string, string>} mocks  glob → fixture path
 * @param {string} root                   directory the paths are relative to
 */
export async function installApiMocks(page, mocks, root) {
  const entries = Object.entries(mocks ?? {}).filter(([k]) => !k.startsWith('_'))
  if (entries.length === 0) return

  /* The catch-all goes FIRST. Playwright matches handlers in reverse
   * registration order — the most recently added one wins — so registering it
   * last would swallow every fixture below it. It did: the first run of this
   * helper answered 404 to `/api/projects` and rendered an empty screen, and the
   * audit reported green because an empty page breaks no layout rule. The
   * per-rule tally is what showed it, one rule sitting at zero.
   *
   * Anything still reaching this handler is a call the config did not anticipate:
   * answered, not left hanging, so a missing fixture shows up as an empty screen
   * rather than as a `networkidle` timeout. */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  )
  for (const [glob, file] of entries) {
    const abs = `${root}/${file}`
    if (!existsSync(abs)) throw new Error(`apiMocks: no fixture at ${abs} (for "${glob}")`)
    const body = readFileSync(abs, 'utf8')
    await page.route(glob, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body }),
    )
  }
}
