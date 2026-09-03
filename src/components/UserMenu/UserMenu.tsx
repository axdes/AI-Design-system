import "./UserMenu.css";
import { Avatar } from "../Avatar";
import { Dropdown, DropdownItem } from "../Dropdown";
import { type IconName } from "../Icon";

export type UserMenuAction = { id: string; label: string; icon?: IconName; onSelect: () => void };

type Props = {
  name: string;
  /** Secondary line under the name (e.g. secondary). */
  /* `secondary`, the same word <Identity> uses for the line under a name.
   * `role` elsewhere is the domain word for a chat turn — user or assistant —
   * and a person's job title is not that. (2026-09-03) */
  secondary?: string;
  avatarSrc?: string;
  /** Menu entries shown in the dropdown. */
  actions: UserMenuAction[];
  menuLabel?: string;
};

/** Account trigger for a sidebar footer: name + secondary expanded, avatar-only when
 *  the surrounding rail is collapsed (reacts to a collapsed SideNav / app shell).
 *  Presentation-only — the consumer supplies the user and the menu actions. 
 *
 * Copy: the trigger names the person, and the items are verbs — "Sign out", not
 * "Sign-out".
 */
export function UserMenu({ name, secondary, avatarSrc, actions, menuLabel = "Account menu" }: Props) {
  return (
    <Dropdown
      className="user-menu"
      align="start"
      trigger={({ isOpen, ...triggerProps }) => (
        <button type="button" className="user-menu-trigger" data-open={isOpen || undefined} aria-label={menuLabel} {...triggerProps}>
          <Avatar name={name} src={avatarSrc} size="md" className="user-menu-avatar" />
          <span className="user-menu-trigger-text">
            <span className="user-menu-trigger-name">{name}</span>
            {secondary && <span className="user-menu-trigger-secondary">{secondary}</span>}
          </span>
        </button>
      )}
    >
      {actions.map((a) => (
        <DropdownItem key={a.id} icon={a.icon} onClick={a.onSelect}>{a.label}</DropdownItem>
      ))}
    </Dropdown>
  );
}
