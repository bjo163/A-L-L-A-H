import type { HTMLAttributes } from "react";
import { classNames } from "../primitives/classNames";

export type SectionProfile = "editorial" | "operational";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  profile?: SectionProfile;
};

/** Shared page rhythm for long-form and task-focused sections. */
export function Section({ profile = "editorial", className, ...props }: SectionProps) {
  return <section {...props} className={classNames("eol-section", className)} data-profile={profile} />;
}
