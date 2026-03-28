import { check, integer, text } from "drizzle-orm/sqlite-core";
import { DialectHandler } from "./base";
import type {
  ColumnConstraintOptions,
  ColumnWithMeta,
  TableOptions,
} from "../types";
import { z } from "zod";
import { doublePrecision } from "drizzle-orm/gel-core";
import type { SQL } from "drizzle-orm";

export class SQLiteHandler extends DialectHandler {
  string(
    isOptional: boolean,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    const column = refs
      ? text().references(() => {
          const table = refs[0]?.table;
          const column = refs[0]?.columns[0]?.[1] ?? "";
          return table?.[column];
        })
      : text();
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  uuidString(
    isOptional: boolean,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    return this.string(isOptional, refs);
  }

  datetimeString(
    isOptional: boolean,
    _withTimezone: boolean,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    return this.string(isOptional, refs);
  }

  int(
    isOptional: boolean,
    hasDefault = false,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    const column = refs
      ? integer().references(() => {
          const table = refs[0]?.table;
          const column = refs[0]?.columns[0]?.[1] ?? "";
          return table?.[column];
        })
      : integer();
    return isOptional || hasDefault
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  number(
    isOptional: boolean,
    hasDefault = false,
    refs?: TableOptions<any>["references"],
  ): ColumnWithMeta {
    const column = refs
      ? doublePrecision().references(() => {
          const table = refs[0]?.table;
          const column = refs[0]?.columns[0]?.[1] ?? "";
          return table?.[column];
        })
      : doublePrecision();
    return isOptional || hasDefault
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  boolean(isOptional: boolean, hasDefault = false): ColumnWithMeta {
    const column = integer();
    return isOptional || hasDefault
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  json(isOptional: boolean): ColumnWithMeta {
    const column = text();
    const finalColumn = isOptional
      ? column
      : (column.notNull() as unknown as ColumnWithMeta);
    // (finalColumn as any).meta = { _type: "json" };
    return finalColumn as unknown as ColumnWithMeta;
  }

  date(isOptional: boolean): ColumnWithMeta {
    const column = integer();
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  enum(isOptional: boolean): ColumnWithMeta {
    const column = text();
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  nativeEnum(isOptional: boolean): ColumnWithMeta {
    const column = integer();
    return isOptional
      ? (column as unknown as ColumnWithMeta)
      : (column.notNull() as unknown as ColumnWithMeta);
  }

  primaryKey(zodType: z.ZodType): ColumnWithMeta {
    if (zodType instanceof z.ZodString) {
      return text().primaryKey() as unknown as ColumnWithMeta;
    }
    return integer().primaryKey({
      autoIncrement: true,
    }) as unknown as ColumnWithMeta;
  }

  applyColumnConstraints(
    column: ColumnWithMeta,
    constraints?: ColumnConstraintOptions,
  ): ColumnWithMeta {
    if (!constraints) {
      return column;
    }

    let constrainedColumn = column as any;

    if (constraints.notNull === true) {
      constrainedColumn = constrainedColumn.notNull();
    }

    if (constraints.default !== undefined) {
      constrainedColumn = constrainedColumn.default(constraints.default);
    }

    if (constraints.unique) {
      const name =
        typeof constraints.unique === "string"
          ? constraints.unique
          : typeof constraints.unique === "object"
            ? constraints.unique.name
            : undefined;

      constrainedColumn = constrainedColumn.unique(name);
    }

    return constrainedColumn as ColumnWithMeta;
  }

  check(name: string, value: SQL) {
    return check(name, value);
  }
}
