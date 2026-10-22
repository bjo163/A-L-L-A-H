import type { ReactNode } from "react";

export const domainSymbolNames = ["arsy", "heliogrid", "qrealm", "forge", "cosmos", "ziil"] as const;
export type DomainSymbolName = (typeof domainSymbolNames)[number];

const symbolPaths: Record<DomainSymbolName, ReactNode> = {
  arsy: <><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.5"/><circle cx="19" cy="6" r="1.5"/><circle cx="5" cy="18" r="1.5"/><circle cx="19" cy="18" r="1.5"/><path d="m10 10-3.7-3m7.4 0L17 10m-7 4-3.7 3m7.4 0 3.7-3"/></>,
  heliogrid: <><circle cx="12" cy="8" r="3.5"/><path d="M12 1.5v2m-7.4.1 1.4 1.4m12-.1 1.4-1.4M2.5 11h2m15 0h2M4 15.5h16M6 19h12m-9-3.5v3.4m6-3.4v3.4"/></>,
  qrealm: <><path d="m12 2.5 7.2 4.1v8.8L12 19.5l-7.2-4.1V6.6L12 2.5Z"/><path d="m12 6.7 3.6 2.1v4.4L12 15.3l-3.6-2.1V8.8L12 6.7Z"/><circle cx="12" cy="11" r="1"/></>,
  forge: <><path d="M4 17.5h16l-2.2-3.2H8.2L5 8.5 2.5 10l3.1 5.2L4 17.5Z"/><path d="M9 14.3 12 7l3 7.3M12 3V1.5m5.1 3.1 1-1m-12.2 0 1 1"/></>,
  cosmos: <><path d="M3 5.5c3.5-1.2 6.5-.5 9 1.8 2.5-2.3 5.5-3 9-1.8v13c-3.5-1.2-6.5-.5-9 1.8-2.5-2.3-5.5-3-9-1.8v-13Z"/><path d="M12 7.3v13M6.5 9h2m-2 3h2m7-3h2m-2 3h2"/></>,
  ziil: <><path d="M12 2.5 20 6v5.4c0 4.7-3.2 8-8 10.1-4.8-2.1-8-5.4-8-10.1V6l8-3.5Z"/><path d="m8 12.2 2.6 2.6 5.6-5.6"/></>,
};

export type DomainSymbolProps = {
  name: DomainSymbolName;
  size?: number;
  className?: string;
};

/** Decorative, single-family domain glyph. Keep the domain name visible beside it. */
export function DomainSymbol({ name, size = 24, className }: DomainSymbolProps) {
  return <svg
    aria-hidden="true"
    className={className ? `eol-domain-symbol ${className}` : "eol-domain-symbol"}
    data-domain={name}
    fill="none"
    focusable="false"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="var(--eol-icon-stroke)"
    viewBox="0 0 24 24"
    width={size}
  >{symbolPaths[name]}</svg>;
}
