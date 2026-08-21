import { useEffect, useRef, useState } from 'react'

/**
 * Does the whole "simple" list layout still fit on one screen?
 *
 * The rule it serves: a list page shows a centred welcome (hero title, the
 * cards, one big CTA, no toolbar) while everything fits the viewport, and flips
 * to the standard header layout the moment it outgrows it. That rule was written
 * once and then implemented three times — as this hook in workshops, and inline
 * in the design system's own ContentLibraryPage and in salim's copy of it. The
 * three had already drifted in their variable names while measuring the same
 * thing with the same arithmetic.
 *
 * "Fits" is measured mode-neutrally, with no magic pixel numbers: the grid's
 * intrinsic height (it exists in both layouts) plus the welcome chrome captured
 * live from the DOM. The chrome — title, subtitle, buttons, gaps — is stable, so
 * it is cached from the simple render and reused to decide whether to leave the
 * standard layout again. Comparing against the CONTENT's scroll height instead
 * would be the obvious mistake: it grows with the cards, so it always "fits".
 *
 * @param count  how many items are in the list; re-measures when it changes.
 * @returns `fits`, plus the two element setters to hand to `ref`.
 */
export function useSimpleFit(count: number) {
  const [gridEl, setGridEl] = useState<HTMLElement | null>(null)
  const [clusterEl, setClusterEl] = useState<HTMLElement | null>(null)
  const chromeRef = useRef(0)
  const [fits, setFits] = useState(true)

  useEffect(() => {
    if (!gridEl) {
      setFits(true)
      return
    }
    const measure = () => {
      /* Chrome = everything in the simple layout that is not the grid: the empty
       * header bar, the welcome head, the CTA, the paddings and gaps. Measured
       * off the shell's main column while the simple layout is on screen
       * (clusterEl present), then cached so the check stays valid once the page
       * flips to standard. `main` is the semantic anchor and survives any shell:
       * a class-name anchor broke silently the day the railless shell classes
       * were promoted and renamed — the null made every phone fit "true". */
      const main = gridEl.closest('main')
      if (clusterEl && main) chromeRef.current = Math.max(0, main.scrollHeight - gridEl.scrollHeight)
      setFits(gridEl.scrollHeight + chromeRef.current <= window.innerHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(gridEl)
    if (clusterEl) ro.observe(clusterEl)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [gridEl, clusterEl, count])

  return { fits, setGridEl, setClusterEl }
}
