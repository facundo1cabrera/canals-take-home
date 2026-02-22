/// <reference types="node" />
// Avoid @repo/db throwing when loaded (e.g. via container → repositories) during tests.
// Our integration tests use an in-memory DB and inject it via KYSELY_TOKEN.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy';