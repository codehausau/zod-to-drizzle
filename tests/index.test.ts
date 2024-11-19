import { expect, test, describe } from "bun:test";
import { z } from "zod";
import { createTableFromZod } from "../src";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

describe("createTableFromZod", () => {
	test("should create a SQLite table with correct structure", () => {
		const UserSchema = z.object({
			id: z.number(),
			name: z.string(),
			email: z.string().optional(),
			isAdmin: z.boolean(),
			metadata: z.object({ key: z.string() }),
			tags: z.array(z.string()),
			role: z.enum(["admin", "user"]),
			createdAt: z.date(),
		});

		const table = createTableFromZod("users", UserSchema, {
			dialect: "sqlite",
			primaryKey: "id",
		}) as SQLiteTable;

		// Check table name
		const tableName = (table as any)[Symbol.for("drizzle:Name")];
		expect(tableName).toBe("users");

		// Check columns existence and types
		const columns = (table as any)[Symbol.for("drizzle:Columns")];

		// Primary Key
		expect(columns.id.name).toBe("id");
		expect(columns.id.primary).toBe(true);
		expect(columns.id.notNull).toBe(true);
		expect(columns.id.autoIncrement).toBe(true);
		expect(columns.id.columnType).toBe("SQLiteInteger");

		// Required string
		expect(columns.name.name).toBe("name");
		expect(columns.name.notNull).toBe(true);
		expect(columns.name.columnType).toBe("SQLiteText");

		// Optional string
		expect(columns.email.name).toBe("email");
		expect(columns.email.notNull).toBe(false);
		expect(columns.email.columnType).toBe("SQLiteText");

		// Boolean
		expect(columns.isAdmin.name).toBe("isAdmin");
		expect(columns.isAdmin.notNull).toBe(true);
		expect(columns.isAdmin.columnType).toBe("SQLiteInteger");

		// JSON fields
		expect(columns.metadata.name).toBe("metadata");
		expect(columns.metadata.notNull).toBe(true);
		expect(columns.metadata.columnType).toBe("SQLiteText");
		// expect(columns.metadata.meta?._type).toBe("json");

		expect(columns.tags.name).toBe("tags");
		expect(columns.tags.notNull).toBe(true);
		expect(columns.tags.columnType).toBe("SQLiteText");
		// expect(columns.tags.meta?._type).toBe("json");

		// Enum
		expect(columns.role.name).toBe("role");
		expect(columns.role.notNull).toBe(true);
		expect(columns.role.columnType).toBe("SQLiteText");

		// Date
		expect(columns.createdAt.name).toBe("createdAt");
		expect(columns.createdAt.notNull).toBe(true);
		expect(columns.createdAt.columnType).toBe("SQLiteText");
	});

	test("should handle optional fields correctly", () => {
		const SchemaWithOptionals = z.object({
			id: z.number(),
			required: z.string(),
			optional: z.string().optional(),
		});

		const table = createTableFromZod("test", SchemaWithOptionals, {
			dialect: "sqlite",
			primaryKey: "id",
		}) as SQLiteTable;

		const columns = (table as any)[Symbol.for("drizzle:Columns")];
		expect(columns.required.notNull).toBe(true);
		expect(columns.optional.notNull).toBe(false);
	});

	test("should throw error for unsupported Zod types", () => {
		const SchemaWithUnsupportedType = z.object({
			id: z.number(),
			unsupported: z.symbol(),
		});

		expect(() =>
			createTableFromZod("test", SchemaWithUnsupportedType, {
				dialect: "sqlite",
			}),
		).toThrow();
	});

	test("should throw error for unsupported dialects", () => {
		const SimpleSchema = z.object({
			id: z.number(),
		});

		expect(() =>
			createTableFromZod("test", SimpleSchema, {
				dialect: "postgres", // Currently unsupported
			}),
		).toThrow("PostgreSQL support coming soon");
	});
});
