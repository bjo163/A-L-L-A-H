import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { API_PATHS, type ApiRequestOptions } from "@empire/api-contract";
import { Badge, Button, EmptyState, FieldLabel, Notice, SectionHeading, SelectField, TextArea, TextField } from "@empire/ui";

type Client = { request<T>(path: string, options?: ApiRequestOptions): Promise<T> };
type Props = { client: Client; apiOrigin: string; onUpload: (path: string, file: Blob) => Promise<unknown> };
type Row = Record<string, any>;

export function CollaborationView({ client, apiOrigin, onUpload }: Props) {
  const [entityType, setEntityType] = useState("task");
  const [entityId, setEntityId] = useState("");
  const [comments, setComments] = useState<Row[]>([]);
  const [tags, setTags] = useState<Row[]>([]);
  const [assignments, setAssignments] = useState<Row[]>([]);
  const [activity, setActivity] = useState<Row[]>([]);
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [comment, setComment] = useState("");
  const [tagName, setTagName] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [events, inbox, labels] = await Promise.all([
        client.request<{ items: Row[] }>(`${API_PATHS.activity}?limit=30`),
        client.request<{ items: Row[] }>(API_PATHS.notifications),
        client.request<{ items: Row[] }>(API_PATHS.tags),
      ]);
      setActivity(events.items ?? []); setNotifications(inbox.items ?? []); setTags(labels.items ?? []);
      if (!selectedTagId && labels.items?.length) setSelectedTagId(labels.items[0]!.id);
      if (entityType === "project" && entityId) {
        const docs = await client.request<{ items: Row[] }>(`${API_PATHS.documents}?projectId=${encodeURIComponent(entityId)}`);
        setDocuments(docs.items ?? (docs as Row).data ?? []);
      } else setDocuments([]);
      if (entityId) {
        const query = `?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`;
        const [notes, links] = await Promise.all([
          client.request<{ items: Row[] }>(`${API_PATHS.comments}${query}`),
          client.request<{ items: Row[] }>(`${API_PATHS.tagAssignments}${query}`),
        ]);
        setComments(notes.items ?? []); setAssignments(links.items ?? []);
      } else { setComments([]); setAssignments([]); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Data kolaborasi tidak dapat dimuat."); }
  }, [client, entityId, entityType, selectedTagId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); await refresh(); setNotice(successMessage); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Aksi gagal."); }
    finally { setBusy(false); }
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    await submit(async () => { await client.request(API_PATHS.comments, { method: "POST", body: { entityType, entityId, body: comment } }); setComment(""); }, "Komentar ditambahkan.");
  }
  async function addTag(event: FormEvent) {
    event.preventDefault();
    await submit(async () => { const row = await client.request<Row>(API_PATHS.tags, { method: "POST", body: { name: tagName } }); setTagName(""); if (entityId) await client.request(API_PATHS.tagAssignments, { method: "POST", body: { tagId: row.id, entityType, entityId } }); }, "Label dibuat dan dipasang.");
  }
  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setError("Pilih file terlebih dahulu."); return; }
    if (!entityId || entityType !== "project") { setError("Isi ID project untuk melampirkan file."); return; }
    await submit(async () => {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
      const doc = await client.request<Row>(API_PATHS.documents, { method: "POST", body: { projectId: entityId, title: file.name, fileName: file.name, storageProvider: "pending", storageKey: "pending", mediaType: file.type || "application/octet-stream", sizeBytes: file.size, sha256 } });
      await onUpload(`${API_PATHS.documents}/${doc.id}/content`, file);
      form.reset();
    }, "File diunggah ke penyimpanan privat.");
  }

  return <section className="collaboration-view">
    {error && <Notice tone="danger">{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
    <div className="collab-target panel"><div><span className="eyebrow">RECORD CONTEXT</span><h2>Kolaborasi record</h2><p>Pilih jenis record dan ID untuk membaca komentar dan label pada tenant aktif.</p></div><div className="collab-target-fields"><FieldLabel>Jenis record<SelectField value={entityType} onChange={(event) => setEntityType(event.target.value)}>{["workspace", "project", "task", "document", "partner"].map((type) => <option key={type}>{type}</option>)}</SelectField></FieldLabel><FieldLabel>ID record<TextField value={entityId} onChange={(event) => setEntityId(event.target.value.trim())} placeholder="UUID record" /></FieldLabel><Button variant="secondary" onClick={() => void refresh()}>Muat record</Button></div></div>
    <div className="collab-grid">
      <section className="panel"><SectionHeading layout="compact" eyebrow="DISCUSSION" title="Komentar" aside={<Badge tone="neutral">{comments.length}</Badge>} />
        {comments.length ? <ol className="collab-list">{comments.map((row) => <li key={row.id}><p>{row.body}</p><small>{row.authorId} · {new Date(row.createdAt).toLocaleString()}</small></li>)}</ol> : <EmptyState title="Belum ada komentar" description="Pilih record yang dapat Anda akses untuk melihat diskusinya." />}
        <form className="form-grid" onSubmit={(event) => void addComment(event)}><FieldLabel>Tambah komentar<TextArea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={10000} required /></FieldLabel><Button disabled={busy || !entityId || !comment.trim()}>Kirim komentar</Button></form>
      </section>
      <section className="panel"><SectionHeading layout="compact" eyebrow="CLASSIFICATION" title="Label" aside={<Badge tone="neutral">{assignments.length}</Badge>} />
        {assignments.length ? <ul className="collab-tags">{assignments.map((row) => { const tag = tags.find((item) => item.id === row.tagId); return <li key={row.id}><Badge tone="info">{tag?.name ?? row.tagId}</Badge><Button variant="secondary" disabled={busy} onClick={() => void submit(() => client.request(`${API_PATHS.tagAssignments}/${row.id}`, { method: "DELETE" }), "Label dilepas.")}>Lepas</Button></li>; })}</ul> : <EmptyState title="Belum ada label" description="Label tenant dapat dipasang pada record yang dipilih." />}
        {tags.length > 0 && <div className="collab-assign-tag"><FieldLabel>Pasang label yang ada<SelectField value={selectedTagId} onChange={(event) => setSelectedTagId(event.target.value)}>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</SelectField></FieldLabel><Button variant="secondary" disabled={busy || !entityId || !selectedTagId} onClick={() => void submit(() => client.request(API_PATHS.tagAssignments, { method: "POST", body: { tagId: selectedTagId, entityType, entityId } }), "Label dipasang.")}>Pasang</Button></div>}
        <form className="form-grid" onSubmit={(event) => void addTag(event)}><FieldLabel>Buat label<TextField value={tagName} onChange={(event) => setTagName(event.target.value)} maxLength={100} required /></FieldLabel><Button disabled={busy || !entityId || !tagName.trim()}>Buat & pasang</Button></form>
      </section>
      <section className="panel"><SectionHeading layout="compact" eyebrow="INBOX" title="Notifikasi" aside={<Badge tone="neutral">{notifications.filter((row) => !row.readAt).length} belum dibaca</Badge>} />
        {notifications.length ? <ul className="collab-list">{notifications.map((row) => <li key={row.id}><strong>{row.title}</strong><p>{row.body}</p><small>{new Date(row.createdAt).toLocaleString()}</small>{!row.readAt && <Button variant="secondary" onClick={() => void submit(() => client.request(`${API_PATHS.notifications}/${row.id}/read`, { method: "PATCH", body: {} }), "Notifikasi ditandai sudah dibaca.")}>Tandai dibaca</Button>}{row.actionUrl && <a href={row.actionUrl}>{row.actionUrl}</a>}</li>)}</ul> : <EmptyState title="Inbox kosong" description="Notifikasi komentar akan muncul di sini." />}
      </section>
      <section className="panel"><SectionHeading layout="compact" eyebrow="AUDIT STREAM" title="Aktivitas tenant" aside={<Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>} />
        {activity.length ? <ul className="collab-list">{activity.map((row) => <li key={row.id}><strong>{String(row.action).replaceAll("_", " ")}</strong><p>{row.entity} · {row.entityId ?? ""}</p><small>{new Date(row.createdAt).toLocaleString()}</small></li>)}</ul> : <EmptyState title="Belum ada aktivitas" description="Aktivitas tenant akan dicatat saat fitur kolaborasi digunakan." />}
      </section>
      <section className="panel"><span className="eyebrow">PRIVATE FILES</span><h2>Unggah dokumen</h2><p>Unggah untuk project terpilih. File disimpan privat dan hanya dilayani sebagai unduhan.</p>
        <form className="form-grid" onSubmit={(event) => void uploadFile(event)}><FieldLabel>File<TextField name="file" type="file" required /></FieldLabel><Button disabled={busy || entityType !== "project" || !entityId}>Unggah file</Button></form>
        <small>Tautan unduh bertanda tangan berlaku 10 menit.</small>
        {documents.length > 0 && <ul className="collab-list">{documents.map((doc) => <li key={doc.id}><strong>{doc.title}</strong><p>{doc.fileName} · {doc.sizeBytes} bytes · {doc.classification}</p><Button variant="secondary" disabled={busy || doc.storageProvider !== "local-private"} onClick={() => void submit(async () => { const result = await client.request<{ url: string }>(`${API_PATHS.documents}/${doc.id}/download-link`, { method: "POST", body: {} }); setDownloadUrl(new URL(result.url, apiOrigin).toString()); }, "Tautan unduh siap digunakan.")}>Buat tautan unduh</Button></li>)}</ul>}
        {downloadUrl && <a className="document-download-link" href={downloadUrl} target="_blank" rel="noreferrer">Unduh file dengan tautan sementara</a>}
      </section>
    </div>
  </section>;
}
