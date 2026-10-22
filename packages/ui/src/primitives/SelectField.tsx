import { forwardRef, type SelectHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField({ className, ...props }, ref) {
  return <select ref={ref} className={classNames("eol-control", className)} {...props} />;
});
