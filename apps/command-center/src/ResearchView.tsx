import type { FormEventHandler } from "react";
import type { ResearchRun, createApiClient } from "@empire/api-contract";
import { Button, EmptyState, ErrorState, FieldLabel, LoadingState, SelectField, TextArea, TextField } from "@empire/ui";
import { ResearchCard, type ResearchConfirmationRequest } from "./ResearchCard";

export type ResearchDraft = { title: string; question: string; scope: ResearchRun["scope"] };
type ApiClient = ReturnType<typeof createApiClient>;

type ResearchViewProps = {
  draft: ResearchDraft;
  runs: readonly ResearchRun[];
  busy: boolean;
  loading: boolean;
  error: string;
  searching: boolean;
  canWrite: boolean;
  canApprove: boolean;
  client: ApiClient;
  refreshKey?: string;
  onDraftChange: (draft: ResearchDraft) => void;
  onCreate: FormEventHandler<HTMLFormElement>;
  onRefresh: () => void;
  onAction: (action: () => Promise<unknown>, message: string) => Promise<void>;
  onConfirmAction: (request: ResearchConfirmationRequest) => void;
};

export function ResearchView({ draft, runs, busy, loading, error, searching, canWrite, canApprove, client, refreshKey, onDraftChange, onCreate, onRefresh, onAction, onConfirmAction }: ResearchViewProps) {
  return <>
    {canWrite && <section><h2>Ajukan riset</h2><form className="form-grid form-card" onSubmit={onCreate}>
      <FieldLabel>Judul<TextField required minLength={3} value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} /></FieldLabel>
      <FieldLabel>Pertanyaan riset<TextArea required minLength={10} value={draft.question} onChange={(event) => onDraftChange({ ...draft, question: event.target.value })} /></FieldLabel>
      <FieldLabel>Cakupan<SelectField value={draft.scope} onChange={(event) => onDraftChange({ ...draft, scope: event.target.value as ResearchDraft["scope"] })}><option value="self">Self</option><option value="community">Community</option><option value="global">Global</option></SelectField></FieldLabel>
      <Button type="submit" disabled={busy}>Kirim untuk persetujuan</Button>
    </form></section>}
    <section>
      <div className="section-head"><h2>Daftar research run</h2><Button variant="secondary" disabled={loading} onClick={onRefresh}>Muat ulang</Button></div>
      {runs.length > 0 ? <div className="research-list">{runs.map((run) => <ResearchCard key={run.id} run={run} canApprove={canApprove} canWrite={canWrite} client={client} busy={busy} onAction={onAction} onConfirmAction={onConfirmAction} refreshKey={refreshKey} />)}</div>
        : loading ? <LoadingState label="Memuat daftar riset…" />
          : error ? <ErrorState role="region" title="Daftar riset tidak tersedia" description="Muat ulang daftar untuk mencoba kembali." action={<Button variant="secondary" onClick={onRefresh}>Coba lagi</Button>} />
            : <EmptyState title={searching ? "No research runs match" : "Belum ada riset"} description={searching ? "Try a different search term." : "Belum ada research run pada tenant ini."} />}
    </section>
  </>;
}
