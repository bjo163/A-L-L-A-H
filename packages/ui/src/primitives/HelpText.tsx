import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";

export type HelpTextProps = HTMLAttributes<HTMLParagraphElement>;

export function HelpText({ className, ...props }: HelpTextProps) {
  return <p className={classNames("eol-help-text", className)} {...props} />;
}
