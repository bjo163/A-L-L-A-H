import type { LabelHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return <label className={classNames("eol-field-label", className)} {...props} />;
}
