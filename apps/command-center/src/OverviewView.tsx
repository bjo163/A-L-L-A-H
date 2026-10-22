import type { CabSummary } from "@empire/api-contract";
import { Badge, Button, EmptyState, ErrorState, EventList, Icon, LoadingState, MangaEffect, MangaTelemetryHero, MetricGrid, Panel, SectionHeading, StatusIndicator } from "@empire/ui";
import type { IconName } from "@empire/ui";

type Signal = "checking" | "ok" | "degraded" | "unavailable";
type OverviewModule = { id: string; title: string; version: string; state: string; enabled: boolean };
type OverviewEvent = { id: string; timestamp: string; actor: string; action: string; details: string };
type Workspace = { key: string; title: string; description: string; icon: IconName };

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
  return <>
    <MangaTelemetryHero
      eyebrow={<>SYSTEM PULSE <StatusIndicator tone={readiness === "ok" ? "success" : readiness === "unavailable" ? "neutral" : "warning"}>{readiness.toUpperCase()}</StatusIndicator></>}
      title={readiness === "ok" ? "All local systems are responding" : "System needs attention"}
      description="API gateway, PostgreSQL readiness, governance and research are refreshed every 30 seconds."
      metadata={<><span><Icon name="clock" size={13} /> {checkedAt ? new Date(checkedAt).toLocaleString() : "Awaiting first sync"}</span><span><Icon name="command" size={13} /> {capabilities.length} active capabilities</span><span><Icon name="arrows" size={13} /> {continuumStatus} continuum</span></>}
      pulse="100"
      sfx={readiness === "ok" ? "PULSE!" : "ALERT!"}
    />
    <section id="overview"><SectionHeading layout="compact" title="API Boundary" aside={<div className="button-row"><a href={openApiUrl} target="_blank" rel="noreferrer">Kontrak OpenAPI</a><Button variant="secondary" disabled={loading} onClick={onRefresh}>{loading ? "Memeriksa…" : "Refresh status"}</Button></div>} />
      <MetricGrid density="compact" items={[{ label: "Process health", value: health, tone: health === "ok" ? "success" : health === "degraded" ? "warning" : "neutral" }, { label: "Database readiness", value: readiness, tone: readiness === "ok" ? "success" : readiness === "degraded" ? "warning" : "neutral" }, { label: "Login", value: "Authenticated", tone: "success" }]} />
      {summary && <MetricGrid density="compact" className="overview-secondary-metrics" items={[{ label: "CAB open", value: summary.active }, { label: "High risk", value: summary.emergency, tone: summary.emergency > 0 ? "warning" : "neutral" }, { label: "Research runs", value: researchRunCount }]} />}
    </section>
    <section id="modules"><SectionHeading layout="compact" title="Module Registry" aside={<span>FIRST-PARTY · READ ONLY</span>} />
      {modules.length > 0 ? <div className="module-list">{modules.map((module) => <Panel manga as="article" key={module.id}><div><strong>{module.title}</strong><small>{module.id} · {module.version}</small></div><Badge tone={module.enabled ? "success" : "neutral"}>{module.enabled ? "BOOTSTRAP" : "SCAFFOLD"}</Badge></Panel>)}</div>
        : loading ? <LoadingState label="Memuat modul…" /> : error ? <ErrorState role="region" title="Registry modul tidak tersedia" description="Muat ulang registry untuk mencoba kembali." action={<Button variant="secondary" onClick={onRefresh}>Coba lagi</Button>} /> : <EmptyState title={searching ? "No modules match" : "Belum ada modul"} description={searching ? "Try a different search term." : "Registry berhasil dimuat, tetapi belum memiliki modul untuk ditampilkan."} />}
      <p className="muted">Kapabilitas: {capabilities.length ? capabilities.join(" · ") : "Tidak ada kapabilitas aktif."}</p>
    </section>
    <section className="workspace-section"><SectionHeading layout="compact" eyebrow="WORKSPACES" title="Go to operations" aside={<span className="muted">{operatorRole} access</span>} /><div className="workspace-grid">{workspaces.map((workspace) => <MangaEffect as="button" type="button" key={workspace.key} interactive className="workspace-card" onClick={() => onNavigate(workspace.key)}><span className="workspace-icon"><Icon name={workspace.icon} size={18} /></span><strong>{workspace.title}</strong><small>{workspace.description}</small><span className="workspace-arrow">Open workspace <Icon name="arrowUpRight" size={12} /></span></MangaEffect>)}</div></section>
    <section className="activity-preview"><SectionHeading layout="compact" eyebrow="RECENT ACTIVITY" title="Latest events" aside={<button className="text-button" onClick={() => onNavigate("audit")}>Open ledger <Icon name="arrowUpRight" size={12} /></button>} />
      <EventList className="event-list" events={events} empty={<EmptyState title="No recent events" description="Audit events will appear here as operators use the system." />} />
    </section>
  </>;
}
