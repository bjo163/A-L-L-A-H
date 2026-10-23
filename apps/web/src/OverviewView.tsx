import type { CabSummary } from "@empire/api-contract";
import { ArrowUpRightIcon, ArrowsIcon, Badge, Button, ClockIcon, CommandIcon, EmptyState, ErrorState, EventList, LoadingState, MangaEffect, MangaTelemetryHero, MetricGrid, Panel, SectionHeading, StatusIndicator } from "@empire/ui";
import type { IconComponent } from "@empire/ui";

type Signal = "checking" | "ok" | "degraded" | "unavailable";
type OverviewModule = { id: string; title: string; version: string; state: string; enabled: boolean };
type OverviewEvent = { id: string; timestamp: string; actor: string; action: string; details: string };
type Workspace = { key: string; title: string; description: string; icon: IconComponent };

type OverviewViewProps = {
  health: Signal;
  readiness: Signal;
  checkedAt?: string;
  continuumStatus: string;
  capabilities: readonly string[];
  summary: CabSummary | null;
  researchRunCount: number;
  modules: readonly OverviewModule[];
  workspaces: readonly Workspace[];
  events: readonly OverviewEvent[];
  loading: boolean;
  error: string;
  searching: boolean;
  operatorRole: string;
  openApiUrl: string;
  onRefresh: () => void;
  onNavigate: (key: string) => void;
};

