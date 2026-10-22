import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { classNames } from "./classNames";

type IconButtonName =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-label"?: string; "aria-labelledby": string };

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & IconButtonName & {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ children, className, size = "md", ...props }, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={classNames("eol-icon-button", `eol-icon-button--${size}`, className)}
    >
      {children}
    </button>
  );
});
