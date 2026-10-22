import type { ReactNode } from "react";
import {
  ActionGroup,
  Badge,
  BrandLockup,
  Button,
  CallToAction,
  DataTable,
  DecisionSummary,
  Disclosure,
  EntityCard,
  EventList,
  FilterBar,
  FormSection,
  IconText,
  ListDetail,
  MangaPageIntro,
  MapFrame,
  MapLegend,
  MetricGrid,
  Notice,
  Panel,
  Pagination,
  PortalDomainCard,
  PublicShell,
  ReadinessList,
  RegionSummary,
  RegionSelectCard,
  SensorDisclosure,
  ReviewActions,
  StatusIndicator,
  TelemetryEventList,
  TextField,
  Timeline,
  WorkflowSteps,
  buttonClassName,
  ArrowDownRightIcon,
} from "../src";

export function PortalHomeFixture() {
  return <PublicShell
    className="catalog-page-fixture"
    brand={<BrandLockup name="A-L-L-A-H" descriptor="PUBLIC PORTAL · STATIC FIXTURE"/>}
    navigation={<nav className="desktop-nav" aria-label="Portal fixture navigation"><a href="#portal-domains">Domains</a><a href="#portal-process">Process</a><a href="#portal-actions">Next steps</a></nav>}
    action={<a className={buttonClassName("primary", "btn")} href="#portal-actions">Explore</a>}
    skipLabel="Skip to Portal fixture"
    footerBrand={<BrandLockup size="compact" name="A-L-L-A-H" descriptor="PORTAL FIXTURE"/>}
    footerContent={<><a href="#portal-domains">Domains</a><a href="#portal-actions">Next steps</a></>}
  >
    <>
      <MangaPageIntro
        className="page-hero"
        eyebrowClassName="eyebrow"
        eyebrow="EMPIRE OF THE LIGHT · GENESIS 05"
        title={<>LIVE.<br/><em>LEARN. ACT.</em></>}
        description="A fabricated public portal page assembled from shared shell, intro, card, process, and CTA patterns."
        sfx="ZAP!"
        actions={<nav className="page-hero-links" aria-label="Fixture actions"><a href="#portal-domains"><IconText icon={<ArrowDownRightIcon />}>Explore domains</IconText></a><a href="#portal-actions">See readiness</a></nav>}
      />
      <section className="section" id="portal-domains">
        <div className="eol-container">
          <h2>Every system has a <em>role.</em></h2>
          <div className="frontier-grid">
            <PortalDomainCard id="portal-fixture-arsy" index="01" accent="mint" symbol="arsy" status="DESIGN" statusTone="info" descriptor="AGENCY & ORCHESTRATION" title="ARSY" summary="Agents, tools, sources, and accountable workflows." action={<a className="card-link" href="#portal-process">Read the fixture</a>}/>
            <PortalDomainCard id="portal-fixture-ziil" index="02" accent="gold" symbol="ziil" status="FOUNDATION" statusTone="success" descriptor="RIGHTS & SAFETY" title="ZIIL" summary="People retain authority, privacy, review, and appeal." action={<a className="card-link" href="#portal-process">Read the fixture</a>}/>
          </div>
        </div>
      </section>
      <section className="section section-alt" id="portal-process">
        <div className="eol-container">
          <h2>Evidence before <em>action.</em></h2>
          <WorkflowSteps label="Fabricated Portal workflow" items={[{ id: "source", number: "01", title: "Source", description: "Record provenance and context." }, { id: "review", number: "02", title: "Review", description: "People examine evidence." }, { id: "decision", number: "03", title: "Decision", description: "Authorized people decide." }]}/>
        </div>
      </section>
      <div id="portal-actions"><CallToAction eyebrow="PORTAL PAGE FIXTURE" title={<>Think <em>further.</em><br/>Act <span>with evidence.</span></>} description="All copy and destinations in this catalog page are fabricated." actions={<a className={buttonClassName("primary", "btn")} href="#portal-domains">Return to domains</a>}/></div>
    </>
  </PublicShell>;
}

function ViewFixture({ title, children }: { title: string; children: ReactNode }) {
  return <Panel as="article" className="catalog-view-fixture"><h3>{title}</h3>{children}</Panel>;
}

