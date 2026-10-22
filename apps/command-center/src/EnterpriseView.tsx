import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { API_PATHS, type ApiRequestOptions } from "@empire/api-contract";
import { Badge, Button, EmptyState, FieldLabel as BaseFieldLabel, Notice, SectionHeading as BaseSectionHeading, SelectField, TextField as BaseTextField } from "@empire/ui";

type Client = { request<T>(path: string, options?: ApiRequestOptions): Promise<T> };
type Row = Record<string, any>;
type PageData = { data?: Row[]; items?: Row[] } | Row[];
const sections = ["CRM", "Catalog", "Sales", "Finance", "Calendar"] as const;
type Section = typeof sections[number];
const money = (value: unknown, currency = "IDR") => new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
const list = (payload: PageData) => Array.isArray(payload) ? payload : payload.data ?? payload.items ?? [];
function FieldLabel({ label, children }: { label: string; children: ReactNode }) { return <BaseFieldLabel><span>{label}</span>{children}</BaseFieldLabel>; }
function TextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <FieldLabel label={label}><BaseTextField {...props} /></FieldLabel>; }
function SectionHeading({ title, description }: { title: ReactNode; description?: string }) { return <BaseSectionHeading title={title} aside={description} />; }

export function EnterpriseView({ client, canWrite }: { client: Client; canWrite: boolean }) {
  const [section, setSection] = useState<Section>("CRM");
  const [salesMode, setSalesMode] = useState<"quotes" | "orders">("quotes");
  const [financeMode, setFinanceMode] = useState<"invoice" | "expense" | "payment">("invoice");
  const [rows, setRows] = useState<Row[]>([]);
  const [partners, setPartners] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setError("");
    try {
      const [partnerData, catalogData] = await Promise.all([
        client.request<PageData>(API_PATHS.businessPartners),
        client.request<PageData>(`${API_PATHS.catalogItems}?limit=100`),
      ]);
      setPartners(list(partnerData)); setItems(list(catalogData));
      const path = section === "CRM" ? API_PATHS.crmOpportunities : section === "Catalog" ? API_PATHS.catalogItems : section === "Sales" ? salesMode === "quotes" ? API_PATHS.salesQuotes : API_PATHS.salesOrders : section === "Finance" ? financeMode === "expense" ? API_PATHS.expenses : API_PATHS.invoices : API_PATHS.activities;
      const data = await client.request<PageData>(`${path}?limit=50`);
      setRows(list(data));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Data operasional gagal dimuat."); }
  }, [client, section, financeMode, salesMode]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const value: Record<string, string> = {};
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]").forEach((element) => { value[element.name] = element.value; });
    setBusy(true); setError(""); setNotice("");
    try {
      if (section === "CRM") await client.request(API_PATHS.crmOpportunities, { method: "POST", body: { ...value, amount: Number(value.amount || 0), probability: Number(value.probability || 0) } });
      else if (section === "Catalog") await client.request(API_PATHS.catalogItems, { method: "POST", body: { ...value, unitPrice: Number(value.unitPrice || 0), taxRate: Number(value.taxRate || 0) } });
      else if (section === "Sales") await client.request(API_PATHS.salesQuotes, { method: "POST", body: { ...value, lines: [{ description: value.description, catalogItemId: value.catalogItemId || undefined, quantity: Number(value.quantity || 1), unitPrice: Number(value.unitPrice || 0), taxRate: Number(value.taxRate || 0) }] } });
      else if (section === "Finance" && financeMode === "invoice") await client.request(API_PATHS.invoices, { method: "POST", body: { ...value, amount: Number(value.amount), dueAt: value.dueAt ? new Date(String(value.dueAt)).toISOString() : null } });
      else if (section === "Finance" && financeMode === "expense") await client.request(API_PATHS.expenses, { method: "POST", body: { ...value, amount: Number(value.amount), incurredAt: value.incurredAt ? new Date(String(value.incurredAt)).toISOString() : new Date().toISOString() } });
      else if (section === "Finance") await client.request(`${API_PATHS.invoices}/${value.invoiceId}/payments`, { method: "POST", body: { ...value, amount: Number(value.amount) } });
      else await client.request(API_PATHS.activities, { method: "POST", body: { ...value, startsAt: new Date(String(value.startsAt)).toISOString(), endsAt: value.endsAt ? new Date(String(value.endsAt)).toISOString() : null } });
      form.reset(); setNotice("Data berhasil disimpan."); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Data gagal disimpan."); }
    finally { setBusy(false); }
  }

  async function transitionQuote(id: string, status: string) {
    setBusy(true); setError(""); setNotice("");
    try { await client.request(`${API_PATHS.salesQuotes}/${id}/transition`, { method: "POST", body: { status } }); setNotice(status === "accepted" ? "Penawaran diterima dan pesanan dibuat." : `Penawaran diperbarui: ${status}.`); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Status penawaran gagal diubah."); }
    finally { setBusy(false); }
  }

  return <section className="enterprise-view">
    <div className="section-tabs" role="tablist" aria-label="Fitur bisnis">{sections.map((name) => <Button key={name} variant={section === name ? "primary" : "secondary"} role="tab" aria-selected={section === name} onClick={() => setSection(name)}>{name}</Button>)}</div>
    {error && <Notice tone="danger">{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
    <div className="enterprise-grid">
      <section className="panel"><SectionHeading title={section === "CRM" ? "Peluang penjualan" : section === "Catalog" ? "Katalog produk & layanan" : section === "Sales" ? salesMode === "quotes" ? "Penawaran" : "Pesanan" : section === "Finance" ? financeMode === "expense" ? "Pengeluaran" : "Invoice operasional" : "Agenda"} description="Data dibatasi ke tenant aktif." />
        {section === "Sales" && <div className="section-tabs" aria-label="Jenis penjualan"><Button variant={salesMode === "quotes" ? "primary" : "secondary"} onClick={() => setSalesMode("quotes")}>Penawaran</Button><Button variant={salesMode === "orders" ? "primary" : "secondary"} onClick={() => setSalesMode("orders")}>Pesanan</Button></div>}
        {rows.length ? <div className="enterprise-list">{rows.map((row) => <article className="enterprise-row" key={row.id}>
          <strong>{row.title ?? row.name ?? row.number ?? row.sku}</strong>
          <span>{section === "CRM" ? `${row.stage} · ${money(row.amount, row.currency)}` : section === "Catalog" ? `${row.kind} · ${money(row.unitPrice, row.currency)}` : section === "Sales" ? `${row.status} · ${money(row.total, row.currency)}` : section === "Finance" ? financeMode === "expense" ? `${row.category} · ${money(row.amount, row.currency)}` : `${row.status} · ${money(row.paidAmount, row.currency)} / ${money(row.amount, row.currency)}` : `${new Date(row.startsAt).toLocaleString()} · ${row.kind}`}</span>
          {section === "Sales" && salesMode === "quotes" && canWrite && row.status === "draft" && <Button variant="secondary" disabled={busy} onClick={() => void transitionQuote(row.id, "sent")}>Kirim</Button>}
          {section === "Sales" && salesMode === "quotes" && canWrite && row.status === "sent" && <><Button variant="secondary" disabled={busy} onClick={() => void transitionQuote(row.id, "accepted")}>Terima & buat pesanan</Button><Button variant="secondary" disabled={busy} onClick={() => void transitionQuote(row.id, "rejected")}>Tolak</Button></>}
        </article>)}</div> : <EmptyState title="Belum ada data" description="Tambahkan data pertama menggunakan formulir." />}
      </section>
      {canWrite && (section !== "Sales" || salesMode === "quotes") && <section className="panel"><SectionHeading title="Tambah data" description="Simpan ke tenant yang sedang dipilih." />
        <form className="enterprise-form" onSubmit={(event) => void submit(event)}>
          {section === "CRM" && <><FieldLabel label="Partner"><SelectField name="partnerId" required defaultValue=""><option value="" disabled>Pilih partner</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField></FieldLabel><TextField label="Nama peluang" name="title" required maxLength={300} /><TextField label="Nilai" name="amount" type="number" min="0" step="0.01" defaultValue="0" /><TextField label="Probabilitas (%)" name="probability" type="number" min="0" max="100" defaultValue="0" /><FieldLabel label="Tahap"><SelectField name="stage" defaultValue="qualified">{["qualified", "proposal", "negotiation", "won", "lost"].map((x) => <option key={x}>{x}</option>)}</SelectField></FieldLabel></>}
          {section === "Catalog" && <><TextField label="SKU" name="sku" required /><TextField label="Nama" name="name" required /><FieldLabel label="Jenis"><SelectField name="kind"><option value="service">Layanan</option><option value="product">Produk</option></SelectField></FieldLabel><TextField label="Harga satuan" name="unitPrice" type="number" min="0" step="0.01" required /><TextField label="Pajak (%)" name="taxRate" type="number" min="0" max="100" defaultValue="0" /></>}
          {section === "Sales" && <><FieldLabel label="Partner"><SelectField name="partnerId" required defaultValue=""><option value="" disabled>Pilih partner</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField></FieldLabel><FieldLabel label="Item katalog"><SelectField name="catalogItemId" defaultValue=""><option value="">Item bebas</option>{items.map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</SelectField></FieldLabel><TextField label="Deskripsi" name="description" required /><TextField label="Jumlah" name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /><TextField label="Harga satuan" name="unitPrice" type="number" min="0" step="0.01" required /><TextField label="Pajak (%)" name="taxRate" type="number" min="0" max="100" defaultValue="0" /></>}
          {section === "Finance" && <><FieldLabel label="Jenis pencatatan"><SelectField value={financeMode} onChange={(e) => setFinanceMode(e.target.value as typeof financeMode)}><option value="invoice">Invoice</option><option value="payment">Pembayaran</option><option value="expense">Pengeluaran</option></SelectField></FieldLabel>{financeMode === "invoice" && <><FieldLabel label="Partner"><SelectField name="partnerId" required defaultValue=""><option value="" disabled>Pilih partner</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField></FieldLabel><TextField label="Nomor invoice" name="number" required /><TextField label="Jumlah tagihan" name="amount" type="number" min="0.01" step="0.01" required /><TextField label="Jatuh tempo" name="dueAt" type="datetime-local" /></>}{financeMode === "expense" && <><TextField label="Kategori" name="category" required /><TextField label="Deskripsi" name="description" required /><TextField label="Jumlah pengeluaran" name="amount" type="number" min="0.01" step="0.01" required /><TextField label="Tanggal" name="incurredAt" type="datetime-local" required /></>}{financeMode === "payment" && <><FieldLabel label="Invoice"><SelectField name="invoiceId" required defaultValue=""><option value="" disabled>Pilih invoice</option>{rows.filter((invoice) => !["paid", "void"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} · sisa {money(Number(invoice.amount) - Number(invoice.paidAmount), invoice.currency)}</option>)}</SelectField></FieldLabel><TextField label="Jumlah pembayaran" name="amount" type="number" min="0.01" step="0.01" required /><TextField label="Metode" name="method" required placeholder="transfer, cash, ..." /><TextField label="Referensi" name="reference" /></>}</>}
          {section === "Calendar" && <><TextField label="Judul" name="title" required /><FieldLabel label="Partner"><SelectField name="partnerId" defaultValue=""><option value="">Tanpa partner</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField></FieldLabel><FieldLabel label="Jenis"><SelectField name="kind">{["meeting", "call", "email", "reminder", "other"].map((x) => <option key={x}>{x}</option>)}</SelectField></FieldLabel><TextField label="Mulai" name="startsAt" type="datetime-local" required /><TextField label="Selesai" name="endsAt" type="datetime-local" /></>}
          <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </form>
      </section>}
    </div>
    <div className="enterprise-note"><Badge tone="info">Pencatatan operasional</Badge><span>Invoice, pembayaran, dan pengeluaran membantu pelacakan bisnis dasar; belum menggantikan buku besar atau sistem akuntansi pajak.</span></div>
  </section>;
}
