import type { TextareaHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea className={classNames("eol-control", "eol-control--textarea", className)} {...props} />;
}
