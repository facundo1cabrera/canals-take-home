import 'reflect-metadata';
import { newDb } from 'pg-mem';
import type { KyselyDb } from '@repo/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INITIAL_MIGRATION_PATH = join(
    __dirname,
    '../../../../../packages/db/prisma/migrations/20260221232501_inital_setup/migration.sql'
);

/**
 * Creates an in-memory Postgres database with the app schema applied,
 * and returns a Kysely instance bound to it for integration tests.
 * Note: PostGIS is not available in pg-mem, so queries using ST_DISTANCE
 * (e.g. findNearestWarehouseWithInventoryForItems) must be tested elsewhere.
 */
export async function createInMemoryDb(): Promise<KyselyDb> {
    const mem = newDb();
    const kysely = mem.adapters.createKysely() as KyselyDb;

    const migrationSql = readFileSync(INITIAL_MIGRATION_PATH, 'utf-8');
    // Strip single-line comments and run each statement (pg-mem may not support full batch)
    const normalized = migrationSql
        .replace(/^\s*--[^\n]*\n?/gm, '')
        .trim();
    const statements = normalized
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    for (const stmt of statements) {
        const s = stmt + ';';
        if (
            /^\s*CREATE\s+TYPE/i.test(s) ||
            /^\s*CREATE\s+TABLE/i.test(s) ||
            /^\s*CREATE\s+UNIQUE\s+INDEX/i.test(s) ||
            /^\s*ALTER\s+TABLE/i.test(s)
        ) {
            await mem.public.none(s);
        }
    }

    return kysely;
}

/**
 * Creates a test container with KYSELY_TOKEN bound to the in-memory DB.
 * Use this in integration tests so repositories use the in-memory DB.
 */
export async function createTestContainer(): Promise<{
    db: KyselyDb;
    container: import('tsyringe').DependencyContainer;
}> {
    const { container } = await import('../../container');
    const { KYSELY_TOKEN } = await import('../../lib/kysely');
    const db = await createInMemoryDb();
    const testContainer = container.createChildContainer();
    testContainer.register(KYSELY_TOKEN, { useValue: db });
    return { db, container: testContainer };
}
