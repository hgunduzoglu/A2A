import { privateKeyToAccount } from 'viem/accounts';
import {
  createPublicClient,
  createWalletClient,
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
]);

export interface WorldChainRegistrationInput {
  ensName: string;
  nullifierHash: string;
  credentialHash?: string | null;
  capabilities: string[];
  priceUsdc: string;
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

function getWorldChainClients() {
  const config = getWorldChainConfig();

  if (!config.privateKey || !config.registryAddress || !isAddress(config.registryAddress)) {
    return null;
  }

  const privateKey = config.privateKey.startsWith('0x')
    ? (config.privateKey as `0x${string}`)
    : (`0x${config.privateKey}` as `0x${string}`);
  const account = privateKeyToAccount(privateKey);
  const chain = config.rpcUrl.includes('sepolia') ? worldchainSepolia : worldchain;
  const publicClient = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  });

  return {
    account,
    publicClient,
    walletClient,
    registryAddress: config.registryAddress as `0x${string}`,
  };
}

export async function registerAgentOnWorldChain(
  input: WorldChainRegistrationInput,
) {
  const clients = getWorldChainClients();

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
