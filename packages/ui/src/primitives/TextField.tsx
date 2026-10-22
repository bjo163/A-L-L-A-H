import { forwardRef, type InputHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ className, ...props }, ref) {
  return <input ref={ref} className={classNames("eol-control", className)} {...props} />;
});
