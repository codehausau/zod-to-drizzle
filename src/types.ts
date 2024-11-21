import type { Column } from "drizzle-orm";
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

export interface TableOptions<T extends z.ZodTypeAny> {
  primaryKey?: keyof z.infer<T>;
  dialect?: SupportedDialects;
}

export type DrizzleColumn = SQLiteColumn | PgColumn | MySqlColumn;
export type DrizzleTable =
  | SQLiteTableWithColumns<any>
  | PgTableWithColumns<any>
  | MySqlTableWithColumns<any>;
