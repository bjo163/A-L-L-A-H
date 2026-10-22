import { classNames } from "../primitives/classNames";

export type MangaSfxProps = {
  text: string;
  className?: string;
};

/** Decorative manga onomatopoeia, kept out of the accessibility tree. */
export function MangaSfx({ text, className }: MangaSfxProps) {
  return <span aria-hidden="true" className={classNames("eol-manga-sfx", className)}>{text}</span>;
}
