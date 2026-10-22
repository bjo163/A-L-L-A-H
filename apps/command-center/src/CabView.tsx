import type { FormEventHandler } from "react";
import type { CabRfc, CabSummary } from "@empire/api-contract";
import { Badge, Button, DecisionSummary, EmptyState, ErrorState, FieldLabel, FormSection, LoadingState, MangaEffect, MetricGrid, ReviewActions, SelectField, TextArea, TextField } from "@empire/ui";

export type CabDraft = { title: string; tier: CabRfc["tier"]; riskLevel: CabRfc["riskLevel"]; summary: string; justification: string; executionPlan: string; rollbackPlan: string; targetService: string; scheduledWindowStart: string; scheduledWindowEnd: string };
export type CabActionRequest = { title: string; description: string; confirmLabel: string; tone: "primary" | "danger"; endpoint: string; body: unknown; successMessage: string };

type CabViewProps = {
  summary: CabSummary | null;
  visibleRfcs: readonly CabRfc[];
  selected: CabRfc | null;
  draft: CabDraft;
  busy: boolean;
  loading: boolean;
  error: string;
  searching: boolean;
  canWrite: boolean;
  canAudit: boolean;
  canReview: boolean;
  canExecute: boolean;
  sovereign: boolean;
  onDraftChange: (draft: CabDraft) => void;
  onCreate: FormEventHandler<HTMLFormElement>;
  onRefresh: () => void;
  onSelectRfc: (id: string) => void;
  onAudit: () => void;
  onConfirmAction: (request: CabActionRequest) => void;
};

