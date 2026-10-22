import type { ReactNode } from "react";
import { Panel } from "../primitives/Panel";
import { ModuleGrid, type ModuleGridItem } from "./ModuleGrid";

export type RepositoryOverviewProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  modules: readonly ModuleGridItem[];
  modulesLabel?: string;
};

/** Repository implementation summary paired with a shared module inventory. */
export function RepositoryOverview({ eyebrow, title, description, actions, modules, modulesLabel }: RepositoryOverviewProps) {
  return <Panel as="section" manga className="atlas-base">
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {actions}
    </div>
    <ModuleGrid items={modules} label={modulesLabel}/>
  </Panel>;
}
