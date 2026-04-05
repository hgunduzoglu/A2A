import { privateKeyToAccount } from 'viem/accounts';
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  isAddress,
  isHex,
  keccak256,
  parseAbi,
  parseUnits,
  stringToHex,
  zeroHash,
} from 'viem';
import { worldchain, worldchainSepolia } from 'viem/chains';

const AGENT_REGISTRY_ABI = parseAbi([
  'function registerAgent(string ensName, bytes32 nullifierHash, bytes32 agentKitCredential, string[] capabilities, uint256 pricePerRequest)',
  'function getAgent(string ensName) view returns ((string ensName, bytes32 nullifierHash, bytes32 agentKitCredential, string[] capabilities, uint256 pricePerRequest, bool active))',
  'function getAllAgents() view returns ((string ensName, bytes32 nullifierHash, bytes32 agentKitCredential, string[] capabilities, uint256 pricePerRequest, bool active)[])',
  'function isVerifiedAgent(string ensName) view returns (bool)',
]);

export interface WorldChainRegistrationInput {
  ensName: string;
  nullifierHash: string;
  credentialHash?: string | null;
  capabilities: string[];
  priceUsdc: string;
}

export interface WorldChainAgentRecord {
  ensName: string;
  nullifierHash: `0x${string}`;
  credentialHash: `0x${string}`;
  capabilities: string[];
  pricePerRequest: bigint;
  priceUsdc: string;
  active: boolean;
}

function getWorldChainConfig() {
  return {
    rpcUrl:
      process.env.WORLD_CHAIN_RPC_URL ??
      'https://worldchain-sepolia.g.alchemy.com/public',
    privateKey: process.env.WORLD_CHAIN_PRIVATE_KEY,
    registryAddress: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS,
  };
}

function normalizeBytes32(value: string | null | undefined) {
  if (!value) {
    return zeroHash;
  }

  if (isHex(value) && value.length === 66) {
    return value as `0x${string}`;
  }

  return keccak256(stringToHex(value));
}

function getWorldChainReadClient() {
  const config = getWorldChainConfig();

  if (!config.registryAddress || !isAddress(config.registryAddress)) {
    return null;
  }

  const chain = config.rpcUrl.includes('sepolia') ? worldchainSepolia : worldchain;
  const publicClient = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });

  return {
    publicClient,
    registryAddress: config.registryAddress as `0x${string}`,
  };
}

function getWorldChainWriteClients() {
  const config = getWorldChainConfig();
  const reader = getWorldChainReadClient();

  if (!config.privateKey || !reader) {
    return null;
  }

  const privateKey = config.privateKey.startsWith('0x')
    ? (config.privateKey as `0x${string}`)
    : (`0x${config.privateKey}` as `0x${string}`);
  const account = privateKeyToAccount(privateKey);
  const chain = config.rpcUrl.includes('sepolia') ? worldchainSepolia : worldchain;
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  });

  return {
    account,
    publicClient: reader.publicClient,
    walletClient,
    registryAddress: reader.registryAddress,
  };
}

function mapAgentRecord(
  agent: readonly [
    string,
    `0x${string}`,
    `0x${string}`,
    string[],
    bigint,
    boolean,
  ],
): WorldChainAgentRecord {
  return {
    ensName: agent[0],
    nullifierHash: agent[1],
    credentialHash: agent[2],
    capabilities: agent[3],
    pricePerRequest: agent[4],
    priceUsdc: formatUnits(agent[4], 6),
    active: agent[5],
  };
}

export async function registerAgentOnWorldChain(
  input: WorldChainRegistrationInput,
) {
  const clients = getWorldChainWriteClients();

  if (!clients) {
    return {
      provider: 'worldchain',
      mode: 'pending_deploy' as const,
      ensName: input.ensName,
    };
  }

  const pricePerRequest = parseUnits(input.priceUsdc || '0', 6);
  const txHash = await clients.walletClient.writeContract({
    address: clients.registryAddress,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'registerAgent',
    args: [
      input.ensName,
      normalizeBytes32(input.nullifierHash),
      normalizeBytes32(input.credentialHash),
      input.capabilities,
      pricePerRequest,
    ],
  });

  const receipt = await clients.publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  return {
    provider: 'worldchain',
    mode: 'live' as const,
    ensName: input.ensName,
    contractAddress: clients.registryAddress,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  };
}

export async function getRegisteredAgentFromWorldChain(ensName: string) {
  const client = getWorldChainReadClient();

  if (!client) {
    return null;
  }

  const record = (await client.publicClient.readContract({
    address: client.registryAddress,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgent',
    args: [ensName],
  })) as unknown as readonly [
    string,
    `0x${string}`,
    `0x${string}`,
    string[],
    bigint,
    boolean,
  ];

  if (!record[0] || record[1] === zeroHash) {
    return null;
  }

  return mapAgentRecord(record);
}

export async function listRegisteredAgentsFromWorldChain() {
  const client = getWorldChainReadClient();

  if (!client) {
    return [] as WorldChainAgentRecord[];
  }

  const records = (await client.publicClient.readContract({
    address: client.registryAddress,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAllAgents',
  })) as unknown as readonly (readonly [
    string,
    `0x${string}`,
    `0x${string}`,
    string[],
    bigint,
    boolean,
  ])[];

  return records.map(mapAgentRecord);
}
