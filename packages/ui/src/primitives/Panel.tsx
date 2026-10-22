import type { ComponentPropsWithoutRef, ElementType } from "react";
import { classNames } from "./classNames";

export type PanelProps<T extends ElementType = "div"> = {
  as?: T;
  manga?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Panel<T extends ElementType = "div">({
  as,
  manga = false,
  className,
  ...props
}: PanelProps<T>) {
  const Element = as ?? "div";

  return (
    <Element className={classNames("eol-panel", manga && "eol-manga-surface", className)} {...props} />
  );
}
