import { z } from "zod";
import { UnsupportedZodTypeError } from "./errors";
import type { TableOptions } from "./types";
import { SQLiteHandler } from "./dialects/sqlite";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { mysqlTable } from "drizzle-orm/mysql-core";
import { pgTable } from "drizzle-orm/pg-core";
import type { DialectHandler } from "./dialects/base";

function getDialectHandler(dialect: TableOptions<any>["dialect"]) {
  switch (dialect) {
    case "sqlite":
      return new SQLiteHandler();
    case "mysql":
      throw new Error("MySQL support coming soon");
    case "postgres":
      throw new Error("PostgreSQL support coming soon");
    default:
      throw new Error(`Unsupported dialect ${dialect}`);
  }
}

function isOptionalType(schema: z.ZodTypeAny): boolean {
  return (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodNullable ||
    hasDefault(schema)
  );
}

function hasDefault(schema: z.ZodTypeAny): boolean {
  return schema instanceof z.ZodDefault;
}

function unwrapType(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema._def.typeName === "ZodDefault") {
    return unwrapType((schema as z.ZodDefault<any>).removeDefault());
  }
  if (schema._def.typeName === "ZodOptional") {
    return unwrapType((schema as z.ZodOptional<any>).unwrap());
  }
  if (schema._def.typeName === "ZodNullable") {
    return unwrapType((schema as z.ZodNullable<any>).unwrap());
  }
  return schema;
}

function zodToDrizzle(
  schema: z.ZodTypeAny,
  isOptional: boolean,
  handler: DialectHandler,
  refs?: TableOptions<any>["references"],
) {
  const baseType = unwrapType(schema);
  const withDefault = hasDefault(schema);
  const hasReferences = refs !== undefined;

  if (baseType._def.typeName === "ZodNumber") {
    return handler.number(
      isOptional,
      withDefault,
      hasReferences ? refs : undefined,
    );
  }
  if (baseType._def.typeName === "ZodBoolean") {
    return handler.boolean(isOptional, withDefault);
  }
  if (baseType._def.typeName === "ZodString") {
    return handler.string(isOptional, refs);
  }
  if (baseType._def.typeName === "ZodObject") {
    return handler.json(isOptional);
  }
  if (baseType._def.typeName === "ZodArray") {
    return handler.json(isOptional);
  }
  if (baseType._def.typeName === "ZodEnum") {
    return handler.enum(isOptional);
  }
  if (baseType._def.typeName === "ZodNativeEnum") {
    return handler.nativeEnum(isOptional);
  }
  if (baseType._def.typeName === "ZodDate") {
    return handler.date(isOptional);
  }
  if (
    baseType._def.typeName === "ZodNull" ||
    baseType._def.typeName === "ZodUndefined"
  ) {
    return handler.string(true); // Always optional
  }
  if (baseType._def.typeName === "ZodLiteral") {
    // Handle based on literal type
    const literalValue = baseType._def.value;
    if (typeof literalValue === "string") {
      return handler.string(isOptional, refs);
    }
    if (typeof literalValue === "number") {
      return handler.number(
        isOptional,
        withDefault,
        hasReferences ? refs : undefined,
      );
    }
    if (typeof literalValue === "boolean") {
      return handler.boolean(isOptional, withDefault);
    }
  }
  if (
    baseType._def.typeName === "ZodUnion" ||
    baseType._def.typeName === "ZodDiscriminatedUnion"
  ) {
    return handler.json(isOptional);
  }
  if (baseType._def.typeName === "ZodRecord") {
    return handler.json(isOptional);
  }
  if (baseType._def.typeName === "ZodMap") {
    return handler.json(isOptional);
  }
  if (baseType._def.typeName === "ZodSet") {
    return handler.json(isOptional);
  }

  throw new UnsupportedZodTypeError(baseType._def.typeName);
}

export function createTableFromZod<T extends z.ZodObject<any>>(
  tableName: string,
  schema: T,
  options: TableOptions<T> = {},
) {
  const { dialect = "sqlite", primaryKey, references: refs } = options;
  const handler = getDialectHandler(dialect);

  const shape = schema.shape;
  const columns: Record<string, any> = {};

  for (const [key, value] of Object.entries(shape)) {
    const isOptional = isOptionalType(value as z.ZodTypeAny);
    columns[key] = zodToDrizzle(
      value as z.ZodTypeAny,
      isOptional,
      handler,
      refs,
    );

    if (primaryKey === key) {
      columns[key] = handler.primaryKey(schema);
    }
  }

  switch (dialect) {
    case "sqlite":
      return sqliteTable(tableName, columns);
    case "mysql":
      return mysqlTable(tableName, columns);
    case "postgres":
      return pgTable(tableName, columns);
    default:
      return sqliteTable(tableName, columns);
  }
}

export * from "./types";
export * from "./errors";
