import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return classNames("eol-button", `eol-button--${variant}`, className);
}

export function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
