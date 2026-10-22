import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type SectionHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  level?: 2 | 3;
  id?: string;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  asideClassName?: string;
};

export function SectionHeading({ eyebrow, title, aside, level = 2, id, className, eyebrowClassName, titleClassName, asideClassName }: SectionHeadingProps) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <div className={classNames("eol-section-heading", className)}>
      <div className="eol-section-heading__main">
        {eyebrow && <p className={classNames("eol-section-heading__eyebrow", eyebrowClassName)}>{eyebrow}</p>}
        <Heading className={classNames("eol-section-heading__title", titleClassName)} id={id}>{title}</Heading>
      </div>
      {aside && <div className={classNames("eol-section-heading__aside", asideClassName)}>{aside}</div>}
    </div>
  );
}
