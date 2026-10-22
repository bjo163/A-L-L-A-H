import type { ReactNode } from "react";
import { ArrowRightIcon } from "../primitives/Icon";
import { Panel } from "../primitives/Panel";

export type WorkflowStep = { id: string; number: string; title: ReactNode; description: ReactNode };
export type WorkflowStepsProps = { label: string; items: readonly WorkflowStep[] };

/** Ordered process cards with a decorative transition cue between adjacent steps. */
export function WorkflowSteps({ label, items }: WorkflowStepsProps) {
  return <div className="flow-track" role="list" aria-label={label}>
    {items.map((step, index) => <Panel as="article" manga className="flow-step" role="listitem" key={step.id}>
      <span className="flow-number">{step.number}</span>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
      {index < items.length - 1 && <ArrowRightIcon className="flow-arrow" size={16}/>}
    </Panel>)}
  </div>;
}
