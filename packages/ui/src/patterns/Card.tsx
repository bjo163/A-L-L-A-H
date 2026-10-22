import type { ComponentPropsWithoutRef, ElementType } from "react";
import { classNames } from "../primitives/classNames";

export type CardProps<T extends ElementType = "article"> = {
  as?: T;
  interactive?: boolean;
  selected?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Card<T extends ElementType = "article">({ as, interactive = false, selected = false, className, ...props }: CardProps<T>) {
  const Element = as ?? "article";
  return <Element {...props} className={classNames("eol-card", interactive && "eol-card--interactive", selected && "eol-card--selected", className)} data-interactive={interactive || undefined} data-selected={selected || undefined} />;
}
