import { createHash } from "node:crypto";
import { DictionaryModel, LegacyDictionaryImportModel, hashLegacyDictionaryRow } from "@empire/batteries-base";
import { syncModels } from "@empire/batteries";
import { closeDatabase, initApiDatabase } from "../db.js";

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = process.argv.includes("--dry-run") || !apply;
  if (apply && process.argv.includes("--dry-run")) throw new Error("Choose either --apply or --dry-run, not both.");
  const knex = initApiDatabase();
  try {
    if (!(await knex.schema.hasTable(DictionaryModel.tableName))) throw new Error("Legacy dictionaries table is not installed.");
    const ledgerTablePresent = await knex.schema.hasTable(LegacyDictionaryImportModel.tableName);

    const rows = await knex(DictionaryModel.tableName).orderBy("code", "asc");
    const previous = ledgerTablePresent
      ? await knex(LegacyDictionaryImportModel.tableName).where({ source_table: DictionaryModel.tableName })
      : [];
    const previousById = new Map(previous.map((row: Record<string, unknown>) => [String(row.legacy_source_id), row]));
    const hashes = rows.map((row: Record<string, unknown>) => ({ id: String(row.id), hash: hashLegacyDictionaryRow(row) }));
    const batchId = createHash("sha256").update(stable(hashes)).digest("hex");
    const pending = rows.filter((row: Record<string, unknown>) => !previousById.has(String(row.id)));
    const stale = rows.filter((row: Record<string, unknown>) => {
      const prior = previousById.get(String(row.id));
      return prior && prior.source_hash !== hashLegacyDictionaryRow(row);
    });
    const vanished = previous.filter((row: Record<string, unknown>) => !rows.some((source: Record<string, unknown>) => String(source.id) === String(row.legacy_source_id)));

    if (stale.length) throw new Error(`${stale.length} source row(s) changed after an earlier import. No rows were written; review the source changes before continuing.`);
    if (vanished.length) throw new Error(`${vanished.length} previously imported source row(s) are no longer present. No rows were written; preserve and reconcile them before continuing.`);

    console.log(JSON.stringify({
      mode: dryRun ? "dry-run" : "apply",
      ledgerTablePresent,
      sourceTable: DictionaryModel.tableName,
      sourceRows: rows.length,
      existingLedgerRows: previous.length,
      pendingRows: pending.length,
      changedRows: 0,
      vanishedRows: 0,
      batchId,
      sourceSetHash: hashLegacyDictionaryRow(hashes),
      policy: "copy-only; preserve raw snapshot; no semantic matching; all entries remain unreviewed",
    }, null, 2));
    if (dryRun || pending.length === 0) return;

    await knex.transaction(async (trx) => {
      if (!(await trx.schema.hasTable(LegacyDictionaryImportModel.tableName))) {
        await syncModels(trx, [LegacyDictionaryImportModel]);
      }
      for (const row of pending as Array<Record<string, unknown>>) {
        const sourceHash = hashLegacyDictionaryRow(row);
        await trx(LegacyDictionaryImportModel.tableName).insert({
          id: row.id,
          source_table: DictionaryModel.tableName,
          legacy_source_id: String(row.id),
          legacy_code: String(row.code),
          source_hash: sourceHash,
          batch_id: batchId,
          source_snapshot: row,
          canonical_proposal: {
            status: "DRAFT_REVIEW",
            targetConceptId: null,
            languageTag: null,
            domain: null,
            exactMatch: false,
            requiresHumanReview: true,
            legacyFields: {
              code: row.code,
              term: row.term,
              revelationOrigin: row.revelation_origin,
              frequencyDomain: row.frequency_domain,
              esotericDefinition: row.esoteric_definition,
              category: row.category,
            },
          },
          review_status: "unreviewed",
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        }).onConflict(["source_table", "legacy_source_id"]).ignore();
      }
    });
    console.log(`Applied copy-only import: ${pending.length} row(s); source table remains intact.`);
  } finally {
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
