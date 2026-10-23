import type { CabSummary } from "@empire/api-contract";
import { projectMetricState } from "./metric-state.mjs";
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
  researchRunCount: number | null;
  canReadCab: boolean;
  canReadResearch: boolean;
  canReadContinuum: boolean;
  modules: readonly OverviewModule[];
  moduleInventory: readonly OverviewModule[];
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

export function OverviewView({ health, readiness, checkedAt, continuumStatus, capabilities, summary, researchRunCount, canReadCab, canReadResearch, canReadContinuum, modules, moduleInventory, workspaces, events, loading, error, searching, operatorRole, openApiUrl, onRefresh, onNavigate }: OverviewViewProps) {
  const studio = workspaces.find((workspace) => workspace.key === "continuum");
  const submissions = workspaces.find((workspace) => workspace.key === "research");
  const activeModules = moduleInventory.filter((module) => module.enabled).length;
  const researchMetric = projectMetricState({ value: researchRunCount, loading, error, permitted: canReadResearch });
  const cabMetric = projectMetricState({ value: summary?.active, loading, error, permitted: canReadCab });
  const moduleMetric = projectMetricState({ value: `${activeModules}/${moduleInventory.length}`, loading, error });
  const researchRuns = researchMetric.value;
  const openDecisions = cabMetric.value;
  const moduleCount = moduleMetric.value;
  const displayedReadiness = loading ? "checking" : error ? "unavailable" : readiness;
  const alertsEmpty = loading
    ? <EmptyState title="Loading recent signals" description="Recent activity is being refreshed." />
    : error
      ? <EmptyState title="Recent signals unavailable" description={error} />
      : !canReadContinuum
        ? <EmptyState title="Access needed" description="Your operator role does not include permission to read recent activity." />
        : <EmptyState title="No recent signals" description="New field notes and activity will land here." />;
  return <>
    <MangaTelemetryHero className="shadow-telemetry" eyebrow={<>API STATUS <StatusIndicator tone={displayedReadiness === "ok" ? "success" : displayedReadiness === "unavailable" ? "neutral" : "warning"}>{displayedReadiness.toUpperCase()}</StatusIndicator></>} title="Operations signals" description="Live API health, research runs, enabled modules, and Continuum status." metadata={<><span><ClockIcon size={13} /> {checkedAt ? `Last API check ${new Date(checkedAt).toLocaleTimeString()}` : "API check pending"}</span><span><CommandIcon size={13} /> {loading ? "…" : error ? "Unavailable" : capabilities.length} API capabilities</span><span><ArrowsIcon size={13} /> Continuum API · {loading ? "loading" : error ? "unavailable" : continuumStatus}</span></>} pulse={displayedReadiness.toUpperCase()} sfx={displayedReadiness === "ok" ? "PULSE!" : "ALERT!"} />
    <section id="overview" className="shadow-metrics"><SectionHeading layout="compact" eyebrow="FIELD NOTES · LIVE" title="Operations signals" aside={<div className="button-row"><a href={openApiUrl} target="_blank" rel="noreferrer">Signal protocol ↗</a><Button variant="secondary" disabled={loading} onClick={onRefresh}>{loading ? "Syncing…" : "Sync signals"}</Button></div>} />
      <MetricGrid density="compact" items={[{ label: "Research runs", value: researchRuns }, { label: "System-wide CAB items", value: openDecisions, tone: !error && summary?.active ? "warning" : "neutral" }, { label: "Enabled modules", value: moduleCount }, { label: "API health", value: loading ? "CHECKING" : error ? "UNAVAILABLE" : health.toUpperCase(), tone: loading || error || health === "unavailable" ? "neutral" : health === "degraded" ? "warning" : "success" }, { label: "Continuum API status", value: loading ? "LOADING" : error ? "UNAVAILABLE" : continuumStatus.toUpperCase() }]} />
    </section>
    <section className="shadow-dashboard-grid" aria-label="SHADOW API status and activity">
      <Panel manga as="section" className="shadow-workbench"><header className="shadow-workbench-head"><div><span className="shadow-index">01 / CONTINUUM API</span><h2>Continuum status</h2></div><div className="shadow-live"><i/> {loading ? "LOADING" : error ? "UNAVAILABLE" : continuumStatus.toUpperCase()}</div></header><p className="shadow-copy">This status is returned by the Continuum API. Story editing, published-story counts, and poster generation are not represented here.</p>{canReadContinuum&&studio&&<button className="shadow-link" onClick={()=>onNavigate(studio.key)}>OPEN CONTINUUM ↗</button>}</Panel>
      <Panel manga as="section" className="shadow-workflow"><header className="shadow-panel-head"><div><span className="shadow-index">02 / RESEARCH</span><h2>Research activity</h2></div><span className="shadow-panel-state">{canReadResearch ? `${researchRuns} RUNS` : "ACCESS NEEDED"}</span></header><p className="shadow-copy">{canReadResearch ? "Research run totals come from the API. Story publication and poster generation are not measured here." : "Your operator role does not include permission to read research runs."}</p>{canReadResearch&&submissions&&<button className="shadow-link" onClick={()=>onNavigate(submissions.key)}>OPEN RESEARCH RUNS ↗</button>}</Panel>
    </section>
    <section className="shadow-dashboard-lower" aria-label="Live operations">
      <Panel manga as="section" className="shadow-signal-map"><header className="shadow-panel-head"><div><span className="shadow-index">03 / API CAPABILITIES</span><h2>Available capabilities</h2></div><span className="shadow-panel-state">{loading ? "LOADING" : error ? "UNAVAILABLE" : `${capabilities.length} AVAILABLE`}</span></header>{!error&&capabilities.length ? <ul className="shadow-capability-list">{capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul> : <EmptyState title={loading ? "Loading capabilities" : error ? "Capabilities unavailable" : "No capabilities available"} description={error || "The API did not report any capabilities."} />}</Panel>
    </section>
    <section className="shadow-ops-grid">
      <Panel manga as="section" className="shadow-list-panel"><SectionHeading layout="compact" eyebrow="LIVE API DATA" title="Operations" aside={canReadResearch&&submissions && <button className="text-button" onClick={() => onNavigate(submissions.key)}>View research runs ↗</button>} /><div className="shadow-queue-row"><span className="shadow-queue-number">{canReadResearch ? researchRuns : "—"}</span><span><strong>Research runs</strong><small>Research API · {!canReadResearch ? "access needed" : loading ? "loading" : error || researchRunCount === null ? "unavailable" : "connected"}</small></span></div><div className="shadow-queue-row"><span className="shadow-queue-number">{openDecisions}</span><span><strong>System-wide CAB items</strong><small>Advisory Board API · global summary · {!canReadCab ? "access needed" : loading ? "loading" : error || !summary ? "unavailable" : "connected"}</small></span></div><div className="shadow-list-foot"><span>ENABLED MODULES</span><strong>{moduleCount}</strong></div></Panel>
      <Panel manga as="section" className="shadow-list-panel shadow-alerts"><SectionHeading layout="compact" eyebrow="JUST CAME THROUGH" title="Recent Alerts" aside={<button className="text-button" onClick={() => onNavigate("audit")}>All signals ↗</button>} /><EventList className="event-list" events={loading || error || !canReadContinuum ? [] : events.slice(0,4)} empty={alertsEmpty} /></Panel>
    </section>
    <section className="activity-preview"><SectionHeading layout="compact" eyebrow="THE WHOLE MAP" title="Go where the story leads" aside={<span className="muted">{operatorRole} access · {loading ? "checking modules" : error ? "module count unavailable" : `${activeModules} active modules`}</span>} /><div className="workspace-grid">{workspaces.map((workspace) => { const WorkspaceIcon = workspace.icon; return <MangaEffect as="button" type="button" key={workspace.key} interactive className="workspace-card" onClick={() => onNavigate(workspace.key)}><span className="workspace-icon"><WorkspaceIcon size={18} /></span><strong>{workspace.title}</strong><small>{workspace.description}</small><span className="workspace-arrow">Open workspace <ArrowUpRightIcon size={12} /></span></MangaEffect>; })}</div>{loading ? <LoadingState label="Listening for active modules…" /> : error ? <ErrorState role="region" title="Signal registry unavailable" description={error} action={<Button variant="secondary" onClick={onRefresh}>Try again</Button>} /> : modules.length > 0 ? <div className="module-list">{modules.map((module) => <Panel manga as="article" key={module.id}><div><strong>{module.title}</strong><small>{module.id} · {module.version}</small></div><Badge tone={module.enabled ? "success" : "neutral"}>{module.enabled ? "LIVE" : "DORMANT"}</Badge></Panel>)}</div> : <EmptyState title={searching ? "No signals match" : "The map is still unfolding"} description={searching ? "Try another search." : "Active modules will appear here when connected."} />}</section>
  </>;
}
