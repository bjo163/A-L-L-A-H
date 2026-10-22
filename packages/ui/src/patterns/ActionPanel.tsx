import type { ReactNode } from "react";
import { Panel } from "../primitives/Panel";

export type ActionPanelProps = { eyebrow: ReactNode; title: ReactNode; description: ReactNode; action: ReactNode };

/** Compact callout panel with copy and a framework-owned primary action. */
export function ActionPanel({ eyebrow, title, description, action }: ActionPanelProps) {
  return <Panel as="section" manga className="cta-panel">
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
    {action}
  </Panel>;
}
