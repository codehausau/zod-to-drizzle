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

function zodToDrizzle(
	schema: z.ZodTypeAny,
	isOptional: boolean,
	handler: DialectHandler,
) {
	if (schema instanceof z.ZodString) {
		return handler.string(isOptional);
	}
	if (schema instanceof z.ZodNumber) {
		return handler.number(isOptional);
	}
	if (schema instanceof z.ZodBoolean) {
		return handler.boolean(isOptional);
	}
	if (schema instanceof z.ZodObject) {
		return handler.json(isOptional);
	}
	if (schema instanceof z.ZodArray) {
		return handler.json(isOptional);
	}
	if (schema instanceof z.ZodEnum) {
		return handler.enum(isOptional);
	}
	if (schema instanceof z.ZodDate) {
		return handler.date(isOptional);
	}

	throw new UnsupportedZodTypeError(schema._def);
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
		const isOptional = value instanceof z.ZodOptional;
		const baseType = isOptional
			? (value as z.ZodOptional<any>).unwrap()
			: value;

		columns[key] = zodToDrizzle(baseType, isOptional, handler);

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
