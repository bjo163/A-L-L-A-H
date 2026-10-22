import { getDatabase, type FilterValue } from "@empire/batteries";
import { createHash } from "node:crypto";
import { DictionaryModel, LegacyDictionaryImportModel } from "../models/index.js";

const sourceTable = DictionaryModel.tableName;
type Snapshot = Record<string, unknown>;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function hashLegacyDictionaryRow(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function toModelShape(snapshot: Snapshot): Snapshot {
  return Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()), value]));
}

function matches(value: unknown, filter: FilterValue): boolean {
  if (filter === null || typeof filter !== "object") return String(value ?? "") === String(filter ?? "");
  const actual = String(value ?? "");
  if (filter.eq !== undefined && actual !== String(filter.eq)) return false;
  if (filter.ne !== undefined && actual === String(filter.ne)) return false;
  if (filter.like !== undefined && !actual.includes(filter.like.replaceAll("%", ""))) return false;
  if (filter.ilike !== undefined && !actual.toLowerCase().includes(filter.ilike.replaceAll("%", "").toLowerCase())) return false;
  if (filter.in !== undefined) {
    const values = Array.isArray(filter.in) ? filter.in.map(String) : filter.in.split(",").map((part) => part.trim());
    if (!values.includes(actual)) return false;
  }
  if (filter.nin !== undefined) {
    const values = Array.isArray(filter.nin) ? filter.nin.map(String) : filter.nin.split(",").map((part) => part.trim());
    if (values.includes(actual)) return false;
  }
  const number = Number(value);
  if (filter.gt !== undefined && !(number > Number(filter.gt))) return false;
  if (filter.gte !== undefined && !(number >= Number(filter.gte))) return false;
  if (filter.lt !== undefined && !(number < Number(filter.lt))) return false;
  if (filter.lte !== undefined && !(number <= Number(filter.lte))) return false;
  if (filter.isNull && value !== null && value !== undefined) return false;
  if (filter.isNotNull && (value === null || value === undefined)) return false;
  return true;
}

/** Read the ledger only when it is a hash-verified mirror; otherwise use the live legacy source. */
async function verifiedSnapshots(): Promise<Snapshot[] | null> {
  const sourceRows = await getDatabase()(sourceTable).orderBy("code", "asc");
  const imports = await LegacyDictionaryImportModel.query().where({ source_table: sourceTable });
  if (sourceRows.length !== imports.length) return null;
  const importedById = new Map(imports.map((item) => [item.legacySourceId, item]));
  const snapshots: Snapshot[] = [];
  for (const source of sourceRows) {
    const entry = importedById.get(source.id);
    if (!entry || entry.legacyCode !== source.code || entry.sourceHash !== hashLegacyDictionaryRow(source)) return null;
    if (!source.deleted_at) snapshots.push(toModelShape(entry.sourceSnapshot as Snapshot));
  }
  return snapshots;
}

export class LegacyDictionaryCompatibilityService {
  static async list(filters: Record<string, FilterValue | undefined> = {}) {
    const snapshots = await verifiedSnapshots();
    if (!snapshots) return DictionaryModel.query().filter(filters);
    return snapshots.filter((row) => Object.entries(filters).every(([key, value]) => value === undefined || value === null || value === "" || matches(row[key], value)));
  }

  static async findByCode(code: string) {
    const snapshots = await verifiedSnapshots();
    if (!snapshots) return DictionaryModel.query().where({ code }).first();
    return snapshots.find((row) => row.code === code) ?? null;
  }
}
