import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import { MangaSfx } from "./MangaSfx";
import { PageIntro } from "./PageIntro";
import type { PageIntroProps } from "./PageIntro";

export type MangaPageIntroProps = PageIntroProps & {
  sfx?: string;
  sfxClassName?: string;
  decoration?: ReactNode;
};

/** A shared page introduction with the common manga panel, motion, and SFX treatment. */
export function MangaPageIntro({
  className,
  sfx,
  sfxClassName,
  decoration,
  ...props
}: MangaPageIntroProps) {
  const sharedDecoration = decoration ?? (sfx ? <MangaSfx text={sfx} className={classNames("eol-manga-page-intro__sfx", sfxClassName)} /> : undefined);

  return (
    <PageIntro
      {...props}
      className={classNames("eol-manga-page-intro", sfx && "eol-manga-page-intro--with-sfx", "eol-manga-panel", "eol-manga-reveal", className)}
      decoration={sharedDecoration}
    />
  );
}
