import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { API_PATHS, ApiError, createApiClient } from "@empire/api-contract";
import type { AuthEntity, CabRfc, CabSummary, LoginResponse, ResearchRun } from "@empire/api-contract";
import type { WorldMonitoringSnapshot } from "@empire/batteries-world-monitor";
import { notifyNewWorldMonitorAlerts } from "./world-monitor-notifications";
import { AuthLayout, Badge, Breadcrumbs, BrandLockup, Button, Checkbox, ConfirmDialog, DecisionSummary, EmptyState, ErrorState, EventList, FieldLabel, Icon, LoadingState, MangaEffect, MangaPageIntro, MangaTelemetryHero, MetricGrid, NavItem, Notice, Pagination, Panel, ReviewActions, FormSection, SearchField, SelectField, SkipLink, StatusIndicator, TextArea, TextField } from "@empire/ui";
import type { ConfirmDialogTone, IconName } from "@empire/ui";
import { WorldMonitorView } from "./WorldMonitorView";
import type { ResearchConfirmationRequest } from "./ResearchCard";
import { DirectoryView, type DirectoryUser } from "./DirectoryView";
import { ContinuumView, type ContinuumAgent } from "./ContinuumView";
import { KnowledgeView, type KnowledgeEntry } from "./KnowledgeView";
import { AuditView, type AuditEvent } from "./AuditView";
import { ResearchView, type ResearchDraft } from "./ResearchView";
import { CabView, type CabActionRequest, type CabDraft } from "./CabView";
import { OverviewView } from "./OverviewView";

type Signal = "checking" | "ok" | "degraded" | "unavailable";
type Module = { id: string; title: string; version: string; state: string; enabled: boolean };
type Snapshot = { health: Signal; readiness: Signal; modules: Module[]; capabilities: string[]; checkedAt?: string };
type Page = "overview" | "world" | "continuum" | "directory" | "knowledge" | "audit" | "cab" | "research";
const pageIcons: Record<Page, IconName> = { overview: "home", world: "globe", continuum: "agent", directory: "users", knowledge: "knowledge", audit: "audit", cab: "approval", research: "evidence" };
type Chronicle = { id: string; action: string; entity: string; entityId?: string | null; payload?: Record<string, unknown> | null; createdAt: string; user?: { username?: string; displayName?: string } | null };
type ConfirmationRequest = ResearchConfirmationRequest;

const api = createApiClient(import.meta.env.VITE_API_ORIGIN || "http://127.0.0.1:4000");
const initialSnapshot: Snapshot = { health: "checking", readiness: "checking", modules: [], capabilities: [] };
const initialRfc: CabDraft = { title: "", tier: "standard", riskLevel: "moderate", summary: "", justification: "", executionPlan: "", rollbackPlan: "", targetService: "", scheduledWindowStart: "", scheduledWindowEnd: "" };
const initialRun: ResearchDraft = { title: "", question: "", scope: "self" };
const can = (entity: AuthEntity | null, permission: string) => Boolean(entity?.sovereign || entity?.permissions.includes("*") || entity?.permissions.includes(permission));
const pageItems: Array<{ key: Page; label: string; title: string; workspaceTitle: string; description: string }> = [
  { key: "overview", label: "Overview", title: "Command overview", workspaceTitle: "Overview", description: "A live view of system health, governance queues, and operator activity." },
  { key: "world", label: "World monitor", title: "System & regional monitoring", workspaceTitle: "World monitor", description: "API and database health, with unavailable state shown for sources that are not connected." },
  { key: "continuum", label: "Continuum", title: "Continuum control", workspaceTitle: "Continuum", description: "Inspect the agent registry and record a controlled invocation." },
  { key: "directory", label: "Directory", title: "Entity directory", workspaceTitle: "Entity directory", description: "Browse provisioned operators and service agents with server-provided roles." },
  { key: "knowledge", label: "Knowledge", title: "Knowledge index", workspaceTitle: "Knowledge index", description: "Search the 99 Asma mappings with their editorial state and source notes." },
  { key: "audit", label: "Audit ledger", title: "Audit ledger", workspaceTitle: "Audit ledger", description: "Review recent actions recorded by the API, with searchable event history." },
  { key: "cab", label: "Governance · CAB", title: "Change advisory board", workspaceTitle: "Governance board", description: "Review change proposals, policy checks, approvals, execution, and rollback." },
  { key: "research", label: "Research", title: "Research operations", workspaceTitle: "Research operations", description: "Manage approval, evidence, workflow, and completion for research runs." },
];

