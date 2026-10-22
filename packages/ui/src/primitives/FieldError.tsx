import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";

export type FieldErrorProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldError({ className, ...props }: FieldErrorProps) {
  return <p className={classNames("eol-field-error", className)} role="alert" {...props} />;
}
