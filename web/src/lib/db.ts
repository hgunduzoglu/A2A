import { Pool } from 'pg';

declare global {
  var __a2aPgPool: Pool | undefined;
  var __a2aSchemaPromise: Promise<void> | undefined;
}

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  return {
    database: process.env.PGDATABASE ?? 'a2a',
    host: process.env.PGHOST ?? '/tmp',
    port: Number(process.env.PGPORT ?? '5432'),
    user: process.env.PGUSER ?? process.env.USER ?? 'postgres',
  };
}

export function getPool() {
  if (!globalThis.__a2aPgPool) {
    globalThis.__a2aPgPool = new Pool(getPoolConfig());
  }

  return globalThis.__a2aPgPool;
}

export async function ensureDatabaseSchema() {
  if (!globalThis.__a2aSchemaPromise) {
    globalThis.__a2aSchemaPromise = getPool().query(`
      CREATE TABLE IF NOT EXISTS agent_listings (
        id BIGSERIAL PRIMARY KEY,
        ens_name TEXT NOT NULL UNIQUE,
        agent_name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        price_usdc NUMERIC(12, 6) NOT NULL,
        capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
        world_nullifier_hash TEXT NOT NULL,
        world_verified BOOLEAN NOT NULL DEFAULT TRUE,
        verification_level TEXT NOT NULL DEFAULT 'orb',
        credential_hash TEXT,
        ens_node TEXT,
        ens_resolver TEXT,
        ens_create_tx_hash TEXT,
        ens_text_record_tx_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
        payment_address TEXT,
        registration_mode TEXT NOT NULL DEFAULT 'live',
        status TEXT NOT NULL DEFAULT 'active',
        completion_count INTEGER NOT NULL DEFAULT 0,
        reputation_score NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_agent_listings_category
        ON agent_listings (category);

      CREATE INDEX IF NOT EXISTS idx_agent_listings_created_at
        ON agent_listings (created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_agent_listings_world_nullifier
        ON agent_listings (world_nullifier_hash);
    `).then(() => undefined);
  }

  await globalThis.__a2aSchemaPromise;
}
