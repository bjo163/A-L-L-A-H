import type { InputHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ className, ...props }: TextFieldProps) {
  return <input className={classNames("eol-control", className)} {...props} />;
}
