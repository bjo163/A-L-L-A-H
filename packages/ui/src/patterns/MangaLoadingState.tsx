import { classNames } from "../primitives/classNames";
import { MangaEffect } from "./MangaEffect";
import { MangaSfx } from "./MangaSfx";

export type MangaLoadingStateProps = {
  label: string;
  eyebrow?: string;
  sfx?: string;
  className?: string;
};

/** Shared loading panel with accessible status text and decorative manga effects. */
export function MangaLoadingState({
  label,
  eyebrow = "LOADING",
  sfx = "WHOOSH!",
  className,
}: MangaLoadingStateProps) {
  return (
    <MangaEffect
      panel
      speedLines
      reveal
      className={classNames("eol-manga-loading", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
      tabIndex={-1}
    >
      <MangaSfx className="eol-manga-loading__sfx" text={sfx} />
      <span className="eol-manga-loading__orbit" aria-hidden="true" />
      <div className="eol-manga-loading__content">
        <p className="eol-manga-loading__eyebrow">{eyebrow}</p>
        <h1 className="eol-manga-loading__title">{label}</h1>
        <div className="eol-manga-loading__lines" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </MangaEffect>
  );
}
