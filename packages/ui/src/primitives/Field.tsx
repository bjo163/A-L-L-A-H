import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { classNames } from "./classNames";

export type FieldProps = {
  label: ReactNode;
  control: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  required?: boolean;
  className?: string;
};

export function Field({ label, control, hint, error, id, required = false, className }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? `eol-field-${generatedId.replace(/:/g, "")}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [control.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;
  const labelledControl = cloneElement(control, {
    id: control.props.id ?? controlId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : control.props["aria-invalid"],
  });

  if (!isValidElement(control)) return null;
  return (
    <div className={classNames("eol-field", className)}>
      <label className="eol-field-label" htmlFor={controlId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {labelledControl}
      {hint && <p className="eol-help-text" id={hintId}>{hint}</p>}
      {error && <p className="eol-field-error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}