export function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("empire.session") ?? "");
  const [cookieSession, setCookieSession] = useState(false);
  const [restoringSession, setRestoringSession] = useState(() => !sessionStorage.getItem("empire.session"));
  const [entity, setEntity] = useState<AuthEntity | null>(() => {
    try { return JSON.parse(sessionStorage.getItem("empire.entity") ?? "null") as AuthEntity | null; } catch { return null; }
  });
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [worldSnapshot, setWorldSnapshot] = useState<WorldMonitoringSnapshot | null>(null);
  const [worldLoading, setWorldLoading] = useState(false);
  const [worldError, setWorldError] = useState("");
  const [worldNextRefreshIn, setWorldNextRefreshIn] = useState(30);
  const worldRequestRef = useRef(0);
  const worldInFlightRef = useRef(false);
  const [tab, setTab] = useState<Page>("overview");
  const [summary, setSummary] = useState<CabSummary | null>(null);
  const [rfcs, setRfcs] = useState<CabRfc[]>([]);
  const [selected, setSelected] = useState<CabRfc | null>(null);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [continuum, setContinuum] = useState<Record<string, unknown> | null>(null);
  const [agents, setAgents] = useState<ContinuumAgent[]>([]);
  const [lexicon, setLexicon] = useState<KnowledgeEntry[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [search, setSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [directive, setDirective] = useState("Review current system status and report findings.");
  const [createRfc, setCreateRfc] = useState<CabDraft>(initialRfc);
  const [createRun, setCreateRun] = useState<ResearchDraft>(initialRun);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [worldNotificationPermission, setWorldNotificationPermission] = useState<NotificationPermission | "unsupported">(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const client = useMemo(() => ({ request: <T,>(path: string, options: { method?: "GET"|"POST"|"PATCH"; body?: unknown } = {}) => api.request<T>(path, { ...options, token: token || null }) }), [token]);

  async function refreshWorld() {
    if (worldInFlightRef.current) return;
    worldInFlightRef.current = true;
    const requestId = ++worldRequestRef.current;
    setWorldLoading(true);
    setWorldNextRefreshIn(30);
    try {
      const nextSnapshot = await api.request<WorldMonitoringSnapshot>(API_PATHS.worldMonitor);
      if (worldRequestRef.current === requestId) {
        if (worldSnapshot && typeof Notification !== "undefined") notifyNewWorldMonitorAlerts(worldSnapshot.alerts, nextSnapshot.alerts, Notification.permission, (title, body) => { new Notification(title, { body }); });
        setWorldSnapshot(nextSnapshot);
        setWorldError("");
      }
    } catch (cause) {
      if (worldRequestRef.current === requestId) {
        setWorldError(cause instanceof Error ? cause.message : "World Monitor could not be refreshed.");
      }
    } finally {
      if (worldRequestRef.current === requestId) {
        worldInFlightRef.current = false;
        setWorldLoading(false);
      }
    }
  }

  async function enableWorldMonitorNotifications() {
    if (typeof Notification === "undefined") { setWorldNotificationPermission("unsupported"); return; }
    setWorldNotificationPermission(await Notification.requestPermission());
  }

  function clearSession() {
    sessionStorage.removeItem("empire.session"); sessionStorage.removeItem("empire.entity");
    setToken(""); setCookieSession(false); setEntity(null); setSummary(null); setRfcs([]); setSelected(null); setRuns([]);
    setContinuum(null); setAgents([]); setLexicon([]); setChronicles([]); setDirectory([]);
  }

  async function refresh() {
    setLoading(true); setError(""); setSuccess("");
    try {
      const [health, readiness, modules, capabilities] = await Promise.all([
        api.request<Record<string, unknown>>(API_PATHS.health),
        api.request<Record<string, unknown>>(API_PATHS.readiness),
        api.request<{ items: Module[] }>(API_PATHS.modules),
        api.request<{ capabilities: string[] }>(API_PATHS.capabilities),
      ]);
      const signal = (value: unknown): Signal => value === "ok" ? "ok" : value === "degraded" ? "degraded" : "unavailable";
      setSnapshot({ health: signal(health.status), readiness: signal(readiness.status), modules: modules.items ?? [], capabilities: capabilities.capabilities ?? [], checkedAt: new Date().toISOString() });
      if (token || cookieSession) {
        const session = await client.request<{ entity: AuthEntity }>(API_PATHS.session);
        setEntity(session.entity);
        if (token) sessionStorage.setItem("empire.entity", JSON.stringify(session.entity));
        if (!can(session.entity, "cab:read")) { setSummary(null); setRfcs([]); setSelected(null); }
        if (!can(session.entity, "research:read")) setRuns([]);
        if (!can(session.entity, "continuum:read")) { setContinuum(null); setAgents([]); setLexicon([]); setChronicles([]); }
        if (!can(session.entity, "users:manage")) setDirectory([]);
        if (can(session.entity, "cab:read")) {
          const [cabSummary, cabList] = await Promise.all([client.request<CabSummary>(API_PATHS.cabSummary), client.request<{ items: CabRfc[] }>(API_PATHS.cabRfcs)]);
          setSummary(cabSummary); setRfcs(cabList.items ?? []);
          if (selected) setSelected(await client.request<CabRfc>(`${API_PATHS.cabRfcs}/${selected.id}`));
        }
        if (can(session.entity, "research:read")) {
          const research = await client.request<{ data?: ResearchRun[]; items?: ResearchRun[] }>(API_PATHS.researchRuns);
          setRuns(research.items ?? research.data ?? []);
        }
        if (can(session.entity, "continuum:read")) {
          const results = await Promise.allSettled([
            client.request<Record<string, unknown>>(API_PATHS.continuum),
            client.request<{ agents: ContinuumAgent[] }>(API_PATHS.continuumAgents),
            client.request<{ lexicons: KnowledgeEntry[] }>(API_PATHS.continuumAsma),
            client.request<{ data: Chronicle[]; meta: { page: number; total: number; totalPages: number } }>(`${API_PATHS.continuumChronicles}?page=${auditPage}&limit=25`),
          ]);
          if (results[0].status === "fulfilled") setContinuum(results[0].value);
          if (results[1].status === "fulfilled") setAgents(results[1].value.agents ?? []);
          if (results[2].status === "fulfilled") setLexicon(results[2].value.lexicons ?? []);
          if (results[3].status === "fulfilled") setChronicles(results[3].value.data ?? []);
        }
        if (can(session.entity, "users:manage")) {
          const users = await client.request<{ data: DirectoryUser[] }>(`${API_PATHS.users}?page=1&limit=100`);
          setDirectory(users.data ?? []);
        }
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401 && (token || cookieSession)) clearSession();
      setError(cause instanceof Error ? cause.message : "Gagal membaca status API.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, [token, cookieSession, auditPage]);
  useEffect(() => {
    if (token) { setRestoringSession(false); return; }
    let active = true;
    api.request<{ entity: AuthEntity }>(API_PATHS.session)
      .then((session) => {
        if (!active) return;
        setEntity(session.entity);
        setCookieSession(true);
      })
      .catch((cause) => {
        if (active && !(cause instanceof ApiError && cause.status === 401))
          setError(cause instanceof Error ? cause.message : "Sesi tersimpan tidak bisa diperiksa.");
      })
      .finally(() => { if (active) setRestoringSession(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!token && !cookieSession) return;
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [token, cookieSession, auditPage]);

  // World monitor: fetch immediately on mount, then auto-refresh every 30s with countdown
  useEffect(() => {
    void refreshWorld();
    const autoTimer = window.setInterval(() => void refreshWorld(), 30000);
    const countdownTimer = window.setInterval(() => {
      setWorldNextRefreshIn((s) => (s <= 1 ? 30 : s - 1));
    }, 1000);
    return () => {
      window.clearInterval(autoTimer);
      window.clearInterval(countdownTimer);
      worldRequestRef.current += 1;
      worldInFlightRef.current = false;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault(); document.getElementById("global-search")?.focus();
      }
      if (event.key === "Escape") setSearch("");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function perform(action: () => Promise<unknown>, successMessage: string, onSuccess?: () => void) {
    setBusy(true); setError(""); setSuccess("");
    try { await action(); await refresh(); onSuccess?.(); setSuccess(successMessage); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Aksi gagal."); }
    finally { setBusy(false); }
  }

  function confirmRfcAction(title: string, detail: string, confirmLabel: string, tone: ConfirmDialogTone, endpoint: string, body: unknown, successMessage: string) {
    if (!selected) return;
    setError(""); setSuccess("");
    const rfc = selected;
    setConfirmation({
      title,
      description: `${rfc.code} · ${rfc.title}\n${detail}\nRencana rollback: ${rfc.rollbackPlan}`,
      confirmLabel,
      tone,
      successMessage,
      action: () => client.request(`${API_PATHS.cabRfcs}/${rfc.id}${endpoint}`, { method: "POST", body }),
    });
  }

  function requestConfirmation(request: ConfirmationRequest) {
    setError(""); setSuccess("");
    setConfirmation(request);
  }

  function confirmPendingAction() {
    if (!confirmation) return;
    const pending = confirmation;
    void perform(pending.action, pending.successMessage, () => setConfirmation(null));
  }

  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const result = await api.request<LoginResponse>(API_PATHS.login, { method: "POST", body: { ...login, rememberMe } });
      if (!rememberMe && !result.token) throw new Error("API tidak mengembalikan token sesi.");
      if (rememberMe) {
        sessionStorage.removeItem("empire.session"); sessionStorage.removeItem("empire.entity");
      } else {
        sessionStorage.setItem("empire.session", result.token!); sessionStorage.setItem("empire.entity", JSON.stringify(result.entity));
      }
      setToken(rememberMe ? "" : result.token!); setCookieSession(rememberMe); setEntity(result.entity); setLogin({ username: "", password: "" }); setRememberMe(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Login gagal."); }
    finally { setBusy(false); }
  }

  async function openRfc(id: string) {
    try { setSelected(await client.request<CabRfc>(`${API_PATHS.cabRfcs}/${id}`)); setError(""); setSuccess(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "RFC tidak bisa dibuka."); }
  }

  async function createChange(event: React.FormEvent) {
    event.preventDefault();
    const body = { ...createRfc, scheduledWindowStart: createRfc.scheduledWindowStart ? new Date(createRfc.scheduledWindowStart).toISOString() : null, scheduledWindowEnd: createRfc.scheduledWindowEnd ? new Date(createRfc.scheduledWindowEnd).toISOString() : null };
    await perform(async () => { await client.request(API_PATHS.cabRfcs, { method: "POST", body }); setCreateRfc(initialRfc); }, "RFC dibuat dan masuk musyawarah.");
  }

  async function createResearch(event: React.FormEvent) {
    event.preventDefault();
    await perform(async () => { await client.request(API_PATHS.researchRuns, { method: "POST", body: createRun }); setCreateRun(initialRun); }, "Research run dikirim untuk persetujuan.");
  }

  if (!entity && restoringSession) return <AuthLayout brandName="A-L-L-A-H" brandDescriptor="COMMAND CENTER · OPERATOR" title="Memulihkan sesi" description="Memeriksa sesi operator yang tersimpan." />;
  if (!entity) return <AuthLayout brandName="A-L-L-A-H" brandDescriptor="COMMAND CENTER · OPERATOR" title="Masuk Command Center" description="Gunakan akun operator lokal yang telah diprovisikan oleh administrator.">
    {error && <Notice tone="danger">{error}</Notice>}
    <form className="form-grid" onSubmit={signIn}><FieldLabel>Username<TextField autoComplete="username" value={login.username} onChange={e=>setLogin({...login,username:e.target.value})} required/></FieldLabel><FieldLabel>Password<TextField type="password" autoComplete="current-password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} required/></FieldLabel><Checkbox className="remember-me" label="Ingat saya di perangkat ini selama 30 hari" checked={rememberMe} onChange={event=>setRememberMe(event.target.checked)}/><Button type="submit" disabled={busy}>{busy?"Memeriksa…":"Masuk"}</Button></form>
    <div className="login-health"><span>API {snapshot.health}</span><span>Database {snapshot.readiness}</span><Button variant="secondary" disabled={loading} onClick={()=>void refresh()}>Refresh</Button></div>
  </AuthLayout>;

  const canCab = can(entity, "cab:read");
  const canResearch = can(entity, "research:read");
  const visibleAgents = agents.filter(item => `${item.term} ${item.code} ${item.role} ${item.tier}`.toLowerCase().includes(search.toLowerCase()));
  const visibleLexicon = lexicon.filter(item => `${item.code} ${item.arabic} ${item.translit} ${item.term} ${item.attribute} ${item.domain}`.toLowerCase().includes(search.toLowerCase()));
  const visibleChronicles = chronicles.filter(item => `${item.action} ${item.entity} ${item.user?.username} ${item.user?.displayName}`.toLowerCase().includes(search.toLowerCase()));
  const visibleUsers = directory.filter(item => `${item.username} ${item.displayName} ${item.email} ${item.tier} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const visibleModules = snapshot.modules.filter(item => `${item.id} ${item.title} ${item.version} ${item.state}`.toLowerCase().includes(search.toLowerCase()));
  const visibleRfcs = rfcs.filter(item => `${item.code} ${item.title} ${item.tier} ${item.riskLevel} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const visibleRuns = runs.filter(item => `${item.title} ${item.question} ${item.scope} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const pageAllowed = (key: Page) => key === "overview" || key === "world"
    || (key === "continuum" && can(entity, "continuum:read"))
    || (key === "directory" && can(entity, "users:manage"))
    || ((key === "knowledge" || key === "audit") && can(entity, "continuum:read"))
    || (key === "cab" && canCab)
    || (key === "research" && canResearch);
  const activePage = pageItems.find(({ key }) => key === tab)!;
  return <div className="shell"><SkipLink targetId="main-content">Skip to main content</SkipLink><aside className="sidebar"><a className="brand" href="#overview" onClick={e=>{e.preventDefault();setTab("overview");}}><BrandLockup name="A-L-L-A-H" descriptor="COMMAND CENTER" /></a>
    <div className="operator-card"><span className="avatar">{entity.displayName.slice(0,1).toUpperCase()}</span><span className="operator-meta"><strong>{entity.displayName}</strong><small>{entity.role} · {entity.username}</small></span><span className="online-dot" title="Sesi aktif"/></div>
    <p className="nav-caption">OPERATIONS</p><div className="view-switcher" role="navigation" aria-label="Command Center sections">{pageItems.filter(({key})=>pageAllowed(key)).map(({key,label})=><NavItem key={key} className={`nav-item ${tab===key?"is-active":""}`} current={tab===key} icon={<Icon name={pageIcons[key]} className="nav-icon" size={18}/>} badge={key==="cab"&&summary?.active?summary.active:key==="research"?runs.filter(run=>run.status==="pending_approval").length||undefined:undefined} onClick={()=>setTab(key)}>{label}</NavItem>)}</div>
    <div className="sidebar-bottom"><div className="connection-card"><span className="online-dot" data-state={snapshot.readiness} aria-hidden="true"/><span><strong>Local cluster</strong><small>PostgreSQL · API :4000</small></span><Badge tone={snapshot.readiness==="ok"?"success":snapshot.readiness==="unavailable"?"danger":"warning"}>{snapshot.readiness}</Badge></div><MangaEffect as="button" action type="button" className="logout-button" onClick={()=>void perform(async()=>{await client.request(API_PATHS.logout,{method:"POST"});clearSession();},"Sesi ditutup.")}><Icon name="logOut" size={16}/><span>Keluar dari sesi</span></MangaEffect><small className="build-label">A-L-L-A-H COMMAND CENTER · ARSY</small></div></aside>
    <main id="main-content" tabIndex={-1}><header className="topbar"><h1 className="eol-visually-hidden">{activePage.title}</h1><Breadcrumbs className="breadcrumb" label="Current location" items={[{label:"COMMAND CENTER"},{label:activePage.title,current:true}]}/><div className="top-actions"><SearchField className="global-search" id="global-search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search this view…" aria-label="Search current view" shortcutHint="/" onClear={()=>setSearch("")}/><span className="last-check">{snapshot.checkedAt?`Updated ${new Date(snapshot.checkedAt).toLocaleTimeString()}`:"Connecting…"}</span><Button variant="secondary" disabled={loading} onClick={()=>void refresh()}>{loading ? "Syncing…" : (<span><Icon name="refresh" size={14}/>Sync</span>)}</Button><a className="api-link" href={`${import.meta.env.VITE_API_ORIGIN||"http://127.0.0.1:4000"}${API_PATHS.openapi}`} target="_blank" rel="noreferrer" aria-label="Open API contract"><Icon name="document" size={16}/></a></div></header>
      <MangaPageIntro className="page-heading" eyebrow="A-L-L-A-H · OPERATIONAL COMMAND" title={<span id="active-view-heading">{activePage.title}</span>} description={activePage.description} actions={<div className="health-cluster"><span><i data-state={snapshot.health}/><span>API {snapshot.health}</span></span><span><i data-state={snapshot.readiness}/><span>DATABASE {snapshot.readiness}</span></span></div>} />
      {error&&<Notice tone="danger" className="notice">{error}</Notice>}{success&&<Notice tone="success" className="notice">{success}</Notice>}
      <div id="active-view" role="region" aria-labelledby="active-view-heading">
      {tab==="overview"&&<OverviewView
        health={snapshot.health}
        readiness={snapshot.readiness}
        checkedAt={snapshot.checkedAt}
        continuumStatus={String(continuum?.status ?? "pending")}
        capabilities={snapshot.capabilities}
        summary={summary}
        researchRunCount={runs.length}
        modules={visibleModules}
        workspaces={pageItems.filter(({key})=>key!=="overview"&&pageAllowed(key)).map(({key,workspaceTitle,description})=>({key,title:workspaceTitle,description,icon:pageIcons[key]}))}
        events={chronicles.slice(0,5).map(event=>({id:event.id,timestamp:new Date(event.createdAt).toLocaleString(),actor:event.user?.displayName??event.user?.username??"System",action:event.action.replaceAll("_"," "),details:event.entityId?`${event.entity} · ${event.entityId}`:event.entity}))}
        loading={loading}
        error={error}
        searching={Boolean(search)}
        operatorRole={entity.role}
        openApiUrl={`${import.meta.env.VITE_API_ORIGIN||"http://127.0.0.1:4000"}${API_PATHS.openapi}`}
        onRefresh={()=>void refresh()}
        onNavigate={key=>setTab(key as Page)}
      />}
      {tab==="world"&&(worldLoading&&!worldSnapshot?<LoadingState label="Memuat World Monitor…"/>:worldSnapshot?<WorldMonitorView snapshot={worldSnapshot} search={search} nextRefreshIn={worldNextRefreshIn} refreshError={worldError} onRefresh={()=>void refreshWorld()} notificationPermission={worldNotificationPermission} onEnableNotifications={()=>void enableWorldMonitorNotifications()}/>:worldError?<ErrorState title="World Monitor is unavailable" description={worldError} action={<Button variant="secondary" onClick={()=>void refreshWorld()}>Retry</Button>}/>:<LoadingState label="Connecting to World Monitor…"/>)}
      {tab==="continuum"&&<ContinuumView
        agentCount={agents.length}
        activeAgentCount={agents.filter(agent=>agent.status==="active").length}
        lexiconCount={lexicon.length}
        agents={visibleAgents}
        canInvoke={can(entity,"continuum:invoke")}
        directive={directive}
        busy={busy}
        onDirectiveChange={setDirective}
        onInvoke={agent=>void perform(()=>client.request(`${API_PATHS.continuumAgents}/${encodeURIComponent(agent.code)}/invoke`,{method:"POST",body:{directive}}),`${agent.term} invocation recorded.`)}
      />}
      {tab==="directory"&&<DirectoryView users={directory} visibleUsers={visibleUsers}/>}
      {tab==="knowledge"&&<><Notice role="note" className="notice-panel"><Icon name="info" size={16}/><p>Entries are project mappings in editorial review. They are not verified theological definitions. Preserve cited sources and editorial status when using them.</p></Notice><KnowledgeView entries={visibleLexicon}/></>}
      {tab==="audit"&&<AuditView page={auditPage} totalPages={auditPage + (chronicles.length>=25 ? 1 : 0)} onPageChange={setAuditPage} events={visibleChronicles.map((event): AuditEvent=>({id:event.id,timestamp:new Date(event.createdAt).toLocaleString(),actor:event.user?.displayName??event.user?.username??"System",action:<><strong>{event.action.replaceAll("_"," ")}</strong> <Badge tone="neutral">{event.entity}</Badge></>,details:event.payload?<pre>{JSON.stringify(event.payload,null,2)}</pre>:event.entityId?event.entityId:undefined}))}/>}
      {tab==="cab"&&<CabView
        summary={summary}
        visibleRfcs={visibleRfcs}
        selected={selected}
        draft={createRfc}
        busy={busy}
        loading={loading}
        error={error}
        searching={Boolean(search)}
        canWrite={can(entity,"cab:write")}
        canAudit={can(entity,"cab:audit")}
        canReview={can(entity,"cab:review")}
        canExecute={can(entity,"cab:execute")}
        sovereign={entity.isSovereignAntiBypass}
        onDraftChange={setCreateRfc}
        onCreate={createChange}
        onRefresh={()=>void refresh()}
        onSelectRfc={id=>void openRfc(id)}
        onAudit={()=>{if(selected)void perform(()=>client.request(`${API_PATHS.cabRfcs}/${selected.id}/audit`,{method:"POST",body:{}}),"Policy checks selesai dan tercatat.")}}
        onConfirmAction={request=>confirmRfcAction(request.title,request.description,request.confirmLabel,request.tone,request.endpoint,request.body,request.successMessage)}
      />}
      {tab==="research"&&<ResearchView draft={createRun} runs={visibleRuns} busy={busy} loading={loading} error={error} searching={Boolean(search)} canWrite={can(entity,"research:write")} canApprove={can(entity,"research:approve")} client={client} refreshKey={snapshot.checkedAt} onDraftChange={setCreateRun} onCreate={createResearch} onRefresh={()=>void refresh()} onAction={perform} onConfirmAction={requestConfirmation}/>}
      </div>
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "Konfirmasi tindakan"}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel ?? "Konfirmasi"}
        tone={confirmation?.tone}
        busy={busy}
        error={error}
        onConfirm={confirmPendingAction}
        onOpenChange={(open) => { if (!open && !busy) setConfirmation(null); }}
      />
      <footer>ONE VOCABULARY · HUMAN APPROVAL · EVERY JOURNEY MATTERS</footer>
    </main></div>;
}



