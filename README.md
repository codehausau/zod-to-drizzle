# zod-to-drizzle

Create Drizzle ORM tables from Zod schemas with support for multiple SQL dialects.

## Installation

```bash
# npm
npm install zod-to-drizzle

# pnpm
pnpm add zod-to-drizzle

# yarn
yarn add zod-to-drizzle

# bun
bun add zod-to-drizzle
```

## Features

- Convert Zod schemas to Drizzle ORM tables
- Support for multiple SQL dialects (SQLite, PostgreSQL, MySQL)
- Automatic type interface generation
- Primary key support
- Nested object support

## Usage

```typescript
import { z } from "zod";
import { createTableFromZod } from "zod-to-drizzle";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  isAdmin: z.boolean(),
  email: z.string().email(),
  metadata: z.object({
    key: z.string(),
  }),
  tags: z.array(z.string()),
  role: z.enum(["admin", "user"]),
  createdAt: z.date(),
});

const usersTable = createTableFromZod("users", UserSchema, {
  dialect: "sqlite",
  primaryKey: "id",
});
```

## Supported Dialects

- SQLite
- PostgreSQL (coming soon)
- MySQL (coming soon)

## License

Apache 2.0
