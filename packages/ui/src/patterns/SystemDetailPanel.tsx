import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "../primitives/Badge";
import { InputIcon, OutputIcon } from "../primitives/Icon";
import { MangaEffect } from "./MangaEffect";

export type SystemDetailPanelProps = {
  systemId: string;
  category: ReactNode;
  status: ReactNode;
  statusTone: BadgeTone;
  code: string;
  name: ReactNode;
  description: ReactNode;
  inputsLabel: ReactNode;
  inputs: readonly ReactNode[];
  outputsLabel: ReactNode;
  outputs: readonly ReactNode[];
  note: ReactNode;
};

/** Editorial detail panel for one system, with status, orbital marker, IO lists, and provenance note. */
export function SystemDetailPanel({
  systemId, category, status, statusTone, code, name, description,
  inputsLabel, inputs, outputsLabel, outputs, note,
}: SystemDetailPanelProps) {
  return <MangaEffect panel className="explorer-detail" data-system={systemId}>
    <div className="explorer-detail-top">
      <span className="panel-label">{category}</span>
      <Badge className="stage-pill" tone={statusTone}>{status}</Badge>
    </div>
    <div className="explorer-visual" aria-hidden="true">
      <span className="explore-ring explore-ring-1"/>
      <span className="explore-ring explore-ring-2"/>
      <span className="explore-ring explore-ring-3"/>
      <span className="explore-core">{code}</span>
    </div>
    <h3>{name}</h3>
    <p className="explorer-description">{description}</p>
    <div className="explorer-io">
      <div><span className="panel-label">{inputsLabel}</span>{inputs.map((input, index) => <p key={index}><InputIcon size={14}/> {input}</p>)}</div>
      <div><span className="panel-label">{outputsLabel}</span>{outputs.map((output, index) => <p key={index}><OutputIcon size={14}/> {output}</p>)}</div>
    </div>
    <p className="explorer-note">{note}</p>
  </MangaEffect>;
}
