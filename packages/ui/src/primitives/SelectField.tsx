import type { SelectHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ className, ...props }: SelectFieldProps) {
  return <select className={classNames("eol-control", className)} {...props} />;
}
