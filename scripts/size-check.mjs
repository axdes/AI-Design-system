// Bundle budget for the design system. The check itself is shared with every
// other package (scripts/lib/size-check.mjs); only the numbers are here.
//
// `visual-*` is the screenshot gallery (visual/index.html): it imports the
// registry, the shared render map and every component, and no app user ever
// loads it, so it must not count against the shipped bundle.
import { checkBundleSize } from './lib/size-check.mjs'

checkBundleSize({ mainKb: 125, totalKb: 175, exclude: ['visual-'] })
