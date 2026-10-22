import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { BrandConcepts } from "../src/brand/BrandConcepts";
import { OperationalCategoryFixtures, PortalHomeFixture } from "./PageFixtures";
import { ActionGroup, ActionLink, ActionPanel, ArchitectureLayers, AuthLayout, Badge, BrandLockup, Button, buttonClassName, CallToAction, Card, Checkbox, ConfirmDialog, Container, DataTable, DecisionSummary, Disclosure, DonutChart, DomainSymbol, domainSymbolNames, EmptyState, EntityCard, ErrorState, EventList, Field, FieldError, FieldLabel, FilterBar, FormSection, Grid, Heading, HelpText, Icon, IconButton, IconText, iconDisplaySizes, iconGroups, IdentityCardGroup, Inline, LiveRegion, Metadata, NavGroup, NavItem, LoadingState, ListDetail, MapFrame, MapLegend, MangaEffect, MangaLoadingState, MangaOrbit, MangaPageIntro, MangaSfx, MangaTelemetryHero, MetricGrid, ModuleGrid, Notice, PageCrosslinks, Panel, Pagination, PortalDomainCard, ReadinessBoard, ReadinessList, RegionSummary, RepositoryOverview, ResourceState, ReviewActions, ResponsiveTabs, RoadmapPreview, RoadmapTimeline, Section, SectionHeading, SelectField, Skeleton, Stack, StatusIndicator, SystemAtlas, SystemDetailPanel, Tabs, TextArea, Text, TextField, ThemeControl, Timeline, WorkflowSteps, ArrowUpRightIcon, ArrowLeftIcon, ArrowRightIcon, SearchIcon, CloseIcon, SunIcon, MoonIcon, HomeIcon, LockIcon } from "../src";
import "../src/portal.css";
import "../src/command-center.css";
import "./catalog.css";

