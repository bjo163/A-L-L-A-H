import type { ReactNode } from "react";
import { Badge } from "../primitives/Badge";
import type { BadgeTone } from "../primitives/Badge";
import { SparkIcon } from "../primitives/Icon";
import { MangaEffect } from "./MangaEffect";

export type SensorDisclosureProps = {
  name: ReactNode;
  identity: ReactNode;
  symbol?: ReactNode;
  status: ReactNode;
  tone: BadgeTone;
  children: ReactNode;
};

/** Shared disclosure layout for sensor identity, state, and operational detail. */
export function SensorDisclosure({ name, identity, symbol, status, tone, children }: SensorDisclosureProps) {
  return (
    <MangaEffect as="details" interactive className="knowledge-card">
      <summary>
        <span className="knowledge-arabic">{symbol ?? <SparkIcon size={18} />}</span>
        <span className="knowledge-title"><strong>{name}</strong><small>{identity}</small></span>
        <Badge tone={tone}>{status}</Badge>
      </summary>
      <div className="knowledge-detail">{children}</div>
    </MangaEffect>
  );
}
