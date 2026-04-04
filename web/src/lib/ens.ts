import { privateKeyToAccount } from 'viem/accounts';
import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
  zeroAddress,
} from 'viem';
import { sepolia } from 'viem/chains';
import ENSRegistry from '@ensdomains/ens-contracts/deployments/sepolia/ENSRegistry.json';
import NameWrapper from '@ensdomains/ens-contracts/deployments/sepolia/NameWrapper.json';
import PublicResolver from '@ensdomains/ens-contracts/deployments/sepolia/PublicResolver.json';

type AgentRegistrationInput = Record<string, unknown> & {
  ensName?: string;
  nullifier?: string;
  description?: string;
  price?: string;
  endpoint?: string;
  capabilities?: string[];
  credentialHash?: string;
  category?: string;
};

const AGENT_TEXT_RECORD_KEYS = [
  'world-nullifier',
  'world-verification',
  'agent-credential',
  'agent-capabilities',
  'agent-category',
  'agent-description',
  'agent-price',
  'agent-currency',
  'payment-address',
  'agent-endpoint',
] as const;

function getEnsConfig() {
  return {
    parentDomain: process.env.ENS_PARENT_DOMAIN,
    privateKey: process.env.ENS_PRIVATE_KEY,
    rpcUrl: process.env.ENS_RPC_URL,
    network: process.env.ENS_NETWORK ?? 'sepolia',
  };
}

function getLabelFromEnsName(name: string, parentDomain: string) {
  const suffix = `.${parentDomain}`;

  if (!name.endsWith(suffix)) {
    throw new Error(`ENS name must end with ${suffix}.`);
  }

  return name.slice(0, -suffix.length);
}

function getTextRecordValue(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function getEnsClients() {
  const config = getEnsConfig();

  if (
    config.network !== 'sepolia' ||
    !config.parentDomain ||
    !config.privateKey ||
    !config.rpcUrl
  ) {
    return null;
  }

  const privateKey = config.privateKey.startsWith('0x')
    ? (config.privateKey as `0x${string}`)
    : (`0x${config.privateKey}` as `0x${string}`);
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(config.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(config.rpcUrl),
  });

  return {
    account,
    publicClient,
    walletClient,
    parentDomain: config.parentDomain,
  };
}

export async function registerAgentSubname(input: AgentRegistrationInput) {
  const clients = getEnsClients();

  if (!clients || !input.ensName) {
    return {
      provider: 'ens',
      mode: 'stub',
      input,
    };
  }

  const { publicClient, walletClient, account, parentDomain } = clients;
  const parentNode = namehash(parentDomain);
  const subname = input.ensName;
  const label = getLabelFromEnsName(subname, parentDomain);
  const subnameNode = namehash(subname);
  const parentData = await publicClient.readContract({
    address: NameWrapper.address as `0x${string}`,
    abi: NameWrapper.abi,
    functionName: 'getData',
    args: [BigInt(parentNode)],
  });
  const [, , parentExpiry] = parentData as readonly [string, number, bigint];

  const createHash = await walletClient.writeContract({
    address: NameWrapper.address as `0x${string}`,
    abi: NameWrapper.abi,
    functionName: 'setSubnodeRecord',
    args: [
      parentNode,
      label,
      account.address,
      PublicResolver.address as `0x${string}`,
      BigInt(0),
      0,
      parentExpiry,
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash: createHash });

  const textRecords = [
    ['world-nullifier', getTextRecordValue(input.nullifier)],
    ['world-verification', 'orb'],
    ['agent-credential', getTextRecordValue(input.credentialHash)],
    ['agent-capabilities', getTextRecordValue(input.capabilities, '[]')],
    ['agent-category', getTextRecordValue(input.category)],
    ['agent-description', getTextRecordValue(input.description)],
    ['agent-price', getTextRecordValue(input.price)],
    ['agent-currency', 'USDC'],
    ['payment-address', account.address],
    ['agent-endpoint', getTextRecordValue(input.endpoint)],
  ] as const satisfies readonly (readonly [typeof AGENT_TEXT_RECORD_KEYS[number], string])[];

  const textRecordTransactionHashes: `0x${string}`[] = [];

  for (const [key, value] of textRecords) {
    const hash = await walletClient.writeContract({
      address: PublicResolver.address as `0x${string}`,
      abi: PublicResolver.abi,
      functionName: 'setText',
      args: [subnameNode, key, value],
    });

    textRecordTransactionHashes.push(hash);
    await publicClient.waitForTransactionReceipt({ hash });
  }

  const resolver = await publicClient.readContract({
    address: ENSRegistry.address as `0x${string}`,
    abi: ENSRegistry.abi,
    functionName: 'resolver',
    args: [subnameNode],
  });

  return {
    provider: 'ens',
    mode: 'live',
    ensName: subname,
    node: subnameNode,
    resolver,
    createHash,
    textRecordTransactionHashes,
    textRecords,
  };
}

export async function resolveAgentProfile(name: string) {
  const clients = getEnsClients();

  if (!clients) {
    return {
      name,
      provider: 'ens',
      mode: 'stub',
    };
  }

  const node = namehash(name);
  const resolver = await clients.publicClient.readContract({
    address: ENSRegistry.address as `0x${string}`,
    abi: ENSRegistry.abi,
    functionName: 'resolver',
    args: [node],
  });

  const records =
    typeof resolver === 'string' && resolver !== zeroAddress
      ? Object.fromEntries(
          await Promise.all(
            AGENT_TEXT_RECORD_KEYS.map(async (key) => {
              const value = await clients.publicClient.readContract({
                address: resolver as `0x${string}`,
                abi: PublicResolver.abi,
                functionName: 'text',
                args: [node, key],
              });

              return [key, String(value)] as const;
            }),
          ),
        )
      : {};

  return {
    name,
    node,
    resolver,
    records,
    provider: 'ens',
    mode: 'live',
  };
}
