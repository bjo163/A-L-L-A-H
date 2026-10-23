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
    <section id="overview" className="shadow-metrics"><SectionHeading layout="compact" eyebrow="FIELD NOTES · LIVE" title="Stories observed. People amplified." aside={<div className="button-row"><a href={openApiUrl} target="_blank" rel="noreferrer">Signal protocol ↗</a><Button variant="secondary" disabled={loading} onClick={onRefresh}>{loading ? "Syncing…" : "Sync signals"}</Button></div>} />
      <MetricGrid density="compact" items={[{ label: "Stories in progress", value: pendingStories }, { label: "Open decisions", value: openItems, tone: openItems ? "warning" : "neutral" }, { label: "Active modules", value: `${activeModules}/${modules.length}` }, { label: "Network status", value: health.toUpperCase(), tone: health === "ok" ? "success" : health === "degraded" ? "warning" : "neutral" }, { label: "Publishing tools", value: continuumStatus.toUpperCase() }]} />
    </section>
    <section className="shadow-dashboard-grid" aria-label="SHADOW creative command center">
      <Panel manga as="section" className="shadow-workbench"><header className="shadow-workbench-head"><div><span className="shadow-index">01 / STORY STUDIO</span><h2>Write. Curate. Amplify.</h2></div><div className="shadow-live"><i/> {continuumStatus.toUpperCase()}</div></header><div className="shadow-workbench-body"><nav className="shadow-studio-tabs" aria-label="Story Studio sections"><span>CONTENT</span><span>VISUALS</span><span>CHARACTERS</span><span>WORLD BUILDING</span><span>TAGS / SIGNALS</span><span>NOTES</span></nav><div className="shadow-story-canvas"><div className="shadow-canvas-art" role="img" aria-label="Moonwitness witness watching the city beneath a bright moon"/><div className="shadow-canvas-title"><span>FIELD STORY · 001</span><h3>THE ONES<br/>WHO <em>WATCH</em></h3><p>A small signal can change a larger sky.</p></div><span className="shadow-draft-stamp">DRAFT<br/>v0.3</span></div><aside className="shadow-assets"><div className="shadow-assets-head"><strong>ASSETS</strong><button className="text-button" onClick={() => onNavigate("knowledge")}>SEE ALL ↗</button></div><div className="shadow-assets-grid" aria-label="Moonwitness visual library">{Array.from({length:9},(_,index)=><span key={index} className={`shadow-asset-thumb shadow-asset-thumb--${index+1}`} aria-hidden="true"/>)}</div><div className="shadow-story-info"><div className="shadow-assets-head"><strong>STORY INFO</strong><span>EDIT →</span></div><dl><dt>Title</dt><dd>The Ones Who Watch</dd><dt>Type</dt><dd>Story / Chapter</dd><dt>Status</dt><dd><i/> In progress</dd><dt>Linked mission</dt><dd>MW-01 · The Next Signal</dd></dl></div></aside></div><footer className="shadow-workbench-foot"><span>{activeModules} active tools · {capabilities.length} signals connected</span>{studio&&<button className="shadow-link" onClick={()=>onNavigate(studio.key)}>OPEN STORY STUDIO ↗</button>}</footer></Panel>
      <Panel manga as="section" className="shadow-workflow"><header className="shadow-panel-head"><div><span className="shadow-index">02 / THE SIGNAL PATH</span><h2>Publishing Workflow</h2></div><span className="shadow-panel-state">{pendingStories} IN PROGRESS</span></header><ol className="shadow-publish-flow"><li className="is-done"><i>✓</i><span>Draft<br/>complete</span></li><li className="is-done"><i>✓</i><span>Team<br/>review</span></li><li className="is-active"><i>▧</i><span>Visuals<br/>ready</span></li><li><i>◷</i><span>Schedule</span></li><li><i>➤</i><span>Publish</span></li></ol><div className="shadow-flow-current"><small>CURRENT STEP</small><strong>Prepare story visuals and poster variants.</strong><span>{openItems} OPEN DECISIONS</span></div><div className="shadow-poster-preview"><span>03 / POSTER FORGE</span><strong>MAKE<br/>THE SIGNAL<br/>VISIBLE.</strong><button onClick={()=>studio&&onNavigate(studio.key)}>CREATE A POSTER ↗</button></div></Panel>
    </section>
    <section className="shadow-dashboard-lower" aria-label="Live operations">
      <Panel manga as="section" className="shadow-timeline"><header className="shadow-panel-head"><div><span className="shadow-index">04 / SIGNAL HISTORY</span><h2>Timeline</h2></div><span className="shadow-panel-state">LIVE</span></header><ol><li><i/><span><strong>Stories enter the archive</strong><small>Signals collected from across the network</small></span><b>01</b></li><li><i/><span><strong>Voices move through review</strong><small>People, places, stories — always connect</small></span><b>02</b></li><li><i/><span><strong>A brighter world takes shape</strong><small>Curiosity becomes a shared horizon</small></span><b>03</b></li></ol></Panel>
      <Panel manga as="section" className="shadow-signal-map"><header className="shadow-panel-head"><div><span className="shadow-index">05 / SIGNAL MAP</span><h2>Different places. Same sky.</h2></div><span className="shadow-panel-state">{readiness.toUpperCase()}</span></header><div className="shadow-map-art" role="img" aria-label="Signal connections across a world map"/><div className="shadow-map-foot"><span>NETWORK PULSE</span><strong>{capabilities.length} ACTIVE SIGNALS</strong><span>{checkedAt?new Date(checkedAt).toLocaleTimeString():"LISTENING"}</span></div></Panel>
      <Panel manga as="section" className="shadow-crew-panel"><header className="shadow-panel-head"><div><span className="shadow-index">06 / PEOPLE POWER THE MAP</span><h2>Crew Registry</h2></div>{crew&&<button className="text-button" onClick={()=>onNavigate(crew.key)}>MEET THE CREW ↗</button>}</header><p className="shadow-copy">A global crew of curious humans. Different places. Different perspectives. Same moon.</p><div className="shadow-crew-thumbs" aria-hidden="true"><span/><span/><span/></div><div className="shadow-list-foot"><span>CREW DIRECTORY</span><Badge tone={crew?"success":"neutral"}>{crew?"CONNECTED":"ACCESS NEEDED"}</Badge></div></Panel>
    </section>
    <section className="shadow-ops-grid">
      <Panel manga as="section" className="shadow-list-panel"><SectionHeading layout="compact" eyebrow="IN THE PIPELINE" title="Mission Queue" aside={submissions && <button className="text-button" onClick={() => onNavigate(submissions.key)}>View queue ↗</button>} /><div className="shadow-queue-row"><span className="shadow-queue-number">{String(pendingStories).padStart(2,"0")}</span><span><strong>Stories awaiting a signal</strong><small>Submission Queue · {submissions ? "live" : "access needed"}</small></span><span className="shadow-queue-arrow">↗</span></div><div className="shadow-queue-row"><span className="shadow-queue-number">{String(openItems).padStart(2,"0")}</span><span><strong>Decisions in the field</strong><small>Advisory Board · {summary ? "live" : "access needed"}</small></span><span className="shadow-queue-arrow">↗</span></div><div className="shadow-list-foot"><span>ACTIVE MODULES</span><strong>{activeModules} / {modules.length}</strong></div></Panel>
      <Panel manga as="section" className="shadow-list-panel shadow-alerts"><SectionHeading layout="compact" eyebrow="JUST CAME THROUGH" title="Recent Alerts" aside={<button className="text-button" onClick={() => onNavigate("audit")}>All signals ↗</button>} /><EventList className="event-list" events={events.slice(0,4)} empty={<EmptyState title="No recent signals" description="New field notes and activity will land here." />} /></Panel>
    </section>
    <section className="activity-preview"><SectionHeading layout="compact" eyebrow="THE WHOLE MAP" title="Go where the story leads" aside={<span className="muted">{operatorRole} access · {activeModules} active modules</span>} /><div className="workspace-grid">{workspaces.map((workspace) => { const WorkspaceIcon = workspace.icon; return <MangaEffect as="button" type="button" key={workspace.key} interactive className="workspace-card" onClick={() => onNavigate(workspace.key)}><span className="workspace-icon"><WorkspaceIcon size={18} /></span><strong>{workspace.title}</strong><small>{workspace.description}</small><span className="workspace-arrow">Open workspace <ArrowUpRightIcon size={12} /></span></MangaEffect>; })}</div>{modules.length > 0 ? <div className="module-list">{modules.map((module) => <Panel manga as="article" key={module.id}><div><strong>{module.title}</strong><small>{module.id} · {module.version}</small></div><Badge tone={module.enabled ? "success" : "neutral"}>{module.enabled ? "LIVE" : "DORMANT"}</Badge></Panel>)}</div> : loading ? <LoadingState label="Listening for active modules…" /> : error ? <ErrorState role="region" title="Signal registry unavailable" description="Sync the network and try again." action={<Button variant="secondary" onClick={onRefresh}>Try again</Button>} /> : <EmptyState title={searching ? "No signals match" : "The map is still unfolding"} description={searching ? "Try another search." : "Active modules will appear here when connected."} />}</section>
  </>;
}
