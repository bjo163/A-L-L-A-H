import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Divider({ orientation = "horizontal", className, ...props }: DividerProps) {
  return <hr {...props} className={classNames("eol-divider", `eol-divider--${orientation}`, className)} aria-orientation={orientation} />;
}

export type KeyValueItem = { label: ReactNode; value: ReactNode };
export type KeyValueListProps = HTMLAttributes<HTMLDListElement> & { items: KeyValueItem[] };

export function KeyValueList({ items, className, ...props }: KeyValueListProps) {
  return <dl {...props} className={classNames("eol-key-value-list", className)}>{items.map((item, index) => <div className="eol-key-value-list__row" key={index}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}

export type CodeBlockProps = HTMLAttributes<HTMLElement> & { children?: ReactNode; language?: string };

export function CodeBlock({ children, language, className, ...props }: CodeBlockProps) {
  return <pre {...props} className={classNames("eol-code-block", className)} data-language={language}><code>{children}</code></pre>;
}
