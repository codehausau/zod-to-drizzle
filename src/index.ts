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
	if (schema instanceof z.ZodOptional) {
		return unwrapType(schema.unwrap());
	}
	if (schema instanceof z.ZodNullable) {
		return unwrapType(schema.unwrap());
	}
	if (schema instanceof z.ZodDefault) {
		return unwrapType(schema.removeDefault());
	}
	return schema;
}

function zodToDrizzle(
	schema: z.ZodTypeAny,
	isOptional: boolean,
	handler: DialectHandler,
) {
	const baseType = unwrapType(schema);
	const withDefault = hasDefault(schema);

	if (baseType instanceof z.ZodNumber) {
		return handler.number(isOptional, withDefault);
	}
	if (baseType instanceof z.ZodBoolean) {
		return handler.boolean(isOptional, withDefault);
	}
	if (baseType instanceof z.ZodString) {
		return handler.string(isOptional);
	}
	if (baseType instanceof z.ZodObject) {
		return handler.json(isOptional);
	}
	if (baseType instanceof z.ZodArray) {
		return handler.json(isOptional);
	}
	if (baseType instanceof z.ZodEnum) {
		return handler.enum(isOptional);
	}
	if (baseType instanceof z.ZodNativeEnum) {
		return handler.nativeEnum(isOptional);
	}
	if (baseType instanceof z.ZodDate) {
		return handler.date(isOptional);
	}
	if (baseType instanceof z.ZodNull || baseType instanceof z.ZodUndefined) {
		return handler.string(true); // Always optional
	}
	if (baseType instanceof z.ZodLiteral) {
		// Handle based on literal type
		const literalValue = baseType._def.value;
		if (typeof literalValue === "string") {
			return handler.string(isOptional);
		}
		if (typeof literalValue === "number") {
			return handler.number(isOptional, withDefault);
		}
		if (typeof literalValue === "boolean") {
			return handler.boolean(isOptional, withDefault);
		}
	}
	if (
		baseType instanceof z.ZodUnion ||
		baseType instanceof z.ZodDiscriminatedUnion
	) {
		return handler.json(isOptional);
	}
	if (baseType instanceof z.ZodRecord) {
		return handler.json(isOptional);
	}
	if (baseType instanceof z.ZodMap) {
		return handler.json(isOptional);
	}
	if (baseType instanceof z.ZodSet) {
		return handler.json(isOptional);
	}

	throw new UnsupportedZodTypeError(baseType._def.typeName);
}

export function createTableFromZod<T extends z.ZodObject<any>>(
	tableName: string,
	schema: T,
	options: TableOptions<T> = {},
) {
	const { dialect = "sqlite", primaryKey } = options;
	const handler = getDialectHandler(dialect);

	const shape = schema.shape;
	const columns: Record<string, any> = {};

	for (const [key, value] of Object.entries(shape)) {
		const isOptional = isOptionalType(value as z.ZodTypeAny);

		if (primaryKey === key) {
			columns[key] = handler.primaryKey(schema);
			continue;
		}

		columns[key] = zodToDrizzle(value as z.ZodTypeAny, isOptional, handler);
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
