import { forwardRef, type TextareaHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} className={classNames("eol-control", "eol-control--textarea", className)} {...props} />;
});
