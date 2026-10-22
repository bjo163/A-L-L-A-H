import type { HTMLAttributes } from "react";
import { classNames } from "../primitives/classNames";

export type MangaOrbitProps = Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden">;

/** Static decorative orbit ring. Motion is reserved for feedback and active-state indicators. */
export function MangaOrbit({ className, ...props }: MangaOrbitProps) {
  return <span aria-hidden="true" className={classNames("eol-manga-orbit", className)} {...props} />;
}
