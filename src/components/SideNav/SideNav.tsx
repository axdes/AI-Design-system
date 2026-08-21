import "./SideNav.css";
import { Fragment, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Divider } from "../Divider";
import { Icon, type IconName } from "../Icon";
import { Tooltip } from "../Tooltip";

/** One navigable entry. Routing-agnostic: pass `href` to render an anchor, or
 *  `onSelect` to render a button — the consumer owns navigation. */
export type SideNavItem = {
  id: string;
  label: string;
  icon?: IconName;
  /** Secondary line under the label (hidden when collapsed). */
  sublabel?: string;
  /** Right-aligned slot, e.g. a <Badge> (hidden when collapsed). */
  trailing?: ReactNode;
  /** What to call this entry in a product's own usage log, when the label is not the
   *  answer. A rail entry that carries a `trailing` number reads as one control today
   *  and another tomorrow, because the number moves with it. */
  usage?: string;
  active?: boolean;
  href?: string;
  onSelect?: () => void;
};

export type SideNavGroup = {
  /** Optional uppercase group heading (hidden when collapsed). */
  label?: string;
  items: SideNavItem[];
};

/** How the collapse control is exposed: a row at the `bottom` of the rail, by
 *  clicking the `logo`, or `both`. */
type CollapseControl = "bottom" | "logo" | "both";

type Props = {
  groups: SideNavGroup[];
  /** Full brand lockup, shown when expanded (mark + wordmark). */
  logo?: ReactNode;
  /** The mark alone, shown when collapsed. Provide it whenever the rail can
   *  collapse: the fallback is `logo`, and a wordmark does not fit the rail. */
  logoMark?: ReactNode;
  /** Pinned to the bottom (e.g. a user menu). */
  footer?: ReactNode;
  /** Master switch for the collapse affordance (default true). */
  collapsible?: boolean;
  collapseControl?: CollapseControl;
  /** Controlled collapsed state. Omit to let the component manage it. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  "aria-label"?: string;
};

/**
 * The application navigation column: sections, the active route, and the
 * collapse to an icon rail.
 */
export function SideNav({
  groups,
  logo,
  logoMark,
  footer,
  collapsible = true,
  collapseControl = "bottom",
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  "aria-label": ariaLabel = "Primary",
}: Props) {
  const [internal, setInternal] = useState(defaultCollapsed);
  const isCollapsed = collapsible && (collapsed ?? internal);
  const logoTogglable = collapsible && (collapseControl === "logo" || collapseControl === "both");
  const showBottomToggle = collapsible && (collapseControl === "bottom" || collapseControl === "both");

  function toggle() {
    const next = !isCollapsed;
    onCollapsedChange?.(next);
    if (collapsed === undefined) setInternal(next);
  }

  const brand = isCollapsed ? (logoMark ?? logo) : logo;

  return (
    <aside className="side-nav" data-collapsed={isCollapsed || undefined} aria-label={ariaLabel}>
      {brand && (
        <div className="side-nav-header">
          {logoTogglable ? (
            <button
              type="button"
              className="side-nav-logo"
              onClick={toggle}
              aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
              aria-expanded={!isCollapsed}
            >
              {brand}
            </button>
          ) : (
            <span className="side-nav-logo">{brand}</span>
          )}
        </div>
      )}

      <div className="side-nav-rail">
        <nav className="side-nav-menu">
          {groups.map((group, gi) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- the label IS the key; the index only covers an unlabelled group, of which there is at most one
            <Fragment key={group.label ?? gi}>
              {/* Collapsed, the group heading is gone and the icons of three groups run together
                  as one column, so the rule takes the heading's place as the thing that says
                  where a group ends. Rendered always, shown by CSS only where it is needed:
                  expanded (and on mobile, which stays expanded) the heading already does the job. */}
              {gi > 0 && <Divider className="side-nav-separator" />}
              <div className="side-nav-group">
                {group.label && <div className="side-nav-group-label">{group.label}</div>}
                {group.items.map((item) => {
                  const inner = (
                    <>
                      {item.icon && <Icon name={item.icon} size="md" />}
                      <span className="side-nav-item-text">
                        {/* A name too long for the rail truncates, so the full one stays
                            reachable on hover rather than being lost to the ellipsis. */}
                        <span className="side-nav-item-label" title={item.label}>{item.label}</span>
                        {item.sublabel && <span className="side-nav-item-sub">{item.sublabel}</span>}
                      </span>
                      {item.trailing && <span className="side-nav-item-trailing">{item.trailing}</span>}
                    </>
                  );
                  const className = cn("side-nav-item", item.active && "is-active");
                  const node = item.href ? (
                    <a href={item.href} className={className} onClick={item.onSelect}
                      data-usage={item.usage} aria-current={item.active ? "page" : undefined}>
                      {inner}
                    </a>
                  ) : (
                    <button type="button" className={className} onClick={item.onSelect}
                      data-usage={item.usage} aria-current={item.active ? "page" : undefined}>
                      {inner}
                    </button>
                  );
                  return (
                    <Tooltip key={item.id} content={item.label} placement="end" enabled={isCollapsed}>
                      {node}
                    </Tooltip>
                  );
                })}
              </div>
            </Fragment>
          ))}

          {showBottomToggle && (
            <Tooltip content={isCollapsed ? "Expand" : "Collapse"} placement="end" enabled={isCollapsed}>
              <button type="button" className="side-nav-item side-nav-toggle" onClick={toggle}
                aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                aria-expanded={!isCollapsed}>
                <Icon name={isCollapsed ? "arrow_right_to_line" : "arrow_left_to_line"} size="md" />
                <span className="side-nav-item-text">
                  <span className="side-nav-item-label">{isCollapsed ? "Expand" : "Collapse"}</span>
                </span>
              </button>
            </Tooltip>
          )}
        </nav>
      </div>

      {footer && <div className="side-nav-footer">{footer}</div>}
    </aside>
  );
}
