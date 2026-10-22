import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

export type LoadingStateProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-busy"> & {
  label: ReactNode;
  busy?: boolean;
};

export function LoadingState({ label, busy = true, className, ...props }: LoadingStateProps) {
  return (
    <div
      className={classNames("eol-state", "eol-state--loading", className)}
      role="status"
      aria-live="polite"
      aria-busy={busy}
      {...props}
    >
      <span className="eol-state__indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
