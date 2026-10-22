import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type LayoutSpace = "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12";

type LayoutProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  gap?: LayoutSpace;
};

export type StackProps = LayoutProps & {
  align?: "stretch" | "start" | "center" | "end";
};

export type InlineProps = LayoutProps & {
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  justify?: "start" | "center" | "end" | "between";
};

export type GridProps = LayoutProps & {
  minItemWidth?: "sm" | "md" | "lg";
};

export function Stack({ gap = "4", align = "stretch", className, ...props }: StackProps) {
  return <div {...props} className={classNames("eol-stack", className)} data-align={align} data-gap={gap} />;
}

export function Inline({ gap = "3", align = "center", justify = "start", className, ...props }: InlineProps) {
  return <div {...props} className={classNames("eol-inline", className)} data-align={align} data-gap={gap} data-justify={justify} />;
}

export function Grid({ gap, minItemWidth = "md", className, ...props }: GridProps) {
  return <div {...props} className={classNames("eol-grid", className)} data-gap={gap} data-min-item-width={minItemWidth} />;
}
