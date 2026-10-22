import { Badge, Button, EmptyState, Grid, MetricGrid, Notice, Panel, SectionHeading, TextField, AgentIcon, ArrowUpRightIcon, InfoIcon } from "@empire/ui";

export type ContinuumAgent = {
  id: string;
  code: string;
  term: string;
  role?: string;
  slug?: string;
  tier: string;
  status: string;
  metadata?: Record<string, unknown> | null;
};

type ContinuumViewProps = {
  agentCount: number;
  activeAgentCount: number;
  lexiconCount: number;
  agents: readonly ContinuumAgent[];
  canInvoke: boolean;
  directive: string;
  busy: boolean;
  onDirectiveChange: (value: string) => void;
  onInvoke: (agent: ContinuumAgent) => void;
};

export function ContinuumView({ agentCount, activeAgentCount, lexiconCount, agents, canInvoke, directive, busy, onDirectiveChange, onInvoke }: ContinuumViewProps) {
  return <>
    <section>
      <MetricGrid density="compact" items={[
        { label: "Registered agents", value: agentCount },
        { label: "Active agents", value: activeAgentCount, tone: "success" },
        { label: "Asma mappings", value: lexiconCount },
      ]} />
    </section>
    <section>
      <SectionHeading layout="compact" eyebrow="SERAPH REGISTRY" title="Agent fleet" aside={<Badge tone="info">Invocation is audit logged</Badge>} />
      <Grid minItemWidth="lg">
        {agents.map((agent) => <Panel manga as="article" key={agent.id} className="agent-card">
          <div className="agent-head"><span className="agent-symbol"><AgentIcon size={18} /></span><Badge tone={agent.status === "active" ? "success" : "warning"}>{agent.status}</Badge></div>
          <h3>{agent.term}</h3>
          <p className="agent-code">{agent.code} · {agent.tier}</p>
          <p>{agent.role ?? "Continuum agent"}</p>
          {canInvoke && <form className="invoke-form" onSubmit={(event) => { event.preventDefault(); onInvoke(agent); }}>
            <TextField aria-label={`Directive for ${agent.term}`} value={directive} onChange={(event) => onDirectiveChange(event.target.value)} maxLength={500} />
            <Button disabled={busy || !directive.trim()} type="submit">Invoke agent <ArrowUpRightIcon size={12} /></Button>
          </form>}
        </Panel>)}
      </Grid>
      {agents.length === 0 && <EmptyState title="No agents match" description="Try a different search term." />}
    </section>
    <Notice role="note" className="notice-panel"><InfoIcon size={16} /><p>Agent invocation records an instruction in the local audit ledger. It does not execute external tools or claim a completed task.</p></Notice>
  </>;
}
