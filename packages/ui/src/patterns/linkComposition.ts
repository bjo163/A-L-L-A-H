import type { ReactNode } from "react";

/** Props for a single anchor rendered by a consumer-owned router adapter. */
export type SharedLinkProps<TId extends string = string> = {
  id: TId;
  href: string;
  className?: string;
  children: ReactNode;
};

/** Render exactly one anchor-like interactive element; do not wrap it in another link or button. */
export type SharedLinkRenderer<TId extends string = string> = (props: SharedLinkProps<TId>) => ReactNode;
