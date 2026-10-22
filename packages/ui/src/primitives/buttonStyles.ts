export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const buttonVariants = {
  primary: "eol-button--primary",
  secondary: "eol-button--secondary",
  quiet: "eol-button--quiet",
  danger: "eol-button--danger",
} satisfies Record<ButtonVariant, string>;

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return ["eol-button", buttonVariants[variant], className].filter(Boolean).join(" ");
}
