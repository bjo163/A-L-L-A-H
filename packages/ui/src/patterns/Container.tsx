import type { ElementType, HTMLAttributes } from "react";
import { classNames } from "../primitives/classNames";

export type ContainerSize = "reading" | "content" | "workspace";

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  size?: ContainerSize;
};

/** Shared responsive content width. Applications choose the semantic element and composition. */
export function Container({ as: Component = "div", size = "content", className, ...props }: ContainerProps) {
  return <Component className={classNames("eol-container", `eol-container--${size}`, className)} {...props} />;
}