export function OverviewView({ health, readiness, checkedAt, continuumStatus, capabilities, summary, researchRunCount, modules, workspaces, events, loading, error, searching, operatorRole, openApiUrl, onRefresh, onNavigate }: OverviewViewProps) {
  const studio = workspaces.find((workspace) => workspace.key === "continuum");
  const ledger = workspaces.find((workspace) => workspace.key === "world");
  const crew = workspaces.find((workspace) => workspace.key === "directory");
  const submissions = workspaces.find((workspace) => workspace.key === "research");
  const board = workspaces.find((workspace) => workspace.key === "cab");
  const activeModules = modules.filter((module) => module.enabled).length;
  const openItems = summary?.active ?? 0;
  const pendingStories = researchRunCount;
  return <>
    <MangaTelemetryHero className="shadow-telemetry" eyebrow={<>NETWORK PULSE <StatusIndicator tone={readiness === "ok" ? "success" : readiness === "unavailable" ? "neutral" : "warning"}>{readiness.toUpperCase()}</StatusIndicator></>} title="Stories observed. People amplified." description="A living map of the voices, places, and signals moving through Moonwitness." metadata={<><span><ClockIcon size={13} /> {checkedAt ? `Last signal ${new Date(checkedAt).toLocaleTimeString()}` : "Listening for first signal"}</span><span><CommandIcon size={13} /> {capabilities.length} active signals</span><span><ArrowsIcon size={13} /> {continuumStatus} studio</span></>} pulse="100" sfx={readiness === "ok" ? "PULSE!" : "ALERT!"} />
    <section id="overview" className="shadow-metrics"><SectionHeading layout="compact" eyebrow="FIELD NOTES · LIVE" title="The network, at a glance" aside={<div className="button-row"><a href={openApiUrl} target="_blank" rel="noreferrer">Signal protocol ↗</a><Button variant="secondary" disabled={loading} onClick={onRefresh}>{loading ? "Syncing…" : "Sync signals"}</Button></div>} />
      <MetricGrid density="compact" items={[{ label: "Network status", value: health.toUpperCase(), tone: health === "ok" ? "success" : health === "degraded" ? "warning" : "neutral" }, { label: "Stories in motion", value: pendingStories }, { label: "Crew signals", value: crew ? "CONNECTED" : "—", tone: crew ? "success" : "neutral" }, { label: "Open decisions", value: openItems, tone: openItems ? "warning" : "neutral" }]} />
    </section>
    <section className="shadow-feature-grid" aria-label="Creative workspaces">
      <Panel manga as="article" className="shadow-feature shadow-feature--story"><span className="shadow-index">01 / FIELD JOURNAL</span><h2>Story Studio</h2><p>Turn real people and real places into living stories.</p><div className="shadow-feature-meta"><span>{continuumStatus.toUpperCase()}</span><span>{activeModules} active tools</span></div>{studio && <button className="shadow-link" onClick={() => onNavigate(studio.key)}>Enter the studio ↗</button>}</Panel>
      <Panel manga as="article" className="shadow-feature shadow-feature--workflow"><span className="shadow-index">02 / THE SIGNAL PATH</span><h2>Publishing Workflow</h2><ol className="shadow-steps"><li><span>01</span> Listen for signals</li><li><span>02</span> Shape the story</li><li><span>03</span> Amplify the voices</li></ol><div className="shadow-feature-meta"><span>{pendingStories} stories tracked</span><span>{summary?.emergency ?? 0} urgent decisions</span></div></Panel>
      <Panel manga as="article" className="shadow-feature shadow-feature--poster"><span className="shadow-index">03 / MAKE IT VISIBLE</span><h2>Poster Forge</h2><p>Give the signal a shape. Make the work impossible to scroll past.</p><div className="shadow-poster-stamp">MAKE<br/>NOISE</div>{studio && <button className="shadow-link" onClick={() => onNavigate(studio.key)}>Create from a story ↗</button>}</Panel>
    </section>
    <section className="shadow-ops-grid">
      <Panel manga as="section" className="shadow-list-panel"><SectionHeading layout="compact" eyebrow="PEOPLE POWER THE MAP" title="Crew Registry" aside={crew && <button className="text-button" onClick={() => onNavigate(crew.key)}>Meet the crew ↗</button>} /><p className="shadow-copy">A global crew of curious humans, connected by the places and stories they care about.</p><div className="shadow-crew-art" aria-hidden="true"><span>WE ARE<br/>THE MAP</span><i>✳</i></div><div className="shadow-list-foot"><span>CREW ACCESS</span><Badge tone={crew ? "success" : "neutral"}>{crew ? "CONNECTED" : "RESTRICTED"}</Badge></div></Panel>
      <Panel manga as="section" className="shadow-list-panel"><SectionHeading layout="compact" eyebrow="IN THE PIPELINE" title="Mission Queue" aside={submissions && <button className="text-button" onClick={() => onNavigate(submissions.key)}>View queue ↗</button>} /><div className="shadow-queue-row"><span className="shadow-queue-number">{String(pendingStories).padStart(2,"0")}</span><span><strong>Stories awaiting a signal</strong><small>Submission Queue · {submissions ? "live" : "access needed"}</small></span><span className="shadow-queue-arrow">↗</span></div><div className="shadow-queue-row"><span className="shadow-queue-number">{String(openItems).padStart(2,"0")}</span><span><strong>Decisions in the field</strong><small>Advisory Board · {summary ? "live" : "access needed"}</small></span><span className="shadow-queue-arrow">↗</span></div><div className="shadow-list-foot"><span>ACTIVE MODULES</span><strong>{activeModules} / {modules.length}</strong></div></Panel>
      <Panel manga as="section" className="shadow-list-panel shadow-alerts"><SectionHeading layout="compact" eyebrow="JUST CAME THROUGH" title="Recent Alerts" aside={<button className="text-button" onClick={() => onNavigate("audit")}>All signals ↗</button>} /><EventList className="event-list" events={events.slice(0,4)} empty={<EmptyState title="No recent signals" description="New field notes and activity will land here." />} /></Panel>
    </section>
    <section className="activity-preview"><SectionHeading layout="compact" eyebrow="THE WHOLE MAP" title="Go where the story leads" aside={<span className="muted">{operatorRole} access · {activeModules} active modules</span>} /><div className="workspace-grid">{workspaces.map((workspace) => { const WorkspaceIcon = workspace.icon; return <MangaEffect as="button" type="button" key={workspace.key} interactive className="workspace-card" onClick={() => onNavigate(workspace.key)}><span className="workspace-icon"><WorkspaceIcon size={18} /></span><strong>{workspace.title}</strong><small>{workspace.description}</small><span className="workspace-arrow">Open workspace <ArrowUpRightIcon size={12} /></span></MangaEffect>; })}</div>{modules.length > 0 ? <div className="module-list">{modules.map((module) => <Panel manga as="article" key={module.id}><div><strong>{module.title}</strong><small>{module.id} · {module.version}</small></div><Badge tone={module.enabled ? "success" : "neutral"}>{module.enabled ? "LIVE" : "DORMANT"}</Badge></Panel>)}</div> : loading ? <LoadingState label="Listening for active modules…" /> : error ? <ErrorState role="region" title="Signal registry unavailable" description="Sync the network and try again." action={<Button variant="secondary" onClick={onRefresh}>Try again</Button>} /> : <EmptyState title={searching ? "No signals match" : "The map is still unfolding"} description={searching ? "Try another search." : "Active modules will appear here when connected."} />}</section>
  </>;
}
