import type { ReactNode } from "react";

export type CallToActionProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  className?: string;
};

/** Closing brand section with app-owned copy and router-aware action links. */
export function CallToAction({ eyebrow, title, description, actions, className }: CallToActionProps) {
  return <section className={["closing-section", className].filter(Boolean).join(" ")}>
    <div className="eol-container">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="closing-actions">{actions}</div>
    </div>
  </section>;
}
