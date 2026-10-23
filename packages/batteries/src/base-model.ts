import { Model, snakeCaseMappers, type ModelOptions, type QueryContext } from "objection";
import { v7 as uuidv7 } from "uuid";
import { BatteriesQueryBuilder } from "./query-builder.js";
import type { FieldDefinition } from "./types.js";

export abstract class BatteriesModel extends Model {
  declare QueryBuilderType: BatteriesQueryBuilder<this>;
  static override QueryBuilder = BatteriesQueryBuilder;

  /**
   * Automatic snake_case (Postgres DB) <-> camelCase (TypeScript Models)
   */
  static override columnNameMappers = snakeCaseMappers();

  /**
   * Flag enabling soft-delete query scoping
   */
  static hasSoftDelete = true;

  /**
   * Declarative fields schema (like Odoo models - zero migration files needed)
   */
  static fields: Record<string, FieldDefinition> = {};

  /** Declarative multi-column uniqueness; fields use camelCase model names. */
  static uniqueConstraints: string[][] = [];

  /** Declarative multi-column foreign keys; both sides use model field names in camelCase. */
  static foreignConstraints: Array<{
    columns: string[];
    references: { table: string; columns: string[]; onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" };
  }> = [];

  static override get jsonAttributes(): string[] {
    return Object.entries(this.fields)
      .filter(([_, def]) => def.type === "jsonb")
      .map(([name]) => name);
  }

  id!: string;
  createdAt!: string;
  updatedAt!: string;
  deletedAt?: string | null;

  override async $beforeInsert(queryContext: QueryContext): Promise<void> {
    await super.$beforeInsert(queryContext);

    // Auto-generate UUIDv7 (time-sortable, secure, high-performance for Postgres B-Tree)
    if (!this.id) {
      this.id = uuidv7();
    }

    const now = new Date().toISOString();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    if (!this.updatedAt) {
      this.updatedAt = now;
    }
  }

  override async $beforeUpdate(opt: ModelOptions, queryContext: QueryContext): Promise<void> {
    await super.$beforeUpdate(opt, queryContext);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark record as soft deleted
   */
  async softDelete(): Promise<this> {
    return (this.$query() as unknown as BatteriesQueryBuilder<this>).patchAndFetchById(this.id, {
      deletedAt: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any) as unknown as Promise<this>;
  }

  /**
   * Restore a soft deleted record
   */
  async restore(): Promise<this> {
    return (this.$query() as unknown as BatteriesQueryBuilder<this>)
      .withDeleted()
      .patchAndFetchById(this.id, {
        deletedAt: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any) as unknown as Promise<this>;
  }
}
