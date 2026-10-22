import { QueryBuilder, type Model, type Page } from "objection";
import type { PaginatedResult, PaginationParams, FilterValue } from "./types.js";

export class BatteriesQueryBuilder<M extends Model, R = M[]> extends QueryBuilder<M, R> {
  declare ArrayQueryBuilderType: BatteriesQueryBuilder<M, M[]>;
  declare SingleQueryBuilderType: BatteriesQueryBuilder<M, M>;
  declare NumberQueryBuilderType: BatteriesQueryBuilder<M, number>;
  declare PageQueryBuilderType: BatteriesQueryBuilder<M, Page<M>>;

  private _includeDeleted = false;
  private _onlyDeleted = false;

  /**
   * Include soft-deleted records in the query
   */
  withDeleted(): this {
    this._includeDeleted = true;
    return this;
  }

  /**
   * Query ONLY soft-deleted records
   */
  onlyDeleted(): this {
    this._onlyDeleted = true;
    return this;
  }

  /**
   * Smart pagination returning clean data and metadata
   */
  async paginate(params?: PaginationParams): Promise<PaginatedResult<M>> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 20));

    const result = await this.page(page - 1, limit);
    const totalPages = Math.ceil(result.total / limit);

    return {
      data: result.results as unknown as M[],
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Smart dynamic filtering from query parameters
   */
  filter(filters: Record<string, FilterValue | undefined>): this {
    for (const [column, rawValue] of Object.entries(filters)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        continue;
      }

      if (typeof rawValue === "object" && !Array.isArray(rawValue)) {
        if ("eq" in rawValue && rawValue.eq !== undefined) this.where(column, "=", rawValue.eq);
        if ("ne" in rawValue && rawValue.ne !== undefined) this.where(column, "!=", rawValue.ne);
        if ("like" in rawValue && rawValue.like) this.whereLike(column, `%${rawValue.like}%`);
        if ("ilike" in rawValue && rawValue.ilike) this.whereILike(column, `%${rawValue.ilike}%`);
        if ("gt" in rawValue && rawValue.gt !== undefined) this.where(column, ">", rawValue.gt);
        if ("gte" in rawValue && rawValue.gte !== undefined) this.where(column, ">=", rawValue.gte);
        if ("lt" in rawValue && rawValue.lt !== undefined) this.where(column, "<", rawValue.lt);
        if ("lte" in rawValue && rawValue.lte !== undefined) this.where(column, "<=", rawValue.lte);
        if ("isNull" in rawValue && rawValue.isNull) this.whereNull(column);
        if ("isNotNull" in rawValue && rawValue.isNotNull) this.whereNotNull(column);

        if ("in" in rawValue && rawValue.in) {
          const list = Array.isArray(rawValue.in)
            ? rawValue.in
            : String(rawValue.in)
                .split(",")
                .map((s) => s.trim());
          this.whereIn(column, list);
        }

        if ("nin" in rawValue && rawValue.nin) {
          const list = Array.isArray(rawValue.nin)
            ? rawValue.nin
            : String(rawValue.nin)
                .split(",")
                .map((s) => s.trim());
          this.whereNotIn(column, list);
        }
      } else {
        this.where(column, "=", rawValue);
      }
    }

    return this;
  }

  /**
   * Fuzzy search across multiple columns
   */
  search(columns: string[], term: string): this {
    if (!term || columns.length === 0) return this;

    const trimmed = term.trim();
    if (!trimmed) return this;

    return this.where((builder) => {
      columns.forEach((col, idx) => {
        if (idx === 0) {
          builder.whereILike(col, `%${trimmed}%`);
        } else {
          builder.orWhereILike(col, `%${trimmed}%`);
        }
      });
    });
  }

  /**
   * Hook executed before query run to apply soft-delete scoping
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override execute(): any {
    const modelClass = this.modelClass() as unknown as {
      hasSoftDelete?: boolean;
      tableName?: string;
    };
    if (modelClass.hasSoftDelete && modelClass.tableName) {
      const table = modelClass.tableName;
      const column = `${table}.deleted_at`;

      if (this._onlyDeleted) {
        this.whereNotNull(column);
      } else if (!this._includeDeleted) {
        this.whereNull(column);
      }
    }

    return super.execute();
  }
}
