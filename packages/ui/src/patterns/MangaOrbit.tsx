import type { HTMLAttributes } from "react";
import { classNames } from "../primitives/classNames";

export type MangaOrbitVariant = "primary" | "secondary" | "tertiary";
export type MangaOrbitProps = Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden"> & {
  variant?: MangaOrbitVariant;
};

/** Decorative orbit ring using the shared manga glow motion. */
export function MangaOrbit({ className, variant, ...props }: MangaOrbitProps) {
  return <span aria-hidden="true" className={classNames("eol-manga-orbit", variant && `eol-manga-orbit--${variant}`, className)} {...props} />;
}
