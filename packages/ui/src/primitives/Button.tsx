import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
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
  size = "md",
  loading = false,
  disabled = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(buttonClassName(variant), `eol-button--${size}`, className)}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="eol-button__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