export function OperationalCategoryFixtures() {
  return <div className="catalog-operations-fixtures">
    <ViewFixture title="01 · Overview">
      <MetricGrid density="compact" items={[{ label: "Services", value: "06", tone: "success" }, { label: "Open reviews", value: "03", tone: "warning" }]}/>
      <EventList events={[{ id: "overview-event", timestamp: "2026-10-22T10:00:00Z", actor: "Fixture operator", action: "Reviewed a sample event", details: "Static overview activity; no API call." }]}/>
    </ViewFixture>
    <ViewFixture title="02 · World monitor">
      <MapFrame title="Regional status" state="unavailable" description="Map provider is represented by a fabricated unavailable state." canvas={<div className="catalog-map-stage" aria-hidden="true"/>}>
        <MapLegend items={[{ status: "nominal", label: "Nominal" }, { status: "advisory", label: "Advisory" }, { status: "alert", label: "Alert" }]}/>
      </MapFrame>
      <RegionSummary eyebrow="FIXTURE · -6.20°, 106.80°" name="Jakarta sample region" status="Nominal" tone="success" metrics={[{ label: "Sensors", value: 12 }, { label: "Uptime", value: "99.9%" }]}/>
      <RegionSelectCard name="Jakarta fixture" code="JKT" coordinates="-6.20°, 106.80°" status="NOMINAL" tone="success" metrics={[{ label: "Latency", value: "24 ms" }, { label: "Nodes", value: 8 }, { label: "Uptime", value: "99.9%" }, { label: "Grid Load", value: "Unavailable" }]} onSelect={() => undefined}/>
      <SensorDisclosure name="Grid health fixture" identity="DNA-014 · infrastructure health" symbol={<span lang="ar" dir="rtl">ن</span>} status="HEALTHY" tone="success"><p>Fabricated monitoring purpose and limitation notes for the shared sensor disclosure.</p></SensorDisclosure>
      <TelemetryEventList events={[{ id: "sensor-event", title: "Nominal reading received", severity: "INFO", severityTone: "info", region: "JKT", sourceTag: "DNA-014", detail: "Fabricated telemetry detail for the shared event feed.", source: "Fixture source", category: "environmental", timestamp: "2026-10-22T10:02:00Z", timestampLabel: "10:02:00" }]} empty={<p>No fabricated events.</p>}/>
      <Notice role="note">Map, region and sensor values are fabricated catalog data.</Notice>
    </ViewFixture>
    <ViewFixture title="03 · Continuum">
      <EntityCard title="Agent fixture · ARSY" summary="Scoped to a fabricated mission and a reviewable tool set." status={<Badge tone="info">READY</Badge>}/>
      <FormSection title="Invocation preview" description="The controls are examples and do not invoke an agent."><TextField aria-label="Fixture invocation goal" defaultValue="Summarize the reviewed source set"/><ReviewActions><Button>Preview invocation</Button><Button variant="secondary">Cancel</Button></ReviewActions></FormSection>
    </ViewFixture>
    <ViewFixture title="04 · Directory">
      <FilterBar resultLabel="2 fabricated entities"><TextField aria-label="Filter directory fixture" placeholder="Search entities…"/></FilterBar>
      <DataTable caption="Fabricated entity directory" rowKey={(row) => row.id} rows={[{ id: "operator-1", name: "Operator fixture", role: "Reviewer" }, { id: "agent-1", name: "Agent fixture", role: "Service agent" }]} columns={[{ key: "name", header: "Entity", cell: (row) => row.name }, { key: "role", header: "Role", cell: (row) => row.role }]}/>
    </ViewFixture>
    <ViewFixture title="05 · Knowledge">
      <p><StatusIndicator tone="warning">Editorial metadata fixture</StatusIndicator></p>
      <Disclosure summary="Source and edition notes"><p>Fabricated source note with edition and provenance context.</p></Disclosure>
      <Disclosure summary="Arabic source excerpt"><p lang="ar" dir="rtl">نص تجريبي للمراجعة فقط</p></Disclosure>
    </ViewFixture>
    <ViewFixture title="06 · Audit ledger">
      <EventList events={[{ id: "audit-1", timestamp: "2026-10-22T10:03:00Z", actor: "Reviewer fixture", action: "Recorded a sample decision", details: "The entry is static and contains no tenant data." }]}/>
      <Disclosure summary="Audit payload"><code>{`{"event":"fixture.reviewed","tenant":"sample","complete":true}`}</code></Disclosure>
      <Pagination page={1} totalPages={2} onPageChange={() => undefined}/>
    </ViewFixture>
    <ViewFixture title="07 · Governance · CAB">
      <ListDetail items={[{ id: "change-1", title: "Fixture change request", summary: "A fabricated policy-reviewed change." }, { id: "change-2", title: "Fixture rollback plan", summary: "A second fabricated request." }]} selectedKey="change-1" getKey={(item) => item.id} renderListItem={(item) => <span>{item.title}</span>} renderDetail={(item) => <DecisionSummary title={item.title} decision="Pending review" rationale={item.summary}/>} onSelect={() => undefined}/>
      <ActionGroup><Button>Approve fixture</Button><Button variant="secondary">Request changes</Button></ActionGroup>
    </ViewFixture>
    <ViewFixture title="08 · Research operations">
      <Timeline items={[{ id: "run-created", label: "Snapshot", title: "Research run created", description: "Static run fixture." }, { id: "run-review", label: "Pending", title: "Evidence review", description: "No research action is submitted." }]}/>
      <ReadinessList items={[{ id: "source-coverage", label: "Source coverage", status: "partial", detail: "One fabricated source is pending." }]}/>
      <FormSection title="Evidence review" description="Form and approval controls remain examples only."><ReviewActions><Button>Approve evidence</Button><Button variant="secondary">Request review</Button></ReviewActions></FormSection>
    </ViewFixture>
  </div>;
}
