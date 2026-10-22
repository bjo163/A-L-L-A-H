import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type ActionGroupProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  align?: "start" | "center" | "end" | "between";
};

export function ActionGroup({ children, align = "end", className, ...props }: ActionGroupProps) {
  return <div {...props} className={classNames("eol-action-group", `eol-action-group--${align}`, className)}>{children}</div>;
}
