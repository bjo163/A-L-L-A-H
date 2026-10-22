import { useId, type HTMLAttributes, type ReactNode } from "react";
import { classNames } from "./classNames";

export type ErrorStateProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  role?: "alert" | "region";
};

export function ErrorState({
  title,
  description,
  action,
  role = "alert",
  className,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ErrorStateProps) {
  const titleId = useId();

  return (
    <div
      className={classNames("eol-state", "eol-state--error", className)}
      role={role}
      aria-labelledby={ariaLabelledBy ?? titleId}
      {...props}
    >
      <h3 id={titleId} className="eol-state__title">{title}</h3>
      {description ? <p className="eol-state__description">{description}</p> : null}
      {action ? <div className="eol-state__action">{action}</div> : null}
    </div>
  );
}
