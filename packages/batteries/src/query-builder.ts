import { QueryBuilder, type Model, type Page } from "objection";
import type { PaginatedResult, PaginationParams, FilterValue } from "./types.js";

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function escapeLikePattern(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

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
    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);

    return {
      data: result.results as unknown as M[],
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: result.total > 0 && page > 1,
      },
    };
  }

  /**
   * Smart dynamic filtering from query parameters
   */
  filter(filters: Record<string, FilterValue | undefined>): this {
    for (const [rawColumn, rawValue] of Object.entries(filters)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        continue;
      }

      const column = rawColumn.includes(".")
        ? rawColumn
            .split(".")
            .map((part, index) => (index === 0 ? part : camelToSnake(part)))
            .join(".")
        : camelToSnake(rawColumn);

      if (typeof rawValue === "object" && !Array.isArray(rawValue)) {
        if ("eq" in rawValue) {
          if (rawValue.eq === null) this.whereNull(column);
          else if (rawValue.eq !== undefined) this.where(column, "=", rawValue.eq);
        }
        if ("ne" in rawValue) {
          if (rawValue.ne === null) this.whereNotNull(column);
          else if (rawValue.ne !== undefined) this.where(column, "!=", rawValue.ne);
        }
        if ("like" in rawValue && rawValue.like) this.whereLike(column, `%${rawValue.like}%`);
        if ("ilike" in rawValue && rawValue.ilike) this.whereILike(column, `%${rawValue.ilike}%`);
        if ("gt" in rawValue && rawValue.gt !== undefined) this.where(column, ">", rawValue.gt);
        if ("gte" in rawValue && rawValue.gte !== undefined) this.where(column, ">=", rawValue.gte);
        if ("lt" in rawValue && rawValue.lt !== undefined) this.where(column, "<", rawValue.lt);
        if ("lte" in rawValue && rawValue.lte !== undefined) this.where(column, "<=", rawValue.lte);
        if ("isNull" in rawValue) {
          if (rawValue.isNull) this.whereNull(column);
          else this.whereNotNull(column);
        }
        if ("isNotNull" in rawValue) {
          if (rawValue.isNotNull) this.whereNotNull(column);
          else this.whereNull(column);
        }

        if ("in" in rawValue && rawValue.in) {
          const list = Array.isArray(rawValue.in)
            ? rawValue.in
            : String(rawValue.in)
                .split(",")
                .map((s) => s.trim());
          if (list.length > 0) this.whereIn(column, list);
        }

        if ("nin" in rawValue && rawValue.nin) {
          const list = Array.isArray(rawValue.nin)
            ? rawValue.nin
            : String(rawValue.nin)
                .split(",")
                .map((s) => s.trim());
          if (list.length > 0) this.whereNotIn(column, list);
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
    const escaped = escapeLikePattern(trimmed);

    return this.where((builder) => {
      columns.forEach((rawCol, idx) => {
        const col = rawCol.includes(".")
          ? rawCol
              .split(".")
              .map((part, index) => (index === 0 ? part : camelToSnake(part)))
              .join(".")
          : camelToSnake(rawCol);

        if (idx === 0) {
          builder.whereILike(col, `%${escaped}%`);
        } else {
          builder.orWhereILike(col, `%${escaped}%`);
        }
      });
    });
  }

  private _applySoftDeleteScoping(): void {
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
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override toKnexQuery(): any {
    this._applySoftDeleteScoping();
    return super.toKnexQuery();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override execute(): any {
    this._applySoftDeleteScoping();
    return super.execute();
  }
}
