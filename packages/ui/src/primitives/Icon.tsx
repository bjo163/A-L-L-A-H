import type { ReactNode, SVGProps } from "react";

/** Original, stroke-based Empire icon set. Decorative unless a label is given. */
export const iconNames = [
  "home", "globe", "spark", "users", "directory", "clock", "arrows", "menu",
  "search", "filter", "refresh", "settings", "command", "logOut", "externalLink", "close",
  "info", "success", "warning", "error", "pending", "user", "team", "lock", "agent",
  "modules", "knowledge", "evidence", "history", "audit", "approval", "document", "source",
  "copy", "download", "plus", "edit", "sun", "moon", "chevronDown", "chevronLeft",
  "chevronRight", "arrowLeft", "arrowRight", "arrowUpRight", "arrowDownRight", "check",
] as const;

export type IconName = (typeof iconNames)[number];

export const iconGroups: ReadonlyArray<{ label: string; names: readonly IconName[] }> = [
  { label: "Navigation", names: ["home", "menu", "close", "externalLink", "chevronDown", "chevronLeft", "chevronRight", "arrowLeft", "arrowRight", "arrowUpRight", "arrowDownRight"] },
  { label: "Actions", names: ["search", "filter", "refresh", "settings", "command", "logOut", "copy", "download", "plus", "edit"] },
  { label: "Status", names: ["info", "success", "warning", "error", "pending", "check"] },
  { label: "Identity & access", names: ["users", "directory", "user", "team", "lock"] },
  { label: "Product & operations", names: ["globe", "spark", "agent", "modules", "knowledge", "evidence", "history", "clock", "audit", "approval", "document", "source", "sun", "moon", "arrows"] },
];

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  spark: <><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.87"/></>,
  directory: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/><path d="M19 5v5M16.5 7.5h5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  arrows: <><path d="M4 8h15l-3-3M20 16H5l3 3"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  filter: <><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/></>,
  command: <path d="M9 7V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V7Z"/>,
  logOut: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
  externalLink: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></>,
  close: <><path d="m5 5 14 14M19 5 5 19"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  success: <><circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/></>,
  warning: <><path d="M10.3 4.2 2.8 17.1A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.9L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></>,
  error: <><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>,
  pending: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></>,
  team: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0m.5-4a4.5 4.5 0 0 1 6 4"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
  agent: <><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4m-4 6h.01M16 13h.01M9 17h6"/><path d="M2 11v4m20-4v4"/></>,
  modules: <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></>,
  knowledge: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6"/></>,
  evidence: <><path d="M7 3h10l4 4v10l-4 4H7l-4-4V7z"/><path d="m8 12 2.5 2.5L16 9"/></>,
  history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></>,
  audit: <><path d="M8 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="5" rx="1"/><path d="M7 12h10M7 16h7"/></>,
  approval: <><path d="m12 3 2.4 1.3 2.8-.2 1.2 2.6 2.3 1.6-.6 2.7.6 2.7-2.3 1.6-1.2 2.6-2.8-.2L12 19l-2.4-1.3-2.8.2-1.2-2.6-2.3-1.6.6-2.7-.6-2.7 2.3-1.6 1.2-2.6 2.8.2z"/><path d="m8.5 11.5 2.3 2.3 4.8-5"/></>,
  document: <><path d="M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v6h5M8 13h8m-8 4h8"/></>,
  source: <><path d="M7 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2m10-16h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/><path d="m14 8-4 8m-3-6 3 2m7-2-3 2"/></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  edit: <><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.8 6.2 4 4"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
  moon: <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.7 8.7 0 1 0 20.2 15.4Z"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  chevronLeft: <path d="m15 18-6-6 6-6"/>,
  chevronRight: <path d="m9 18 6-6-6-6"/>,
  arrowLeft: <><path d="m14 5-7 7 7 7"/><path d="M7 12h14"/></>,
  arrowRight: <><path d="m10 5 7 7-7 7"/><path d="M17 12H3"/></>,
  arrowUpRight: <><path d="M7 17 17 7M8 7h9v9"/></>,
  arrowDownRight: <><path d="m7 7 10 10M17 8v9H8"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
};

type IconProps = Omit<SVGProps<SVGSVGElement>, "aria-hidden" | "aria-label" | "role"> & {
  name: IconName;
  size?: number;
  label?: string;
};

export function Icon({ name, size = 20, label, ...props }: IconProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={props.className ? `eol-icon ${props.className}` : "eol-icon"}
      fill="none"
      focusable="false"
      height={size}
      role={label ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
