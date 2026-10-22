import type { ElementType, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children?: ReactNode;
  className?: string;
  id?: string;
};

export function Heading({ as = "h2", children, className, id }: HeadingProps) {
  const Element = as;
  return <Element id={id} className={classNames("eol-heading", `eol-heading--${as}`, className)}>{children}</Element>;
}

export type TextProps = {
  as?: "p" | "span" | "div";
  children?: ReactNode;
  className?: string;
  muted?: boolean;
};

export function Text({ as = "p", children, className, muted = false }: TextProps) {
  const Element: ElementType = as;
  return <Element className={classNames("eol-text", muted && "eol-text--muted", className)}>{children}</Element>;
}

export type MetadataProps = {
  children?: ReactNode;
  className?: string;
};

export function Metadata({ children, className }: MetadataProps) {
  return <span className={classNames("eol-metadata", className)}>{children}</span>;
}
