import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export const illustrationRatios = ["hero", "wide", "square", "portrait", "panoramic"] as const;
export type IllustrationRatio = (typeof illustrationRatios)[number];
export type IllustrationFit = "cover" | "contain";

type IllustrationFrameBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-hidden" | "aria-label" | "role" | "style"
> & {
  ratio?: IllustrationRatio;
  fit?: IllustrationFit;
  children: ReactNode;
};

export type IllustrationFrameProps = IllustrationFrameBaseProps & (
  | { decorative: true; label?: never }
  | { decorative?: false; label: string }
);

/** Shared, ratio-constrained frame for meaningful or decorative product artwork. */
export function IllustrationFrame({
  ratio = "hero",
  fit = "contain",
  decorative,
  label,
  className,
  children,
  ...props
}: IllustrationFrameProps) {
  return (
    <div
      {...props}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={classNames("eol-illustration-frame", className)}
      data-fit={fit}
      data-ratio={ratio}
      role={decorative ? undefined : "img"}
    >
      {children}
    </div>
  );
}
