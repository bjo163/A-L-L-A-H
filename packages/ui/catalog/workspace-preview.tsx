import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge, BrandLockup, Breadcrumbs, Button, Icon, MangaPageIntro, MetricGrid, NavItem, Panel, SectionHeading, WorkspaceShell } from "../src";
import "../src/ui.css";
import "../src/command-center.css";
import "./workspace-preview.css";

function WorkspacePreview() {
  const [active, setActive] = useState("Overview");
  const pages = ["Overview", "Continuum", "Directory", "Audit", "Research"];
  return <WorkspaceShell
    mainId="workspace-preview-main"
    skipLabel="Skip to workspace content"
    menuLabel="Open workspace navigation"
    closeLabel="Close workspace navigation"
    navigation={<aside className="sidebar">
      <a className="brand" href="#workspace-preview-main"><BrandLockup name="A-L-L-A-H" descriptor="COMMAND CENTER" /></a>
      <div className="operator-card"><span className="avatar">A</span><span className="operator-meta"><strong>Example operator</strong><small>Administrator · fixture</small></span></div>
      <p className="nav-caption">OPERATIONS</p>
      <nav className="view-switcher" aria-label="Workspace fixture pages">
        {pages.map((page, index) => <NavItem key={page} className="nav-item" current={active === page} icon={<Icon name={(["home", "agent", "users", "audit", "evidence"] as const)[index]} size={18} />} onClick={() => setActive(page)}>{page}</NavItem>)}
      </nav>
      <div className="sidebar-bottom"><div className="connection-card"><span className="online-dot" data-state="ok" aria-hidden="true"/><span><strong>Fixture cluster</strong><small>Static local preview</small></span><Badge tone="success">Ready</Badge></div></div>
    </aside>}
    header={<header className="topbar"><Breadcrumbs className="breadcrumb" label="Workspace location" items={[{ label: "COMMAND CENTER" }, { label: active, current: true }]} /><Button variant="secondary" size="sm"><Icon name="refresh" size={14}/>Sync fixture</Button></header>}
  >
    <MangaPageIntro className="page-heading" eyebrow="WORKSPACE SHELL FIXTURE" title={active} description="Navigation, skip link, responsive shell, header and main landmark are shared by the package." />
    <SectionHeading layout="compact" title={`${active} overview`} aside={<Badge tone="info">Static fixture</Badge>} />
    <MetricGrid columns={3} density="compact" items={[{ label: "Navigation", value: "Shared" }, { label: "Content", value: "App slot" }, { label: "Permissions", value: "Consumer" }]} />
    <Panel className="workspace-preview-note"><p>Resize the catalog viewport and use the navigation toggle. On small screens, select a page to focus its new heading, or press Escape to close navigation and return focus to the toggle.</p></Panel>
  </WorkspaceShell>;
}

const root = document.getElementById("workspace-preview-root");
if (!root) throw new Error("Missing workspace preview root");
createRoot(root).render(<WorkspacePreview />);
