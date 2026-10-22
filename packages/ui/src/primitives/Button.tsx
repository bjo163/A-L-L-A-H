"use client";

import { forwardRef, useCallback, type ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";
import { useMotionVisibility } from "./useMotionVisibility";

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  ...props
}: ButtonProps, ref) {
  const motionRef = useMotionVisibility<HTMLButtonElement>(loading);
  const mergedRef = useCallback((element: HTMLButtonElement | null) => {
    motionRef.current = element;
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  }, [motionRef, ref]);

  return (
    <button
      className={classNames(buttonClassName(variant), `eol-button--${size}`, className)}
      ref={mergedRef}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="eol-button__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
});
