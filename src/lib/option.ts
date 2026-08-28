/**
 * ONE ITEM IN A LIST YOU PICK FROM.
 *
 * Four components asked the same question — Select, Combobox, SegmentedControl
 * and FilterDropdown — and each declared its own type for the answer:
 * `SelectOption`, `ComboboxOption`, `Segment` and an inline object literal
 * (found 2026-08-26). Four names for one idea is how a reader learns one
 * control and cannot transfer to the next, which is the duplication that is
 * felt from outside even when no line of code repeats.
 *
 * The base carries only what EVERY one of them renders. A component that shows
 * more extends it, so the extra field is a promise that component actually
 * keeps: `icon` on a segmented control is drawn, `icon` on a Select would be a
 * field the caller supplies and nothing paints.
 *
 * `Segment` is now DonutChart's alone. It used to be exported twice — a share
 * of a ring in one file and a choice in another — which is one name meaning two
 * things, the exact failure config/prop-vocabulary.json exists to prevent for
 * props and did not cover for types.
 */
export type Option<V extends string> = {
  /** What the caller gets back. */
  value: V
  /** What the reader sees. */
  label: string
}
