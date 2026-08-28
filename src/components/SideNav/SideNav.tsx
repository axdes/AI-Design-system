import "./SideNav.css";
import { Fragment, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Divider } from "../Divider";
import { Icon, type IconName } from "../Icon";
import { Tooltip } from "../Tooltip";

/** One navigable entry. Routing-agnostic three ways, and the third is the one a
 *  router app wants: pass `href` for a plain anchor, `onSelect` for a button, or
 *  `render` to wrap the entry's own markup in your router's link.
 *
 *  `render` exists because the other two both cost something in a single-page
 *  app, and until 2026-08-23 every product paid the second price without
 *  choosing it: `href` reloads the whole document, so all three apps used
 *  `onSelect`, and every navigation entry in every product became a <button>.
 *  A button cannot be middle-clicked into a new tab, cannot have its address
 *  copied, and is announced as a button to someone who is navigating. */
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
  /**
   * Wrap the entry in your own link. The callback is handed the entry's inner
   * markup and the class and ARIA it must carry; return an element that renders
   * them. `href` and `onSelect` are ignored when it is given, because the link
   * you return owns the navigation.
   */
  render?: (inner: ReactNode, props: { className: string; 'aria-current'?: 'page'; 'data-usage'?: string }) => ReactElement;
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
  /**
   * Which control collapses the rail. `logo` is the default and is the decided
   * answer: collapsed, the biggest target on the rail is what opens the rail,
   * and expanded, hovering the mark says what pressing it will do. It used to
   * default to `bottom`, and the measurement on 2026-08-23 was that no product
   * passed this prop at all — so every one of them carried a Collapse button
   * nobody had chosen, while the behaviour they wanted sat behind a default.
   */
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
  collapseControl = "logo",
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  "aria-label": ariaLabel = "Primary",
}: Props) {
  const [internal, setInternal] = useState(defaultCollapsed);
  const isCollapsed = collapsible && (collapsed ?? internal);
  /* The logo can only be the control if there IS one. Without this a rail with
   * no logo and the default control would have no way to collapse at all —
   * found by the existing tests the moment the default changed, which is what
   * they are for. */
  const logoTogglable = collapsible && !!(logo ?? logoMark) && (collapseControl === "logo" || collapseControl === "both");
  const showBottomToggle = collapsible && (collapseControl === "bottom" || collapseControl === "both" || !logoTogglable);

  function toggle() {
    const next = !isCollapsed;
    onCollapsedChange?.(next);
    if (collapsed === undefined) setInternal(next);
  }

  const brand = isCollapsed ? (logoMark ?? logo) : logo;

  return (
    <aside className="side-nav" data-collapsed={isCollapsed || undefined} data-has-mark={logoMark ? "" : undefined} aria-label={ariaLabel}>
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
                  const shared = {
                    className,
                    "aria-current": item.active ? ("page" as const) : undefined,
                    "data-usage": item.usage,
                  };
                  const node = item.render ? (
                    item.render(inner, shared)
                  ) : item.href ? (
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
