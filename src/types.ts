import type { Column, SQL } from "drizzle-orm";
import type {
  SQLiteTableWithColumns,
  SQLiteColumn,
} from "drizzle-orm/sqlite-core";
import type { PgTableWithColumns, PgColumn } from "drizzle-orm/pg-core";
import type {
  MySqlTableWithColumns,
  MySqlColumn,
} from "drizzle-orm/mysql-core";
import type { z } from "zod";

export type JsonField = { _type: "json" };
export type ColumnWithMeta = Column & { meta?: JsonField };

export type SupportedDialects = "sqlite" | "postgres" | "mysql";

export interface UniqueConstraintOptions {
  name?: string;
  nulls?: "distinct" | "not distinct";
}

export interface ColumnCheckConstraint {
  name: string;
  expression: (
    column: DrizzleColumn,
    columns: Record<string, DrizzleColumn>,
  ) => SQL;
}

export interface ColumnConstraintOptions<TValue = unknown> {
  default?: TValue | SQL;
  notNull?: boolean;
  unique?: boolean | string | UniqueConstraintOptions;
  checks?: ColumnCheckConstraint | ColumnCheckConstraint[];
}

export type ColumnConstraints<T extends z.ZodTypeAny> = Partial<{
  [K in keyof z.infer<T>]: ColumnConstraintOptions<z.infer<T>[K]>;
}>;

export interface TableOptions<T extends z.ZodTypeAny> {
  primaryKey?: keyof z.infer<T>;
  dialect?: SupportedDialects;
  constraints?: ColumnConstraints<T>;
  references?: Array<{
    table: DrizzleTable;
    columns: [keyof z.infer<T>, string][];
    onDelete?: "cascade" | "restrict" | "set null" | "no action"; // does nothing for now
  }>;
}

export type DrizzleColumn = SQLiteColumn | PgColumn | MySqlColumn;
export type DrizzleTable =
  | SQLiteTableWithColumns<any>
  | PgTableWithColumns<any>
  | MySqlTableWithColumns<any>;
