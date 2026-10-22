import type { ComponentPropsWithoutRef, ElementType } from "react";
import { classNames } from "../primitives/classNames";

export type MangaEffectProps<T extends ElementType = "div"> = {
  as?: T;
  panel?: boolean;
  interactive?: boolean;
  action?: boolean;
  row?: boolean;
  speedLines?: boolean;
  screentone?: boolean;
  reveal?: boolean;
  spin?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/** Composes the shared manga panel, texture, and motion treatments. */
export function MangaEffect<T extends ElementType = "div">({
  as,
  panel = false,
  interactive = false,
  action = false,
  row = false,
  speedLines = false,
  screentone = false,
  reveal = false,
  spin = false,
  className,
  ...props
}: MangaEffectProps<T>) {
  const Element = as ?? "div";

  return (
    <Element
      className={classNames(
        (panel || interactive) && "eol-panel",
        (panel || interactive) && "eol-manga-panel",
        interactive && "eol-manga-panel--interactive",
        action && "eol-manga-action",
        row && "eol-manga-row",
        speedLines && "eol-manga-speed-lines",
        screentone && "eol-manga-screentone",
        reveal && "eol-manga-reveal",
        spin && "eol-manga-spin",
        className,
      )}
      {...props}
    />
  );
}
