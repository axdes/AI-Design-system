/**
 * Ecosystem symbol for the design system's own showcase — a light, standalone
 * mark, NO background tile, in the same family as the other products' marks:
 * a waveform, a condensing chat, a bell.
 *
 * A component grid with a spark in the fourth cell: tiles are what a design
 * system is made of, and the spark is the AI that assembles them — the whole
 * pitch, said with one shape. Icon rules per the `.eco-symbol` contract in
 * styles/utilities.css: inscribed in a 48x48 square with an even ~7px safe
 * area, strokes in the brand gradient so it reads on any surface, and the
 * still frame is the complete mark.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="eco-symbol"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="AI Design System"
    >
      <defs>
        <linearGradient id="ds-grad" x1="9" y1="9" x2="39" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary-accent)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      {/* Three component tiles… */}
      <rect x="9" y="9" width="13" height="13" rx="3.5" stroke="url(#ds-grad)" strokeWidth="2.6" />
      <rect x="26" y="9" width="13" height="13" rx="3.5" stroke="url(#ds-grad)" strokeWidth="2.6" />
      <rect x="9" y="26" width="13" height="13" rx="3.5" stroke="url(#ds-grad)" strokeWidth="2.6" />
      {/* …and the spark assembling the fourth. */}
      <path
        d="M32.5 25.5l2 4.5 4.5 2.5-4.5 2.5-2 4.5-2-4.5-4.5-2.5 4.5-2.5Z"
        stroke="url(#ds-grad)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
