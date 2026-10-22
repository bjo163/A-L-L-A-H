import type { AnchorHTMLAttributes } from "react";
import { buttonClassName, type ButtonVariant } from "./buttonStyles";

export type ActionLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
};

export function ActionLink({ variant = "primary", className, ...props }: ActionLinkProps) {
  return <a {...props} className={buttonClassName(variant, className)} />;
}
