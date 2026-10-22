import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
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

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({
  checked,
  onCheckedChange,
  className,
  onClick,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
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
});
