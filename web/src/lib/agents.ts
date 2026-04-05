import { resolveAgentProfile } from '@/lib/ens';
import {
  getAgentCountFromWorldChain,
  getRegisteredAgentFromWorldChain,
  listRegisteredAgentsFromWorldChain,
  normalizeBytes32,
  type WorldChainAgentRecord,
} from '@/lib/worldchain';

export interface AgentListing {
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
  paymentAddress: string | null;
}

type EnsRecords = Record<string, string>;

function getEnsRecords(
  profile: Awaited<ReturnType<typeof resolveAgentProfile>>,
): EnsRecords {
  if (
    typeof profile === 'object' &&
    profile !== null &&
    'records' in profile &&
    profile.records &&
    typeof profile.records === 'object'
  ) {
    return profile.records as EnsRecords;
  }

  return {};
}

function stripParentDomain(ensName: string) {
  const dotIndex = ensName.indexOf('.');
  return dotIndex > 0 ? ensName.slice(0, dotIndex) : ensName;
}

function parseCapabilities(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

function buildAgentListing(
  agent: WorldChainAgentRecord,
  records: EnsRecords,
): AgentListing {
  return {
    ensName: agent.ensName,
    agentName: stripParentDomain(agent.ensName),
    category: records['agent-category'] || 'Uncategorized',
    description: records['agent-description'] || '',
    endpoint: records['agent-endpoint'] || '',
    priceUsdc: records['agent-price'] || agent.priceUsdc,
    capabilities: parseCapabilities(
      records['agent-capabilities'],
      agent.capabilities,
    ),
    worldNullifierHash: agent.nullifierHash,
    worldVerified: agent.active,
    verificationLevel: records['world-verification'] || 'orb',
    credentialHash:
      records['agent-credential'] || agent.credentialHash || null,
    paymentAddress: records['payment-address'] || null,
  };
}

export function normalizeAgentName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : 'unnamed-agent';
}

export function toAgentEnsName(name: string, parentDomain: string) {
  const agentName = normalizeAgentName(name);
  const ensLabel = agentName.toLowerCase().replace(/\s+/g, '');

  return {
    agentName,
    ensName: `${ensLabel}.${parentDomain}`,
  };
}

export async function getAgentListingByEnsName(
  ensName: string,
): Promise<AgentListing | null> {
  const agent = await getRegisteredAgentFromWorldChain(ensName);

  if (!agent || !agent.active) {
    return null;
  }

  const profile = await resolveAgentProfile(ensName);
  const records = getEnsRecords(profile);

  return buildAgentListing(agent, records);
}

export async function listAgentListings(
  category?: string | null,
): Promise<AgentListing[]> {
  const agents = await listRegisteredAgentsFromWorldChain();
  const activeAgents = agents.filter((agent) => agent.active);

  if (activeAgents.length === 0) {
    return [];
  }

  const profiles = await Promise.all(
    activeAgents.map((agent) => resolveAgentProfile(agent.ensName)),
  );

  const listings = activeAgents.map((agent, index) => {
    const records = getEnsRecords(profiles[index]);
    return buildAgentListing(agent, records);
  });

  if (category) {
    return listings.filter(
      (listing) =>
        listing.category.toLowerCase() === category.toLowerCase(),
    );
  }

  return listings;
}

export async function listAgentListingsForHuman(
  nullifierHash: string,
): Promise<AgentListing[]> {
  const agents = await listRegisteredAgentsFromWorldChain();
  const normalized = normalizeBytes32(nullifierHash).toLowerCase();
  const matching = agents.filter(
    (agent) => agent.nullifierHash.toLowerCase() === normalized,
  );

  if (matching.length === 0) {
    return [];
  }

  const profiles = await Promise.all(
    matching.map((agent) => resolveAgentProfile(agent.ensName)),
  );

  return matching.map((agent, index) => {
    const records = getEnsRecords(profiles[index]);
    return buildAgentListing(agent, records);
  });
}

export async function getAgentCountForHuman(
  nullifierHash: string,
): Promise<number> {
  return getAgentCountFromWorldChain(nullifierHash);
}
