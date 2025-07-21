import { expect, test, describe } from "bun:test";
import { z } from "zod";
import { createTableFromZod } from "../src";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

describe("createTableFromZod", () => {
  test("should create a SQLite table with correct structure", () => {
    enum Role {
      ADMIN = "admin",
      USER = "user",
    }
    const CommonSchema = z.object({
      id: z.number(),
      createdAt: z.number().default(Date.now()),
      updatedAt: z.number().nullish(),
      deletedAt: z.number().nullish(),
      createdBy: z.number(),
      updatedBy: z.number().nullish(),
      deletedBy: z.number().nullish(),
      deleted: z.boolean().default(false),
    });

    const UserSchema = CommonSchema.extend({
      name: z.string(),
      email: z.string().optional(),
      isAdmin: z.boolean(),
      metadata: z.object({ key: z.string() }),
      tags: z.array(z.string()),
      role: z.enum(["admin", "user"]),
      newRole: z.enum(Role).optional(),
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

    // Native Enum
    expect(columns.newRole.name).toBe("newRole");
    expect(columns.newRole.notNull).toBe(false);
    expect(columns.newRole.columnType).toBe("SQLiteText");

    // Date
    expect(columns.createdAt.name).toBe("createdAt");
    expect(columns.createdAt.notNull).toBe(false);
    expect(columns.createdAt.columnType).toBe("SQLiteInteger");
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

  test("should handle nullable and optional types", () => {
    const Schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
      nullish: z.string().nullish(),
      withDefault: z.string().default("default"),
    });

    const table = createTableFromZod("test", Schema, {
      dialect: "sqlite",
    }) as SQLiteTable;

    const columns = (table as any)[Symbol.for("drizzle:Columns")];
    expect(columns.required.notNull).toBe(true);
    expect(columns.optional.notNull).toBe(false);
    expect(columns.nullable.notNull).toBe(false);
    expect(columns.nullish.notNull).toBe(false);
    expect(columns.withDefault.notNull).toBe(false);
  });

  test("should handle complex types", () => {
    const Schema = z.object({
      union: z.union([z.string(), z.number()]),
      literal: z.literal("value"),
      record: z.record(z.string(), z.string()),
      map: z.map(z.string(), z.number()),
      set: z.set(z.string()),
      nullable: z.string().nullable(),
      nullish: z.string().nullish(),
    });

    const table = createTableFromZod("test", Schema, {
      dialect: "sqlite",
    }) as SQLiteTable;

    const columns = (table as any)[Symbol.for("drizzle:Columns")];
    expect(columns.union.columnType).toBe("SQLiteText");
    expect(columns.literal.notNull).toBe(true);
    expect(columns.record.columnType).toBe("SQLiteText");
    expect(columns.map.columnType).toBe("SQLiteText");
    expect(columns.set.columnType).toBe("SQLiteText");
    expect(columns.nullable.notNull).toBe(false);
    expect(columns.nullish.notNull).toBe(false);
  });

  test("should handle default values and nullish fields", () => {
    const Schema = z.object({
      id: z.number(),
      createdAt: z.number().default(Date.now()),
      updatedAt: z.number().nullish(),
      deletedAt: z.number().nullish(),
      createdBy: z.number(),
      updatedBy: z.number().nullish(),
      deletedBy: z.number().nullish(),
      deleted: z.boolean().default(false),
    });

    const table = createTableFromZod("test", Schema, {
      dialect: "sqlite",
      primaryKey: "id",
    }) as SQLiteTable;

    const columns = (table as any)[Symbol.for("drizzle:Columns")];

    expect(columns.id.notNull).toBe(true);
    expect(columns.createdAt.notNull).toBe(false); // Has default
    expect(columns.updatedAt.notNull).toBe(false); // Nullish
    expect(columns.createdBy.notNull).toBe(true);
    expect(columns.deleted.notNull).toBe(false); // Has default
  });
});

describe("zodToDrizzle", () => {
  test("should handle references", () => {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const PostSchema = z.object({
      id: z.number(),
      title: z.string(),
      userId: z.number(),
    });

    const users = createTableFromZod("users", UserSchema, {
      dialect: "sqlite",
      primaryKey: "id",
    });

    const posts = createTableFromZod("posts", PostSchema, {
      dialect: "sqlite",
      primaryKey: "id",
      references: [
        {
          table: users,
          columns: [["userId", "id"]],
        },
      ],
    });

    console.log("=======");
    const fKeys = (posts as any)[Symbol.for("drizzle:SQLiteInlineForeignKeys")];
    const column = (posts as any)[Symbol.for("drizzle:Columns")].userId;
    expect(fKeys[0].reference().columns[0].name).toEqual("userId");
  });
});