function Catalog() {
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [language, setLanguage] = useState<"en" | "id">("en");
  const [viewport, setViewport] = useState("375");
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string>();
  const [catalogTitle, setCatalogTitle] = useState("");
  const [catalogScope, setCatalogScope] = useState("");
  const [catalogFormStatus, setCatalogFormStatus] = useState<"idle" | "error" | "success">("idle");
  const [focusInvalidField, setFocusInvalidField] = useState<"title" | "scope">();
  const catalogTitleRef = useRef<HTMLInputElement>(null);
  const catalogScopeRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (!focusInvalidField) return;
    (focusInvalidField === "title" ? catalogTitleRef : catalogScopeRef).current?.focus();
    setFocusInvalidField(undefined);
  }, [focusInvalidField]);
  const [announcements, setAnnouncements] = useState<Array<{ id: number; tone: "success" | "danger"; role: "status" | "alert" }>>([]);
  const tabItems = [
    { value: "overview", label: "Overview", content: <TabMountExample name="Overview" /> },
    { value: "details", label: "Details", content: <TabMountExample name="Details" /> },
    { value: "long-label", label: "UnbrokenLabelForNarrowViewportsAndTranslatedContent", content: <TabMountExample name="Long label" /> },
    { value: "disabled", label: "Unavailable", content: <p>This panel is unavailable.</p>, disabled: true },
  ];
  const syncThemeColor = useCallback((nextTheme: "dark" | "light") => {
    setTheme(nextTheme);
    const canvas = getComputedStyle(document.documentElement)
      .getPropertyValue("--eol-color-background")
      .trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", canvas);
  }, []);

  const previewUrl = `/preview.html?theme=${theme}&density=${density}&language=${language}`;

  function openConfirmationPreview() {
    setConfirmError(undefined);
    setConfirmBusy(false);
    setConfirmOpen(true);
  }

  function simulateConfirmationFailure() {
    setConfirmBusy(true);
    window.setTimeout(() => {
      setConfirmBusy(false);
      setConfirmError("Preview only: the example request was not sent.");
    }, 900);
  }

  function submitCatalogForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const titleIsMissing = catalogTitle.trim().length === 0;
    const scopeIsMissing = catalogScope.length === 0;
    if (titleIsMissing || scopeIsMissing) {
      setCatalogFormStatus("error");
      setFocusInvalidField(titleIsMissing ? "title" : "scope");
      return;
    }
    setCatalogFormStatus("success");
  }

  const tokenSamples = [
    ["Background", "--eol-color-background"],
    ["Surface", "--eol-color-surface"],
    ["Raised", "--eol-color-surface-raised"],
    ["Border", "--eol-color-border"],
    ["Strong border", "--eol-color-border-strong"],
    ["Text", "--eol-color-text"],
    ["Muted text", "--eol-color-text-muted"],
    ["Accent", "--eol-color-accent"],
    ["Focus", "--eol-color-focus"],
  ];

  return (
    <main className="catalog-shell" lang={language} data-density={density}>
      <header className="catalog-header">
        <p className="catalog-eyebrow">EMPIRE OF THE LIGHT / MANGA EDITION</p>
        <h1>Stories in every line.</h1>
        <p>
          A lively shared visual language: inked panels, screentone, dramatic
          motion, and a few well-timed sound effects.
        </p>
        <MangaSfx text="ZAP!" className="catalog-sfx" />
        <span className="catalog-burst" aria-hidden="true" />
        <ThemeControl label="Preview color theme" lightLabel="Light" darkLabel="Dark" lightIcon={<Icon name="sun" size={16}/>} darkIcon={<Icon name="moon" size={16}/>} onThemeChange={syncThemeColor} />
      </header>

      <section className="catalog-preview-controls" aria-labelledby="preview-controls-heading">
        <div className="catalog-section-heading">
          <div><p className="catalog-eyebrow">REPRODUCIBLE PREVIEW</p><h2 id="preview-controls-heading">Review the same fixture across settings</h2></div>
          <p>Theme, density, language, and the iframe viewport are explicit so screenshots can be compared consistently.</p>
        </div>
        <div className="catalog-preview-control-row">
          <div className="catalog-preview-control">
            <span id="density-preview-label">Density</span>
            <div role="group" aria-labelledby="density-preview-label">
              <button type="button" aria-pressed={density === "comfortable"} onClick={() => setDensity("comfortable")}>Comfortable</button>
              <button type="button" aria-pressed={density === "compact"} onClick={() => setDensity("compact")}>Compact</button>
            </div>
          </div>
          <div className="catalog-preview-control">
            <span id="language-preview-label">Language</span>
            <div role="group" aria-labelledby="language-preview-label">
              <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
              <button type="button" aria-pressed={language === "id"} onClick={() => setLanguage("id")}>Bahasa Indonesia</button>
            </div>
          </div>
          <Field label="Viewport width" control={<SelectField value={viewport} onChange={(event) => setViewport(event.currentTarget.value)}>
            <option value="375">Phone · 375 px</option>
            <option value="768">Tablet · 768 px</option>
            <option value="1024">Desktop · 1024 px</option>
            <option value="1440">Wide · 1440 px</option>
          </SelectField>} />
        </div>
        <div className="catalog-preview-frame-wrap">
          <p className="catalog-preview-frame-label" aria-live="polite">{viewport} × 900 px · {theme} · {density} · {language.toUpperCase()}</p>
          <iframe key={previewUrl} className="catalog-preview-frame" title={`Responsive package preview at ${viewport} pixels`} src={previewUrl} style={{ width: `${viewport}px` }} />
        </div>
        <p className="catalog-caption">Command Center shell: <a href="/workspace-preview.html" target="_blank" rel="noreferrer">open the responsive workspace fixture</a>.</p>
      </section>

      <section className="catalog-section" aria-labelledby="brand-concepts-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">VECTOR IDENTITY STUDY</p>
            <h2 id="brand-concepts-heading">One family, three marks</h2>
          </div>
          <p>Orbit is the provisional shared working mark used by the app shells; compare all three SVG candidates here. Final logo selection and visual approval remain open.</p>
        </div>
        <div className="brand-concept__active">
          <BrandLockup name="A-L-L-A-H" descriptor="PUBLIC PORTAL" />
          <BrandLockup size="compact" name="100CENTER" descriptor="OPERATOR WORKSPACE" />
          <BrandLockup layout="stacked" name="A-L-L-A-H" descriptor="STACKED LOCKUP" />
          <span>Provisional working mark · Orbit · LogoMark is the mark-only variant.</span>
        </div>
        <BrandConcepts />
      </section>

      <section className="catalog-section" aria-labelledby="icon-gallery-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">ORIGINAL VECTOR ICONS</p>
            <h2 id="icon-gallery-heading">One 24px stroke family</h2>
          </div>
            <p>Compare every icon at the package optical sizes in one accent plus muted text color. Correct use pairs it with a visible label or names the control; avoid color-only meaning and unlabeled icon-only actions.</p>
        </div>
        {iconGroups.map((group) => <div className="icon-gallery-group" key={group.label}><h3>{group.label}</h3><div className="icon-gallery">{group.names.map((name) => <div className="icon-gallery__item" key={name}><div className="icon-gallery__samples">{iconDisplaySizes.map((size) => <Icon key={size} name={name} size={size}/>)}</div><Icon className="icon-gallery__muted" name={name} size={iconDisplaySizes[1]}/><code>{name}</code></div>)}</div></div>)}
        <div className="icon-direction-demo">
          <span dir="ltr">LTR <Icon name="arrowLeft"/> <Icon name="arrowUpRight"/> <Icon name="input"/></span>
          <span dir="rtl">RTL <Icon name="arrowLeft"/> <Icon name="arrowUpRight"/> <Icon name="input"/></span>
        </div>
        <div className="icon-gallery__usage"><span><SearchIcon size={16}/>Search current view</span><IconText icon={<ArrowUpRightIcon />}>Open related details</IconText><button type="button" aria-label="Close preview"><CloseIcon size={16}/></button><small>Visible label for actions · explicit accessible name for icon-only controls</small></div>
      </section>

      <section className="catalog-section" aria-labelledby="domain-symbol-heading">
        <div className="catalog-section-heading">
          <div><p className="catalog-eyebrow">DOMAIN VECTOR FAMILY</p><h2 id="domain-symbol-heading">Six domains, one stroke system</h2></div>
          <p>Package-owned, decorative 24px SVG symbols share the icon family. The domain name and visible label carry meaning; symbols never replace the title.</p>
        </div>
        <div className="domain-symbol-gallery">{domainSymbolNames.map((name) => <div className="domain-symbol-gallery__item" key={name}><DomainSymbol name={name} size={32}/><code>{name}</code></div>)}</div>
      </section>

      <section className="manga-showcase" aria-label="Manga visual effects preview">
        <MangaEffect as="article" panel screentone className="manga-panel manga-panel--hero">
          <span className="manga-panel__index">01 / THE BIG PICTURE</span>
          <span className="manga-panel__burst" aria-hidden="true" />
          <p className="manga-panel__copy">A universe of ideas,<br /><strong>drawn together.</strong></p>
          <MangaSfx text="BAM!" className="manga-panel__sfx" />
          <span className="manga-panel__caption">THE STORY SO FAR →</span>
        </MangaEffect>
        <MangaEffect as="article" panel speedLines className="manga-panel manga-panel--motion">
          <span className="manga-panel__index">02 / KEEP IT MOVING</span>
          <MangaOrbit className="catalog-manga-orbit" />
          <div className="manga-speech">Clear tools.<br /><b>Big energy.</b><i aria-hidden="true" /></div>
          <MangaSfx text="WHOOSH" className="manga-panel__sfx manga-panel__sfx--small" />
          <span className="manga-panel__caption">MOTION WITH A PURPOSE</span>
        </MangaEffect>
      </section>

      <section className="catalog-section" aria-labelledby="buttons-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">ACTIONS</p>
            <h2 id="buttons-heading">Buttons</h2>
          </div>
          <p>Use a clear verb and reserve the primary style for the main action.</p>
        </div>
        <Panel className="catalog-card catalog-row">
          <Button onClick={() => setBusy((value) => !value)}>
            {busy ? "Finish example" : "Primary action"}
          </Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="quiet">Quiet action</Button>
          <Button disabled>Unavailable</Button>
          <a className={buttonClassName("secondary")} href="#tokens-heading">Anchor action</a>
        </Panel>
        <p className="catalog-caption" aria-live="polite">
          {busy
            ? "The primary control is responding to input."
            : "Controls use native button semantics and can be reached by keyboard."}
        </p>
      </section>

      <section className="catalog-section" aria-labelledby="tabs-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">KEYBOARD NAVIGATION</p>
            <h2 id="tabs-heading">Tabs</h2>
          </div>
          <p>Use arrow keys to move and activate, with Home/End shortcuts and one tab stop. Only the active panel mounts; switching back resets its local state.</p>
        </div>
        <Panel className="catalog-card">
          <Tabs items={tabItems} value={activeTab} onValueChange={setActiveTab} label="Catalog examples" />
        </Panel>
      </section>

      <section className="catalog-section" aria-labelledby="badges-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">LABELS</p>
            <h2 id="badges-heading">Badges</h2>
          </div>
          <p>Color supports the label; it does not replace the status text.</p>
        </div>
        <Panel className="catalog-card catalog-row">
          <Badge tone="neutral">Scaffold</Badge>
          <Badge tone="info">Design</Badge>
          <Badge tone="success">Ready</Badge>
          <Badge tone="warning">Research</Badge>
          <Badge tone="danger">Unavailable</Badge>
          <StatusIndicator tone="success">Operational</StatusIndicator>
          <StatusIndicator tone="warning">Degraded</StatusIndicator>
          <StatusIndicator tone="neutral">Status unknown</StatusIndicator>
        </Panel>
      </section>

      <section className="catalog-section" aria-labelledby="notices-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">FEEDBACK</p>
            <h2 id="notices-heading">Notices</h2>
          </div>
          <p>Static examples do not announce on page load. Add a live update to inspect announcement roles.</p>
        </div>
        <div className="catalog-row">
          <Button variant="secondary" onClick={() => setAnnouncements((items) => [...items, { id: items.length + 1, tone: "success", role: "status" }])}>Add status update</Button>
          <Button variant="danger" onClick={() => setAnnouncements((items) => [...items, { id: items.length + 1, tone: "danger", role: "alert" }])}>Add urgent update</Button>
        </div>
        <div className="catalog-notices">
          <Notice role="note">Research metadata is available for review.</Notice>
          <Notice tone="success" role="note">The requested change was recorded successfully.</Notice>
          <Notice tone="warning" role="note">
            Readiness is degraded while a required service is unavailable.
          </Notice>
          <Notice tone="danger" role="note">
            This action could not be completed. Your work is still available.
          </Notice>
          <Notice tone="danger" role="note">
            This persistent issue is documented here and does not require an interrupting announcement.
          </Notice>
          <Notice role="note">
            Long-content fixture: this message intentionally spans several sentences so reviewers can inspect wrapping, spacing, and reading order at narrow widths. It explains that the displayed information comes from a local preview, may be incomplete, and should not be treated as a live operational signal until the owning service confirms its source, timestamp, and current access permissions.
          </Notice>
          <Notice tone="info" role="note">Long identifier fixture: request-reference-7f2c8a14d1e04f0bb9b9a805be38f123 should wrap inside this notice without widening the page.</Notice>
          {announcements.map(({ id, tone, role }) => (
            <Notice key={id} tone={tone} role={role}>
              {role === "alert" ? `Urgent preview ${id}: the request could not be completed.` : `Status preview ${id}: the update was recorded.`}
            </Notice>
          ))}
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="panels-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">SURFACES</p>
            <h2 id="panels-heading">Panels</h2>
          </div>
          <p>Choose semantic elements in the consuming application.</p>
        </div>
        <div className="catalog-panels">
          <Panel as="article" className="catalog-card">
            <p className="catalog-eyebrow">PROCESS HEALTH</p>
            <h3>Available</h3>
            <p>The process answered its health request.</p>
          </Panel>
          <Panel as="article" className="catalog-card">
            <p className="catalog-eyebrow">SOURCE CONTEXT</p>
            <h3>Traceable by design</h3>
            <p>Identity, edition, and review state belong beside evidence.</p>
          </Panel>
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="compositions-heading">
        <SectionHeading
          className="catalog-section-heading"
          eyebrow="REUSABLE COMPOSITIONS"
          title="Page context and quick stats"
          id="compositions-heading"
          aside="Shared layout primitives keep page hierarchy consistent while leaving copy and domain details to each app."
        />
        <Panel className="catalog-card catalog-composition">
          <Section profile="editorial" aria-labelledby="editorial-rhythm-heading">
            <Heading as="h3" id="editorial-rhythm-heading">Editorial section rhythm</Heading>
            <Text>Long-form sections receive generous vertical breathing room and a wider gap between related content.</Text>
          </Section>
          <Section profile="operational" aria-labelledby="operational-rhythm-heading">
            <Heading as="h3" id="operational-rhythm-heading">Operational section rhythm</Heading>
            <Text>Task-focused sections use a tighter, repeatable vertical interval for dense workflows.</Text>
          </Section>
          <SectionHeading
            layout="section"
            eyebrow="LONG TITLE + ACTION"
            title="Review long evidence labels without losing the primary action"
            aside={<Button variant="quiet">Open evidence</Button>}
          />
          <MangaPageIntro
            className="catalog-intro-demo"
            breadcrumb="Portal / Overview"
            eyebrow="PAGE INTRO"
            title="A clear place to begin."
            description="Use a consistent heading, summary, and action area across related pages."
            sfx="BAM!"
          />
          <MangaTelemetryHero eyebrow="SYSTEM TELEMETRY" title="Fixture shell status" pulse="Operational" sfx="PING!" description="A static telemetry composition for visual review; it does not call an API." metadata={<span>Fixture · 2026-10-22</span>} />
          <MetricGrid profile="editorial" density={density} items={[
            { value: "07", label: "Architecture layers" },
            { value: "06", label: "Technology domains" },
            { value: "01", label: "Human decision authority" },
          ]} />
          <div className="catalog-container-examples" aria-label="Container width presets">
            <Container size="reading"><span>Reading · 48rem</span></Container>
            <Container size="content"><span>Content · 76rem</span></Container>
            <Container size="workspace"><span>Workspace · 90rem</span></Container>
          </div>
          <MangaLoadingState className="catalog-manga-loading" eyebrow="ATLAS" label="Loading system map…" sfx="ZIP!" />
        </Panel>
        <Panel className="catalog-card">
          <h3>Operational metrics</h3>
          <MetricGrid density="compact" items={[
            { label: "Service health", value: "Operational", tone: "success" },
            { label: "Queue backlog", value: "12", detail: "4 high priority", freshness: "Updated 2 minutes ago", tone: "warning" },
            { label: "Last refresh", value: "2 min ago", tone: "neutral" },
          ]} />
        </Panel>
        <Panel className="catalog-card">
          <h3>Six-column operational metrics</h3>
          <MetricGrid columns={6} density="compact" items={[
            { label: "Videos monitored", value: "128" },
            { label: "Critical", value: "03", tone: "danger" },
            { label: "High risk", value: "12", tone: "warning" },
            { label: "Positive", value: "42", tone: "success" },
            { label: "Actions", value: "08", tone: "info" },
            { label: "Last scan", value: "2m ago" },
          ]} />
        </Panel>
        <Panel className="catalog-card">
          <h3>Distribution chart</h3>
          <DonutChart
            label="Review direction distribution"
            centerLabel="ITEMS"
            segments={[
              { id: "declined", label: "Declined", value: 4, tone: "danger" },
              { id: "approved", label: "Approved", value: 7, tone: "success" },
              { id: "pending", label: "Pending", value: 3, tone: "info" },
            ]}
          />
        </Panel>
      </section>

      <section className="catalog-section" aria-labelledby="map-patterns-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">OPT-IN MAP PRESENTATION</p>
            <h2 id="map-patterns-heading">Map frame, legend and region summary</h2>
          </div>
          <p>Status labels remain visible beside their marker colors. The summary uses neutral props and contains no MapLibre or product data dependency.</p>
        </div>
        <div className="catalog-map-patterns">
          <MapFrame
            title="Operations map"
            state="unavailable"
            description="No live geospatial source is connected. Reference locations and data tables remain available."
            source="Map source provider"
            updatedAt="Not available"
            canvas={<div className="catalog-map-stage" aria-hidden="true" />}
          >
            <MapLegend items={[
              { status: "nominal", label: "Nominal" },
              { status: "advisory", label: "Advisory" },
              { status: "alert", label: "Alert" },
              { status: "critical", label: "Critical" },
              { status: "unavailable", label: "Unavailable" },
            ]} />
          </MapFrame>
          <div className="catalog-map-state-grid" aria-label="Map frame resource states">
            {([
              ["loading", "Loading map source"],
              ["empty", "No regional points returned"],
              ["stale", "Showing older map data"],
              ["error", "Map source request failed"],
              ["webgl-unavailable", "Interactive map cannot render"],
            ] as const).map(([state, description]) => (
              <MapFrame key={state} title={state.replaceAll("-", " ")} state={state} description={description} />
            ))}
          </div>
          <RegionSummary
            eyebrow="AP-SE · -6.20°, 106.80°"
            name="Jakarta Operations Hub"
            status="Nominal"
            tone="success"
            metrics={[
              { label: "Latency", value: "84 ms" },
              { label: "Uptime", value: "99.9%" },
              { label: "Nodes", value: 128 },
              { label: "Sensors", value: 42 },
              { label: "Heliogrid", value: "12.4 MW" },
            ]}
          />
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="tokens-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">FOUNDATIONS</p>
            <h2 id="tokens-heading">Semantic color tokens</h2>
          </div>
          <p>Components use semantic roles; palette values stay in the token layer.</p>
        </div>
        <div className="catalog-token-grid">
          {tokenSamples.map(([label, token]) => (
            <Panel as="article" className="catalog-token" key={token}>
              <span className="catalog-token-swatch" style={{ background: `var(${token})` }} aria-hidden="true" />
              <span className="catalog-token-label">{label}</span>
              <code>{token}</code>
            </Panel>
          ))}
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="states-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">DATA FEEDBACK</p>
            <h2 id="states-heading">Loading, empty, and error</h2>
          </div>
          <p>Keep an empty result distinct from an unavailable resource.</p>
        </div>
        <div className="catalog-states">
          <LoadingState aria-live="off" label="Loading module registry…" />
          <LoadingState aria-live="off" label="Module registry loaded" busy={false} />
          <EmptyState role="region" title="No modules registered" description="The catalog responded successfully and contains no entries yet." />
          <EmptyState role="region" title="No matching evidence" description="Change the filters or broaden the search scope to look again." />
          <ErrorState role="region" title="Module catalog unavailable" description="The catalog could not be loaded." action={<Button variant="secondary">Try again</Button>} />
          <Panel className="catalog-card catalog-skeleton">
            <p className="catalog-caption">Decorative loading placeholder</p>
            <Skeleton width="65%" />
            <Skeleton width="40%" />
            <Skeleton shape="rect" width="100%" />
          </Panel>
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="fields-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">FORM CONTROLS</p>
            <h2 id="fields-heading">Native fields and validation</h2>
          </div>
          <p>Keep browser validation and native keyboard behavior; connect help and errors with described-by IDs.</p>
        </div>
        <Panel className="catalog-card catalog-field-demo">
          <form noValidate onSubmit={submitCatalogForm} aria-describedby="catalog-form-help">
            <p id="catalog-form-help" className="catalog-caption">Submit the empty form to see an announced error and focus move to the first invalid field. Correct the fields and submit again to see recovery. Nothing is saved.</p>
            {catalogFormStatus === "error" && <Notice tone="danger" role="alert">Review the highlighted fields. Focus moved to the first field that needs attention.</Notice>}
            {catalogFormStatus === "success" && <Notice tone="success" role="status">The example is valid. No research request was sent.</Notice>}
            <FieldLabel htmlFor="catalog-title">Research title</FieldLabel>
            <TextField ref={catalogTitleRef} id="catalog-title" required value={catalogTitle} aria-invalid={catalogFormStatus === "error" && !catalogTitle.trim() || undefined} aria-describedby={`catalog-title-help${catalogFormStatus === "error" && !catalogTitle.trim() ? " catalog-title-error" : ""}`} onChange={(event) => { setCatalogTitle(event.currentTarget.value); if (catalogFormStatus === "success") setCatalogFormStatus("idle"); }} />
            <HelpText id="catalog-title-help">Use a short title that distinguishes this research run.</HelpText>
            {catalogFormStatus === "error" && !catalogTitle.trim() && <FieldError id="catalog-title-error" role="note">Enter a title before submitting.</FieldError>}
            <FieldLabel htmlFor="catalog-question">Research question</FieldLabel>
            <TextArea id="catalog-question" rows={3} placeholder="What do you want to understand?" />
            <FieldLabel htmlFor="catalog-scope">Scope</FieldLabel>
            <SelectField ref={catalogScopeRef} id="catalog-scope" required value={catalogScope} aria-invalid={catalogFormStatus === "error" && !catalogScope || undefined} aria-describedby={catalogFormStatus === "error" && !catalogScope ? "catalog-scope-error" : undefined} onChange={(event) => { setCatalogScope(event.currentTarget.value); if (catalogFormStatus === "success") setCatalogFormStatus("idle"); }}>
              <option value="">Choose a scope</option>
              <option value="self">Self</option>
              <option value="community">Community</option>
              <option value="global">Global</option>
            </SelectField>
            {catalogFormStatus === "error" && !catalogScope && <FieldError id="catalog-scope-error" role="note">Choose a scope before you continue.</FieldError>}
            <FieldLabel htmlFor="catalog-disabled">Unavailable field</FieldLabel>
            <TextField id="catalog-disabled" disabled value="Managed by the workspace" />
            <ReviewActions><Button type="submit">Validate example</Button></ReviewActions>
          </form>
        </Panel>
      </section>

      <section className="catalog-section" aria-labelledby="dialog-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">CONFIRMATION</p>
            <h2 id="dialog-heading">Modal confirmation</h2>
          </div>
          <p>Keyboard focus stays in the modal, Escape closes it, and focus returns to the opener. Confirm simulates a short busy state followed by an in-dialog error; it does not send data.</p>
        </div>
        <Button variant="danger" onClick={openConfirmationPreview}>Preview confirmation</Button>
        <ConfirmDialog
          open={confirmOpen}
          title="Remove this example?"
          description="This is a catalog preview. No data will be sent or changed."
          confirmLabel="Confirm example"
          cancelLabel="Cancel"
          busyLabel="Processing…"
          busy={confirmBusy}
          error={confirmError}
          tone="danger"
          onConfirm={simulateConfirmationFailure}
          onOpenChange={setConfirmOpen}
        />
      </section>

      <section className="catalog-section" aria-labelledby="patterns-heading">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">OPERATIONAL PATTERN FIXTURES</p>
            <h2 id="patterns-heading">Long, empty, partial, and failed data</h2>
          </div>
          <p>Every shared data pattern is exercised with realistic long content and explicit resource states before app adoption.</p>
        </div>
        <Panel className="catalog-card">
          <FilterBar resultLabel="2 of 24 records" clearAction={<Button variant="quiet">Clear filters</Button>}>
            <TextField aria-label="Filter fixture records" placeholder="Filter records…" />
            <SelectField aria-label="Fixture status" defaultValue="all"><option value="all">All statuses</option><option value="ready">Ready</option><option value="partial">Partial</option></SelectField>
          </FilterBar>
          <DataTable caption="Fixture records" responsiveLabel="Scrollable fixture records" rowKey={(row) => row.id} rows={[{ id: "long-reference-001", name: "Long evidence record with a deliberately extended title for narrow layouts", status: "Ready" }, { id: "partial-reference-002", name: "Partial source record", status: "Partial" }]} columns={[{ key: "name", header: "Record", cell: (row) => row.name }, { key: "status", header: "Status", cell: (row) => row.status }]} />
          <Pagination page={1} totalPages={3} onPageChange={() => undefined} />
        </Panel>
        <div className="catalog-panels">
          <ResourceState state="partial" title="Partial resource" description="The primary record loaded, but supplemental evidence is still unavailable."><Notice role="note">Primary content remains available for review.</Notice></ResourceState>
          <ResourceState state="error" title="Failed resource" description="The fixture service did not respond." action={<Button variant="secondary">Retry fixture</Button>} />
        </div>
        <Panel className="catalog-card">
          <ListDetail items={[{ id: "one", title: "Selected record", summary: "Long detail content remains readable and bounded inside the detail pane." }, { id: "two", title: "Second record", summary: "A second fixture demonstrates selection changes." }]} selectedKey="one" getKey={(item) => item.id} renderListItem={(item) => <span>{item.title}</span>} renderDetail={(item) => <EntityCard title={item.title} summary={item.summary} status={<Badge tone="success">Ready</Badge>} />} onSelect={() => undefined} />
          <Disclosure summary="Payload and source summary"><code>{`{"source":"fixture","complete":false,"records":2}`}</code></Disclosure>
          <EventList events={[{ id: "event-1", timestamp: "2026-10-22T10:00:00Z", actor: "Operator", action: "Reviewed evidence", details: "Long details stay behind a native disclosure." }]} />
          <Timeline items={[{ id: "t1", label: "Snapshot", title: "Evidence captured", description: "This timestamp is a fixture snapshot." }]} />
          <ReadinessList items={[{ id: "r1", label: "Source coverage", status: "partial", detail: "One source remains pending." }]} />
          <FormSection title="Review fixture" description="A complete form section keeps context before actions."><ReviewActions><Button>Approve fixture</Button><Button variant="secondary">Request changes</Button></ReviewActions></FormSection>
          <DecisionSummary title="Decision summary" decision="Pending review" rationale="The final decision remains app-owned and explicit." />
        </Panel>
      </section>

      <section className="catalog-section" aria-labelledby="page-fixtures-heading">
        <div className="catalog-section-heading">
          <div><p className="catalog-eyebrow">REAL PAGE COMPOSITIONS</p><h2 id="page-fixtures-heading">Portal page and Command Center categories</h2></div>
          <p>Full static compositions exercise shared UI patterns in each product context. Every record and action is fabricated; no service is contacted.</p>
        </div>
        <Panel className="catalog-card catalog-page-fixture-wrap">
          <div className="catalog-section-heading"><div><p className="catalog-eyebrow">PORTAL · HOME</p><h3>Public homepage fixture</h3></div><p>Shared shell, page intro, domains, process, and closing actions.</p></div>
          <PortalHomeFixture />
        </Panel>
        <div className="catalog-operations-fixtures" aria-label="Command Center view fixtures">
          <OperationalCategoryFixtures />
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="exports-heading">
        <div className="catalog-section-heading"><div><p className="catalog-eyebrow">PUBLIC EXPORT SMOKE</p><h2 id="exports-heading">Composition contract examples</h2></div><p>Small local fixtures keep public exports discoverable and prevent API drift.</p></div>
        <Card className="catalog-card"><Stack gap="2"><Heading as="h3">Typography and layout</Heading><Text>Shared text keeps semantic copy readable while layout primitives preserve spacing ownership.</Text><Metadata>Fixture metadata · no API request</Metadata><Grid minItemWidth="sm"><Inline gap="2"><Badge tone="info">Grid</Badge><Badge tone="success">Inline</Badge></Inline><ActionGroup><ActionLink href="#exports-heading">Action link</ActionLink><IconButton aria-label="Preview icon action"><SearchIcon size={16}/></IconButton></ActionGroup></Grid></Stack></Card>
        <Card className="catalog-card"><NavGroup label="Navigation fixture"><NavItem current icon={<HomeIcon size={16}/>}>Current view</NavItem><NavItem disabled icon={<LockIcon size={16}/>}>Unavailable view</NavItem></NavGroup><Field label="Composed field" hint="Native control remains app-controlled" control={<TextField defaultValue="Fixture value" />} /><Checkbox label="Fixture checkbox" defaultChecked /><LiveRegion>Catalog actions are local-only.</LiveRegion></Card>
        <AuthLayout brandName="A-L-L-A-H" brandDescriptor="CATALOG FIXTURE" title="Auth layout preview" description="Static composition only." className="catalog-auth-preview"><Button variant="secondary">Continue</Button></AuthLayout>
        <IdentityCardGroup items={[{ id: "fixture-hub", featured: true, label: "FIXTURE HUB", title: "A-L-L-A-H", description: "Static identity card sample." }, { id: "fixture-operator", label: "OPERATOR SPACE", title: "100CENTER", description: "A supporting identity card." }]} />
        <div className="frontier-grid"><PortalDomainCard id="fixture-knowledge" index="05" accent="blue" symbol="cosmos" status="METADATA" statusTone="info" descriptor="KNOWLEDGE & SOURCES" title="UNIVERSAL COSMOS" summary="Fabricated catalog summary for the domain-card presentation." action={<a className="card-link" href="#exports-heading">Open fixture details</a>} /></div>
        <WorkflowSteps label="Fabricated process sample" items={[{ id: "fixture-source", number: "01", title: "Source", description: "Record provenance." }, { id: "fixture-review", number: "02", title: "Review", description: "People inspect evidence." }]} />
        <ArchitectureLayers items={[{ id: "fixture-layer-1", code: "P01", title: "HUMANS & MISSION", description: "Accountable decisions.", href: "#exports-heading" }, { id: "fixture-layer-2", code: "P02", title: "ARSY", description: "Tools and workflows.", href: "#exports-heading" }]} orchestrationLabel="ORCHESTRATION" summary="Two fabricated layers connected by evidence and review." action={<a href="#exports-heading">Explore fixture layers</a>} />
        <ResponsiveTabs label="Fabricated system explorer" defaultValue="fixture-arsy" orientationBreakpoint={800} containerClassName="explorer" className="explorer-tabs" listClassName="explorer-menu" tabClassName="explorer-tab" selectedTabClassName="is-active" panelClassName="explorer-tab-panel" items={[
          { value: "fixture-arsy", label: <><span>SYS 01</span><strong>ARSY</strong><Icon name="arrowUpRight" size={14}/></>, content: <SystemDetailPanel systemId="fixture-arsy" category="AGENCY & ORCHESTRATION" status="DESIGN" statusTone="info" code="SYS 01" name="ARSY" description="Fabricated system detail, not a live service." inputsLabel="INPUTS" inputs={["Mandate", "Tool registry"]} outputsLabel="EXPECTED OUTPUTS" outputs={["Reviewable plan"]} note="Catalog fixture only." /> },
          { value: "fixture-ziil", label: <><span>SYS 06</span><strong>ZIIL</strong><Icon name="arrowUpRight" size={14}/></>, content: <SystemDetailPanel systemId="fixture-ziil" category="GOVERNANCE" status="FOUNDATION" statusTone="success" code="SYS 06" name="ZIIL" description="A second fabricated detail state for selection review." inputsLabel="INPUTS" inputs={["Risk evidence"]} outputsLabel="EXPECTED OUTPUTS" outputs={["Audit record"]} note="Catalog fixture only." /> },
        ]} />
        <RoadmapPreview checkpoint="01" stage="CURRENT PRIORITY" title="Build verifiable operations." description="A fabricated roadmap preview with an implementation gate and research stages." action={<a className={buttonClassName("primary", "btn")} href="#exports-heading">View fixture stages</a>} items={[{ id: "fixture-gate", label: "100CENTER & API", status: "IMPLEMENTATION GATE" }, { id: "fixture-research", label: "MATERIAL SIMULATION", status: "DESIGN / RESEARCH" }]} />
        <CallToAction eyebrow="ACCOUNTABILITY FIXTURE" title={<>Think <em>carefully.</em><br/>Act <span>with evidence.</span></>} description="Static catalog copy demonstrates the closing brand composition." actions={<><a className={buttonClassName("primary", "btn")} href="#exports-heading">Primary action</a><a className={buttonClassName("secondary", "btn")} href="#exports-heading">Secondary action</a></>} />
        <SystemAtlas items={[{ id: "fixture-plane-1", number: "01", category: "HUMANS & MISSION", title: "HUMAN OVERSIGHT", titleId: "fixture-human-oversight", description: "A fabricated atlas row for architecture review.", system: "100CENTER" }, { id: "fixture-plane-2", number: "02", category: "ORCHESTRATION", title: "ARSY", description: "A second fabricated row.", system: "ARSY" }]} />
        <RepositoryOverview eyebrow="IMPLEMENTATION FIXTURE" title={<>A <em>MODULAR REPOSITORY.</em></>} description="Static catalog copy paired with a compact module inventory." actions={<a className={buttonClassName("primary", "btn")} href="#exports-heading">Review fixture</a>} modules={[{ id: "fixture-kernel", number: "01", name: "Kernel", status: "FRAMEWORK" }, { id: "fixture-research", number: "02", name: "Research", status: "SCAFFOLD" }]} modulesLabel="Fabricated modules" />
        <PageCrosslinks label="Fabricated related pages" items={[{ id: "fixture-atlas", href: "#exports-heading", content: <IconText icon={<ArrowLeftIcon />} position="start">Return to fixture index</IconText> }, { id: "fixture-roadmap", href: "#exports-heading", content: <IconText icon={<ArrowRightIcon />}>Continue to fixture roadmap</IconText> }]} />
        <RoadmapTimeline label="Fabricated roadmap" items={[{ id: "fixture-current", number: "00", status: "FOUNDATION", title: "Shared package foundation", description: "A fabricated current phase.", current: true }, { id: "fixture-next", number: "01", status: "PLANNED", title: "Responsive adoption", description: "A fabricated future phase." }]} />
        <ReadinessBoard label="REPOSITORY STATUS" title="WHAT EXISTS TODAY?" reviewedLabel="Snapshot reviewed" reviewedAt="2026-10-22" reviewedDate="22 October 2026" items={[{ id: "fixture-code", label: "Package source", status: "AVAILABLE" }, { id: "fixture-device", label: "Physical device", status: "NOT INSTALLED" }]} note="Catalog fixture only; this is a dated snapshot, not a live monitor." />
        <ActionPanel eyebrow="OPEN WORK" title="Changes can be reviewed." description="A compact callout pattern with its action kept at the app boundary." action={<a className={buttonClassName("primary", "btn")} href="#exports-heading">Open fixture</a>} />
      </section>

      <footer className="catalog-footer">
        Keep application layouts local. Promote a pattern into this package only
        after its behavior and shared use are understood.
      </footer>
    </main>
  );
}

function TabMountExample({ name }: { name: string }) {
  const [mountCount, setMountCount] = useState(0);
  useEffect(() => setMountCount((count) => count + 1), []);
  return <p>{name} panel mounted {mountCount} time{mountCount === 1 ? "" : "s"}. Switching away and back starts a fresh panel.</p>;
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing catalog root");

createRoot(root).render(<Catalog />);
