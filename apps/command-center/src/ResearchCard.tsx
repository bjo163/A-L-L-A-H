import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { API_PATHS, createApiClient } from "@empire/api-contract";
import type { ResearchRun } from "@empire/api-contract";
import { Badge, Button, FieldLabel, Notice, Panel, SectionHeading, SelectField, TextArea, TextField } from "@empire/ui";
import type { ConfirmDialogTone } from "@empire/ui";

export type ResearchConfirmationRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ConfirmDialogTone;
  successMessage: string;
  action: () => Promise<unknown>;
};

type ResearchCardProps = {
  run: ResearchRun;
  client: ReturnType<typeof createApiClient>;
  busy: boolean;
  canApprove: boolean;
  canWrite: boolean;
  onAction: (action: () => Promise<unknown>, message: string) => Promise<void>;
  onConfirmAction: (request: ResearchConfirmationRequest) => void;
  refreshKey?: string;
};

/** App-level research workflow presentation; server actions and permissions are injected by App. */
export function ResearchCard({ run, client, busy, canApprove, canWrite, onAction, onConfirmAction, refreshKey }: ResearchCardProps) {
  const [detail, setDetail] = useState<ResearchRun | null>(null);
  const [title, setTitle] = useState("");
  const [sourceUri, setSourceUri] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [provenance, setProvenance] = useState("{}");
  const [provenanceError, setProvenanceError] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [sourceFamily, setSourceFamily] = useState("other");
  const [classification, setClassification] = useState("HYPOTHESIS");

  useEffect(() => {
    void client.request<ResearchRun>(`${API_PATHS.researchRuns}/${run.id}`).then(setDetail).catch(() => setDetail(run));
  }, [run.id, refreshKey]);

  async function attachEvidence(event: FormEvent) {
    event.preventDefault();
    let parsed: Record<string, unknown>;
    try {
      const candidate = JSON.parse(provenance) as unknown;
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("object required");
      parsed = candidate as Record<string, unknown>;
      setProvenanceError("");
    } catch {
      setProvenanceError("Provenance harus berupa JSON object yang valid. Isi form tetap dipertahankan.");
      return;
    }
    await onAction(() => client.request(`${API_PATHS.researchRuns}/${run.id}/evidence`, {
      method: "POST",
      body: { title, sourceUri, sourceFamily, classification, excerpt, provenance: parsed },
    }), "Bukti sumber tersimpan.");
  }

  return (
    <Panel manga as="article" className="research-card">
      <SectionHeading layout="compact" level={3} title={run.title} aside={<><small>{run.scope} · {run.id}</small><Badge tone={run.status === "completed" ? "success" : run.status === "rejected" ? "danger" : "warning"}>{run.status}</Badge></>} />
      <p>{run.question}</p>
      {detail?.resultSummary && <p><strong>Hasil:</strong> {detail.resultSummary}</p>}
      {detail?.approvals?.map((approval, index) => <p key={index} className="muted">Approval: {approval.decision}{approval.comments ? ` — ${approval.comments}` : ""}</p>)}
      {detail?.evidence?.map((item) => <article key={item.id} className="evidence-item"><strong>{item.title}</strong><small>{item.sourceFamily} · {item.classification} · <a href={item.sourceUri} target="_blank" rel="noreferrer">sumber</a></small><p>{item.excerpt}</p></article>)}
      <div className="action-row">
        {run.status === "pending_approval" && canApprove && <>
          <Button disabled={busy} onClick={() => onConfirmAction({ title: "Setujui research run?", description: `${run.title} · ${run.id}\nPersetujuan akan membuat workflow dan job riset.`, confirmLabel: "Setujui riset", tone: "primary", successMessage: "Research run disetujui; workflow dan job dibuat.", action: () => client.request(`${API_PATHS.researchRuns}/${run.id}/approval`, { method: "POST", body: { decision: "approved" } }) })}>Setujui riset</Button>
          <Button variant="secondary" disabled={busy} onClick={() => onConfirmAction({ title: "Tolak research run?", description: `${run.title} · ${run.id}\nPenolakan akan dicatat pada riwayat persetujuan.`, confirmLabel: "Tolak riset", tone: "danger", successMessage: "Penolakan dicatat.", action: () => client.request(`${API_PATHS.researchRuns}/${run.id}/approval`, { method: "POST", body: { decision: "rejected" } }) })}>Tolak riset</Button>
        </>}
      </div>
      {(run.status === "queued" || run.status === "running") && canWrite && <>
        <form className="form-grid evidence-form" onSubmit={attachEvidence}>
          <strong>Tambahkan bukti</strong>
          {provenanceError && <Notice tone="danger" role="alert">{provenanceError}</Notice>}
          <FieldLabel>Judul sumber<TextField required value={title} onChange={(event) => setTitle(event.target.value)} /></FieldLabel>
          <FieldLabel>URL sumber<TextField type="url" required value={sourceUri} onChange={(event) => setSourceUri(event.target.value)} /></FieldLabel>
          <div className="form-row">
            <FieldLabel>Keluarga sumber<SelectField value={sourceFamily} onChange={(event) => setSourceFamily(event.target.value)}><option value="quran">Qur'an</option><option value="torah">Torah</option><option value="psalms">Psalms</option><option value="gospels">Gospels</option><option value="other">Lainnya</option></SelectField></FieldLabel>
            <FieldLabel>Klasifikasi<SelectField value={classification} onChange={(event) => setClassification(event.target.value)}>{["SCRIPTURE_TEXT", "TRADITION_INTERPRETATION", "HISTORICAL_CLAIM", "VERIFIED_MEASUREMENT", "SCIENTIFIC_MODEL", "HYPOTHESIS", "PROJECT_NARRATIVE", "PERSONAL_TESTIMONY"].map((item) => <option key={item}>{item}</option>)}</SelectField></FieldLabel>
          </div>
          <FieldLabel>Kutipan / catatan<TextArea required value={excerpt} onChange={(event) => setExcerpt(event.target.value)} /></FieldLabel>
          <FieldLabel>Provenance JSON<TextArea value={provenance} onChange={(event) => setProvenance(event.target.value)} /></FieldLabel>
          <Button type="submit" disabled={busy}>Simpan bukti</Button>
        </form>
        <form className="form-grid evidence-form" onSubmit={(event) => { event.preventDefault(); void onAction(() => client.request(`${API_PATHS.researchRuns}/${run.id}/complete`, { method: "POST", body: { resultSummary } }), "Research run selesai dan diaudit."); }}>
          <FieldLabel>Ringkasan hasil<TextArea required minLength={3} value={resultSummary} onChange={(event) => setResultSummary(event.target.value)} /></FieldLabel>
          <Button type="submit" disabled={busy || !detail?.evidence?.length}>Selesaikan run</Button>
        </form>
      </>}
      {detail?.workflow && <p className="muted">Workflow: {detail.workflow.status}; job: {detail.workflow.jobs.map((job) => `${job.kind} (${job.status})`).join(", ")}</p>}
    </Panel>
  );
}
