import type { Knex } from "knex";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type FilterValue =
  | string
  | number
  | boolean
  | null
  | {
      eq?: string | number | boolean;
      ne?: string | number | boolean;
      like?: string;
      ilike?: string;
      in?: Array<string | number> | string;
      nin?: Array<string | number> | string;
      gt?: string | number;
      gte?: string | number;
      lt?: string | number;
      lte?: string | number;
      isNull?: boolean;
      isNotNull?: boolean;
    };

export interface DatabaseConfig {
  client?: "pg";
  connection: string | Knex.PgConnectionConfig;
  pool?: {
    min?: number;
    max?: number;
  };
  debug?: boolean;
}

export type FieldType =
  "string" | "text" | "integer" | "bigint" | "boolean" | "jsonb" | "timestamp" | "uuid" | "float";

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultTo?: any;
  nullable?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  };
}
