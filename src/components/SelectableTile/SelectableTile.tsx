import "./SelectableTile.css";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "../Icon";

/* Monolithic because it is a checkbox or a radio wearing a card: the state,
 * the group it belongs to, and the four pieces of the card it wears. The
 * tile cannot be composed from parts without losing the input at its centre. */
type Props = {
  /** What this option is. */
  title: ReactNode;
  /** Whether it is currently chosen — this is a controlled control. */
  selected: boolean;
  /** Called with what the state becomes. */
  /* `onChange`, not `onSelect`: the vocabulary reserves onSelect for naming
   * WHICH thing was chosen, and this reports the tile's own value moving
   * between on and off. (2026-09-03) */
  onChange: (selected: boolean) => void;
  /** true when several tiles can be chosen at once: a checkbox mark instead of
   *  a radio one, and no group name needed. */
  multiple?: boolean;
  /** The group this tile belongs to. Required for a single-choice set — it is
   *  what makes the browser treat the tiles as one radio group (arrow keys,
   *  one choice, form submission). */
  name?: string;
  /** Icon name, above the title. */
  icon?: IconName;
  /** One line: what choosing this one means. */
  description?: ReactNode;
  /** Trailing facts — a price, a region, a size. */
  meta?: ReactNode;
  /** Dimmed and unpressable, but pointer events are KEPT so a Tooltip can say why this option is
   *  not available.
   */
  disabled?: boolean;
  className?: string;
};

/** A card that IS the control: the whole surface picks the option it shows,
 *  over a real radio or checkbox so the keyboard and the form get it for free.
 *  Reach for <LinkTile> when the tile navigates instead, for <Radio> or
 *  <Checkbox> when the options are words, and for <PlanCard> when the option is
 *  a priced plan. 
 *
 * Copy: the title is the choice, the description is what picking it means for
 * the reader — not a feature list. Options in one set stay parallel.
 */
export function SelectableTile({
  title,
  selected,
  onChange,
  multiple,
  name,
  icon,
  description,
  meta,
  disabled,
  className,
}: Props) {
  return (
    <label
      className={cn("selectable-tile", className)}
      data-selected={selected ? "" : undefined}
      data-multiple={multiple ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      <input
        className="selectable-tile-input"
        type={multiple ? "checkbox" : "radio"}
        name={name}
        checked={selected}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="selectable-tile-mark" aria-hidden="true">
        {multiple && <Icon name="check" size="sm" />}
      </span>
      {icon && (
        <span className="selectable-tile-icon" aria-hidden="true">
          <Icon name={icon} size="md" />
        </span>
      )}
      <span className="selectable-tile-title">{title}</span>
      {description && <span className="selectable-tile-description">{description}</span>}
      {meta && <span className="selectable-tile-meta">{meta}</span>}
    </label>
  );
}