export function CabView({ summary, visibleRfcs, selected, draft, busy, loading, error, searching, canWrite, canAudit, canReview, canExecute, sovereign, onDraftChange, onCreate, onRefresh, onSelectRfc, onAudit, onConfirmAction }: CabViewProps) {
  const requestAction = (action: Omit<CabActionRequest, "description"> & { detail: string }) => onConfirmAction({ ...action, description: action.detail });
  return <>
    <section><div className="section-head"><h2>Ringkasan CAB</h2><Button variant="secondary" disabled={loading} onClick={onRefresh}>Muat ulang</Button></div><MetricGrid density="compact" items={[{ label: "Total RFC", value: summary?.total ?? 0 }, { label: "Dalam proses", value: summary?.active ?? 0 }, { label: "Selesai / rollback", value: `${summary?.completed ?? 0} / ${summary?.reverted ?? 0}` }]} /></section>
    {canWrite && <FormSection title="Ajukan perubahan" description="RFC details are validated by the server before entering deliberation."><form className="form-grid form-card" onSubmit={onCreate}>
      <FieldLabel>Judul<TextField required minLength={3} value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} /></FieldLabel>
      <div className="form-row"><FieldLabel>Tingkat<SelectField value={draft.tier} onChange={(event) => onDraftChange({ ...draft, tier: event.target.value as CabDraft["tier"] })}><option value="standard">Standard</option><option value="significant">Significant</option><option value="critical">Critical</option><option value="emergency">Emergency</option></SelectField></FieldLabel><FieldLabel>Risiko<SelectField value={draft.riskLevel} onChange={(event) => onDraftChange({ ...draft, riskLevel: event.target.value as CabDraft["riskLevel"] })}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></SelectField></FieldLabel></div>
      <FieldLabel>Layanan sasaran<TextField required minLength={3} value={draft.targetService} onChange={(event) => onDraftChange({ ...draft, targetService: event.target.value })} /></FieldLabel>
      <FieldLabel>Ringkasan<TextArea required minLength={3} value={draft.summary} onChange={(event) => onDraftChange({ ...draft, summary: event.target.value })} /></FieldLabel>
      <FieldLabel>Alasan<TextArea required minLength={3} value={draft.justification} onChange={(event) => onDraftChange({ ...draft, justification: event.target.value })} /></FieldLabel>
      <FieldLabel>Rencana eksekusi<TextArea required minLength={3} value={draft.executionPlan} onChange={(event) => onDraftChange({ ...draft, executionPlan: event.target.value })} /></FieldLabel>
      <FieldLabel>Rencana rollback<TextArea required minLength={30} value={draft.rollbackPlan} onChange={(event) => onDraftChange({ ...draft, rollbackPlan: event.target.value })} /></FieldLabel>
      <div className="form-row"><FieldLabel>Mulai jadwal<TextField type="datetime-local" value={draft.scheduledWindowStart} onChange={(event) => onDraftChange({ ...draft, scheduledWindowStart: event.target.value })} /></FieldLabel><FieldLabel>Selesai jadwal<TextField type="datetime-local" value={draft.scheduledWindowEnd} onChange={(event) => onDraftChange({ ...draft, scheduledWindowEnd: event.target.value })} /></FieldLabel></div>
      <Button type="submit" disabled={busy}>Ajukan RFC</Button>
    </form></FormSection>}
    <section className="cab-layout"><div><div className="section-head"><h2>Daftar RFC</h2><span className="eyebrow">{visibleRfcs.length} ditampilkan</span></div>
      {visibleRfcs.length > 0 ? <div className="rfc-list">{visibleRfcs.map((rfc) => <MangaEffect as="button" action type="button" className={`rfc-item ${selected?.id === rfc.id ? "rfc-selected" : ""}`} key={rfc.id} onClick={() => onSelectRfc(rfc.id)}><span><strong>{rfc.title}</strong><small>{rfc.code} · {rfc.tier} · {rfc.riskLevel}</small></span><Badge tone={rfc.status === "approved" || rfc.status === "completed" ? "success" : rfc.status === "rejected" || rfc.status === "reverted" ? "danger" : "warning"}>{rfc.status}</Badge></MangaEffect>)}</div>
        : loading ? <LoadingState label="Memuat daftar RFC…" /> : error ? <ErrorState role="region" title="Daftar RFC tidak tersedia" description="Muat ulang daftar untuk mencoba kembali." action={<Button variant="secondary" onClick={onRefresh}>Coba lagi</Button>} /> : <EmptyState title={searching ? "No RFC matches" : "Belum ada RFC"} description={searching ? "Try a different search term." : "Tidak ada usulan perubahan yang dapat diakses pada konteks ini."} />}
    </div>
    <div className="rfc-detail">{selected ? <><div className="section-head"><div><span className="eyebrow">{selected.code}</span><h2>{selected.title}</h2></div><Badge tone="warning">{selected.status}</Badge></div>
      <DecisionSummary title="CAB decision" decision={selected.status} rationale={selected.summary} />
      <dl><dt>Justifikasi</dt><dd>{selected.justification}</dd><dt>Target</dt><dd>{selected.targetService}</dd><dt>Rencana eksekusi</dt><dd>{selected.executionPlan}</dd><dt>Rencana rollback</dt><dd>{selected.rollbackPlan}</dd><dt>Policy round</dt><dd>{selected.auditRound}</dd></dl>
      {selected.reviews?.length ? <><h3>Review & policy checks</h3><ul>{selected.reviews.map((review, index) => <li key={`${review.reviewerRole}-${index}`}><strong>{review.reviewerRole}</strong> · {review.verdict} — {review.notes}</li>)}</ul></> : null}
      {selected.executions?.length ? <><h3>Riwayat eksekusi</h3><ul>{selected.executions.map((execution, index) => <li key={`${execution.action}-${index}`}>{execution.action} · {execution.outcome} · {new Date(execution.startedAt).toLocaleString()}</li>)}</ul></> : null}
      <ReviewActions className="action-row">
        {selected.status === "deliberation" && canAudit && <Button variant="secondary" disabled={busy} onClick={onAudit}>Jalankan policy checks</Button>}
        {selected.status === "deliberation" && canReview && !["critical", "emergency"].includes(selected.tier) && <>
          <Button disabled={busy} onClick={() => requestAction({ title: "Setujui perubahan?", detail: "Persetujuan akan dicatat pada riwayat musyawarah.", confirmLabel: "Setujui", tone: "primary", endpoint: "/vote", body: { verdict: "affirm" }, successMessage: "Persetujuan dicatat." })}>Setujui</Button>
          <Button variant="secondary" disabled={busy} onClick={() => requestAction({ title: "Minta klarifikasi?", detail: "RFC akan ditandai untuk dilengkapi sebelum dapat ditinjau ulang.", confirmLabel: "Minta klarifikasi", tone: "primary", endpoint: "/vote", body: { verdict: "inquire", notes: "Mohon lengkapi informasi agar dapat ditinjau ulang." }, successMessage: "Permintaan klarifikasi dicatat." })}>Minta klarifikasi</Button>
          <Button variant="secondary" disabled={busy} onClick={() => requestAction({ title: "Tolak perubahan?", detail: "Penolakan akan dicatat pada riwayat keputusan RFC.", confirmLabel: "Tolak perubahan", tone: "danger", endpoint: "/vote", body: { verdict: "dissent", notes: "Usulan tidak disetujui." }, successMessage: "Penolakan dicatat." })}>Tolak</Button>
        </>}
        {["critical", "emergency"].includes(selected.tier) && selected.status === "deliberation" && sovereign && <>
          <Button disabled={busy} onClick={() => requestAction({ title: "Keluarkan dekrit persetujuan?", detail: "Usulan berisiko kritis/darurat akan disetujui melalui kewenangan sovereign.", confirmLabel: "Setujui melalui dekrit", tone: "danger", endpoint: "/decree", body: { verdict: "approve" }, successMessage: "Dekrit persetujuan dicatat." })}>Dekrit setuju</Button>
          <Button variant="secondary" disabled={busy} onClick={() => requestAction({ title: "Veto usulan ini?", detail: "Veto akan mengakhiri deliberasi usulan dan dicatat sebagai keputusan sovereign.", confirmLabel: "Veto usulan", tone: "danger", endpoint: "/decree", body: { verdict: "veto" }, successMessage: "Veto dicatat." })}>Veto</Button>
        </>}
        {selected.status === "approved" && canExecute && <Button disabled={busy} onClick={() => requestAction({ title: "Catat eksekusi RFC?", detail: "Tindakan eksekusi akan ditambahkan ke riwayat perubahan.", confirmLabel: "Catat eksekusi", tone: "primary", endpoint: "/execute", body: {}, successMessage: "Eksekusi dicatat." })}>Tandai selesai</Button>}
        {selected.status === "completed" && canExecute && <Button variant="secondary" disabled={busy} onClick={() => requestAction({ title: "Catat rollback RFC?", detail: "Tindakan pemulihan akan ditambahkan ke riwayat perubahan.", confirmLabel: "Catat rollback", tone: "danger", endpoint: "/rollback", body: {}, successMessage: "Rollback dicatat." })}>Catat rollback</Button>}
      </ReviewActions>
    </> : <p className="muted">Pilih RFC untuk meninjau rincian dan tindakan yang diizinkan.</p>}</div></section>
  </>;
}
