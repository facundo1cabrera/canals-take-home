import { Kysely, PostgresDialect, sql } from 'kysely';

export { sql };
import { Pool } from 'pg';
import type { DB } from './generated/kysely-types';

export type KyselyDb = Kysely<DB>;

const globalForKysely = global as unknown as { kysely: KyselyDb };

function createKysely(): KyselyDb {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Kysely');
  }
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });
}

export const kysely: KyselyDb =
  globalForKysely.kysely ?? createKysely();

if (process.env.NODE_ENV !== 'production') {
  globalForKysely.kysely = kysely;
}
