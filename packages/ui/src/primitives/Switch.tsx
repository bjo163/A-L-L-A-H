import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

type SwitchPropsBase = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked" | "children" | "aria-label" | "aria-labelledby"
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type SwitchProps = SwitchPropsBase & (
  | { children: ReactNode; "aria-label"?: string; "aria-labelledby"?: string }
  | { children?: ReactNode; "aria-label": string; "aria-labelledby"?: string }
  | { children?: ReactNode; "aria-label"?: string; "aria-labelledby": string }
);

export function Switch({
  checked,
  onCheckedChange,
  className,
  onClick,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SwitchProps) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={classNames("eol-switch", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange(!checked);
      }}
    >
      {children}
    </button>
  );
}
