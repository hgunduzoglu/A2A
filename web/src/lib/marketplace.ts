import { ensureDatabaseSchema, getPool } from '@/lib/db';

interface AgentListingRow {
  id: string;
  ens_name: string;
  agent_name: string;
  category: string;
  description: string;
  endpoint: string;
  price_usdc: string;
  capabilities: string[] | string;
  world_nullifier_hash: string;
  world_verified: boolean;
  verification_level: string;
  credential_hash: string | null;
  ens_node: string | null;
  ens_resolver: string | null;
  ens_create_tx_hash: string | null;
  ens_text_record_tx_hashes: string[] | string;
  payment_address: string | null;
  registry_contract_address: string | null;
  registry_tx_hash: string | null;
  registration_mode: string;
  status: string;
  completion_count: number;
  reputation_score: string;
  created_at: Date;
  updated_at: Date;
}

export interface AgentListing {
  id: number;
  ensName: string;
  agentName: string;
  category: string;
  description: string;
  endpoint: string;
  priceUsdc: string;
  capabilities: string[];
  worldNullifierHash: string;
  worldVerified: boolean;
  verificationLevel: string;
  credentialHash: string | null;
  ensNode: string | null;
  ensResolver: string | null;
  ensCreateTxHash: string | null;
  ensTextRecordTxHashes: string[];
  paymentAddress: string | null;
  registryContractAddress: string | null;
  registryTxHash: string | null;
  registrationMode: string;
  status: string;
  completionCount: number;
  reputationScore: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAgentListingInput {
  ensName: string;
  agentName: string;
  category: string;
  description: string;
  endpoint: string;
  priceUsdc: string;
  capabilities: string[];
  worldNullifierHash: string;
  verificationLevel?: string;
  credentialHash?: string | null;
  ensNode?: string | null;
  ensResolver?: string | null;
  ensCreateTxHash?: string | null;
  ensTextRecordTxHashes?: string[];
  paymentAddress?: string | null;
  registryContractAddress?: string | null;
  registryTxHash?: string | null;
  registrationMode?: string;
}

function parseJsonArray(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapAgentListing(row: AgentListingRow): AgentListing {
  return {
    id: Number(row.id),
    ensName: row.ens_name,
    agentName: row.agent_name,
    category: row.category,
    description: row.description,
    endpoint: row.endpoint,
    priceUsdc: row.price_usdc,
    capabilities: parseJsonArray(row.capabilities),
    worldNullifierHash: row.world_nullifier_hash,
    worldVerified: row.world_verified,
    verificationLevel: row.verification_level,
    credentialHash: row.credential_hash,
    ensNode: row.ens_node,
    ensResolver: row.ens_resolver,
    ensCreateTxHash: row.ens_create_tx_hash,
    ensTextRecordTxHashes: parseJsonArray(row.ens_text_record_tx_hashes),
    paymentAddress: row.payment_address,
    registryContractAddress: row.registry_contract_address,
    registryTxHash: row.registry_tx_hash,
    registrationMode: row.registration_mode,
    status: row.status,
    completionCount: row.completion_count,
    reputationScore: row.reputation_score,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAgentCountForHuman(worldNullifierHash: string) {
  await ensureDatabaseSchema();

  const result = await getPool().query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM agent_listings
      WHERE world_nullifier_hash = $1
        AND status = 'active'
    `,
    [worldNullifierHash],
  );

  return Number(result.rows[0]?.count ?? '0');
}

export async function getAgentListingByEnsName(ensName: string) {
  await ensureDatabaseSchema();

  const result = await getPool().query<AgentListingRow>(
    `
      SELECT *
      FROM agent_listings
      WHERE ens_name = $1
      LIMIT 1
    `,
    [ensName],
  );

  const row = result.rows[0];

  return row ? mapAgentListing(row) : null;
}

export async function listAgentListings(category?: string | null) {
  await ensureDatabaseSchema();

  const values: string[] = [];
  let whereClause = `WHERE status = 'active'`;

  if (category) {
    values.push(category);
    whereClause += ` AND category = $${values.length}`;
  }

  const result = await getPool().query<AgentListingRow>(
    `
      SELECT *
      FROM agent_listings
      ${whereClause}
      ORDER BY created_at DESC
    `,
    values,
  );

  return result.rows.map(mapAgentListing);
}

export async function listAgentListingsForHuman(worldNullifierHash: string) {
  await ensureDatabaseSchema();

  const result = await getPool().query<AgentListingRow>(
    `
      SELECT *
      FROM agent_listings
      WHERE world_nullifier_hash = $1
      ORDER BY created_at DESC
    `,
    [worldNullifierHash],
  );

  return result.rows.map(mapAgentListing);
}

export async function saveAgentListing(input: SaveAgentListingInput) {
  await ensureDatabaseSchema();

  const result = await getPool().query<AgentListingRow>(
    `
      INSERT INTO agent_listings (
        ens_name,
        agent_name,
        category,
        description,
        endpoint,
        price_usdc,
        capabilities,
        world_nullifier_hash,
        verification_level,
        credential_hash,
        ens_node,
        ens_resolver,
        ens_create_tx_hash,
        ens_text_record_tx_hashes,
        payment_address,
        registry_contract_address,
        registry_tx_hash,
        registration_mode,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::jsonb,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14::jsonb,
        $15,
        $16,
        $17,
        $18,
        NOW()
      )
      ON CONFLICT (ens_name) DO UPDATE SET
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        endpoint = EXCLUDED.endpoint,
        price_usdc = EXCLUDED.price_usdc,
        capabilities = EXCLUDED.capabilities,
        world_nullifier_hash = EXCLUDED.world_nullifier_hash,
        verification_level = EXCLUDED.verification_level,
        credential_hash = EXCLUDED.credential_hash,
        ens_node = EXCLUDED.ens_node,
        ens_resolver = EXCLUDED.ens_resolver,
        ens_create_tx_hash = EXCLUDED.ens_create_tx_hash,
        ens_text_record_tx_hashes = EXCLUDED.ens_text_record_tx_hashes,
        payment_address = EXCLUDED.payment_address,
        registry_contract_address = EXCLUDED.registry_contract_address,
        registry_tx_hash = EXCLUDED.registry_tx_hash,
        registration_mode = EXCLUDED.registration_mode,
        updated_at = NOW()
      RETURNING *
    `,
    [
      input.ensName,
      input.agentName,
      input.category,
      input.description,
      input.endpoint,
      input.priceUsdc,
      JSON.stringify(input.capabilities),
      input.worldNullifierHash,
      input.verificationLevel ?? 'orb',
      input.credentialHash ?? null,
      input.ensNode ?? null,
      input.ensResolver ?? null,
      input.ensCreateTxHash ?? null,
      JSON.stringify(input.ensTextRecordTxHashes ?? []),
      input.paymentAddress ?? null,
      input.registryContractAddress ?? null,
      input.registryTxHash ?? null,
      input.registrationMode ?? 'live',
    ],
  );

  return mapAgentListing(result.rows[0]);
}
