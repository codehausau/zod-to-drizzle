// src/dialects/postgres.ts
import { integer, text, boolean as pgBoolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { DialectHandler } from "./base";
import type { ColumnWithMeta, TableOptions } from "../types";
import { z } from "zod";

export class PostgresHandler extends DialectHandler {
  /**
   * TEXT column, optionally with FK. Adds .notNull() when not optional.
   */
  string(
    isOptional: boolean,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    const column = refs
      ? text().references(() => {
          const table = refs[0]?.table;
          const columnName = refs[0]?.columns[0]?.[1] ?? "";
          return table?.[columnName];
        })
      : text();

    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * INTEGER column (typical PG choice for ints here), respects FK and default presence.
   * If optional OR has a default, we don’t force notNull().
   */
  int(
    isOptional: boolean,
    hasDefault = false,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    const column = refs
      ? integer().references(() => {
          const table = refs[0]?.table;
          const columnName = refs[0]?.columns[0]?.[1] ?? "";
          return table?.[columnName];
        })
      : integer();

    return isOptional || hasDefault
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * DOUBLE column (typical PG choice for numbers here), respects FK and default presence.
   * If optional OR has a default, we don’t force notNull().
   */
  number(
    isOptional: boolean,
    hasDefault = false,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    const column = refs
      ? doublePrecision().references(() => {
          const table = refs[0]?.table;
          const columnName = refs[0]?.columns[0]?.[1] ?? "";
          return table?.[columnName];
        })
      : doublePrecision();

    return isOptional || hasDefault
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * BOOLEAN column (native PG boolean). Same nullability rule as number().
   */
  boolean(isOptional: boolean, hasDefault = false): ColumnWithMeta {
    const column = pgBoolean();
    return isOptional || hasDefault
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * JSONB column (preferred JSON storage in PG). Adds .notNull() when not optional.
   */
  json(isOptional: boolean): ColumnWithMeta {
    const column = jsonb();
    const finalColumn = isOptional
      ? column
      : (column.notNull() as unknown as ColumnWithMeta);
    // (finalColumn as any).meta = { _type: "jsonb" }; // enable if you want downstream hints
    return finalColumn as unknown as ColumnWithMeta;
  }

  /**
   * TIMESTAMP column (without timezone). If you prefer timestamptz, swap to: timestamp({ withTimezone: true }).
   */
  date(isOptional: boolean): ColumnWithMeta {
    const column = timestamp({ withTimezone: false });
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * String-backed enum: store as TEXT.
   */
  enum(isOptional: boolean): ColumnWithMeta {
    const column = text();
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * “Native” enum: we map to INTEGER (numeric code) to mirror your SQLite handler.
   * If you later want real PG enums, you’d need the enum name & values up-front (via pgEnum()).
   */
  nativeEnum(isOptional: boolean): ColumnWithMeta {
    const column = integer();
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  /**
   * Primary key selection:
   * - z.string() -> TEXT primary key
   * - otherwise  -> INTEGER primary key (note: PG autoincrement is SERIAL/IDENTITY; see note below)
   */
  primaryKey(zodType: z.ZodType): ColumnWithMeta {
    if (zodType instanceof z.ZodString) {
      return text().primaryKey() as unknown as ColumnWithMeta;
    }
    // Drizzle PG “true” auto-increment is usually serial()/bigserial() or identity.
    // If your pipeline relies on auto-increment, consider swapping to `serial()` here.
    return integer().primaryKey().generatedAlwaysAsIdentity() as unknown as ColumnWithMeta;
  }
}
