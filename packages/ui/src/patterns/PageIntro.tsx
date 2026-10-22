import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type PageIntroProps = {
  breadcrumb?: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  decoration?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;
};

export function PageIntro({ breadcrumb, eyebrow, title, description, meta, actions, decoration, className, eyebrowClassName, titleClassName, descriptionClassName, actionsClassName }: PageIntroProps) {
  return (
    <>
      {breadcrumb && <div className="eol-page-intro__breadcrumb">{breadcrumb}</div>}
      <header className={classNames("eol-page-intro", className)}>
        {decoration && <div className="eol-page-intro__decoration">{decoration}</div>}
        <p className={classNames("eol-page-intro__eyebrow", eyebrowClassName)}>{eyebrow}</p>
        <h1 className={classNames("eol-page-intro__title", titleClassName)}>{title}</h1>
        {description && <p className={classNames("eol-page-intro__description", descriptionClassName)}>{description}</p>}
        {meta && <div className="eol-page-intro__meta">{meta}</div>}
        {actions && <div className={classNames("eol-page-intro__actions", actionsClassName)}>{actions}</div>}
      </header>
    </>
  );
}
