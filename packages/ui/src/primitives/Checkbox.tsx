import type { InputHTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
};

export function Checkbox({ label, description, id, className, ...props }: CheckboxProps) {
  const descriptionId = description && id ? `${id}-description` : undefined;
  return <label className={classNames("eol-checkbox", className)}><input {...props} id={id} type="checkbox" aria-describedby={descriptionId} /><span className="eol-checkbox__content"><strong>{label}</strong>{description && <small id={descriptionId}>{description}</small>}</span></label>;
}
