import {
  AccountId,
  Client,
  PrivateKey,
  TopicId,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

export type HederaMode = 'live' | 'stub' | 'error';

export interface ServiceCompletionLogInput {
  type?: string;
  agent?: string;
  callerAgent?: string | null;
  requester?: string | null;
  priceUsdc?: string;
  paymentNetwork?: string;
  paymentTransaction?: string;
  status?: 'success' | 'failed';
}

export interface HederaAgentMetrics {
  agent: string;
  completions: number;
  failures: number;
  revenueUsdc: string;
  rating: string;
  lastCompletionAt: string | null;
  mode: HederaMode;
}

type HederaCompletionEvent = {
  version: 1;
  type: string;
  agent: string;
  callerAgent: string | null;
  requester: string | null;
  priceUsdc: string;
  paymentNetwork: string | null;
  paymentTransaction: string | null;
  status: 'success' | 'failed';
  createdAt: string;
};

type MirrorTopicMessage = {
  consensus_timestamp?: string;
  message?: string;
  payer_account_id?: string;
  running_hash?: string;
  sequence_number?: number;
};

function getHederaConfig() {
  return {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK ?? 'testnet',
    topicId: process.env.HEDERA_TOPIC_ID,
    mirrorNodeUrl: process.env.HEDERA_MIRROR_NODE_URL,
  };
}

function getMirrorBaseUrl(network: string) {
  switch (network) {
    case 'mainnet':
      return 'https://mainnet.mirrornode.hedera.com/api/v1';
    case 'previewnet':
      return 'https://previewnet.mirrornode.hedera.com/api/v1';
    case 'testnet':
    default:
      return 'https://testnet.mirrornode.hedera.com/api/v1';
  }
}

function hasLiveHederaConfig() {
  const config = getHederaConfig();

  return Boolean(config.accountId && config.privateKey && config.topicId);
}

function createHederaClient() {
  if (!hasLiveHederaConfig()) {
    return null;
  }

  const config = getHederaConfig();
  const client =
    config.network === 'mainnet'
      ? Client.forMainnet()
      : config.network === 'previewnet'
        ? Client.forPreviewnet()
        : Client.forTestnet();

  client.setOperator(
    AccountId.fromString(config.accountId!),
    PrivateKey.fromString(config.privateKey!),
  );

  return client;
}

function toPositiveNumber(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function clampRating(value: number) {
  return Math.max(1, Math.min(5, value));
}

function calculateRating(completions: number, failures: number) {
  const score = clampRating(
    4.5 + Math.min(0.49, completions * 0.04) - Math.min(1.75, failures * 0.35),
  );

  return score.toFixed(2);
}

function buildCompletionEvent(
  input: ServiceCompletionLogInput,
): HederaCompletionEvent | null {
  if (!input.agent) {
    return null;
  }

  return {
    version: 1,
    type: input.type ?? 'service_completed',
    agent: input.agent,
    callerAgent: input.callerAgent ?? null,
    requester: input.requester ?? null,
    priceUsdc: input.priceUsdc ?? '0',
    paymentNetwork: input.paymentNetwork ?? null,
    paymentTransaction: input.paymentTransaction ?? null,
    status: input.status ?? 'success',
    createdAt: new Date().toISOString(),
  };
}

function decodeMirrorMessage(record: MirrorTopicMessage) {
  if (!record.message) {
    return null;
  }

  try {
    const payload = Buffer.from(record.message, 'base64').toString('utf8');
    const parsed = JSON.parse(payload) as Partial<HederaCompletionEvent>;

    if (!parsed.agent) {
      return null;
    }

    return {
      ...parsed,
      createdAt:
        parsed.createdAt ??
        (record.consensus_timestamp
          ? new Date(Number.parseFloat(record.consensus_timestamp) * 1000).toISOString()
          : new Date().toISOString()),
    } as HederaCompletionEvent;
  } catch {
    return null;
  }
}

async function fetchTopicMessages(limitPages = 5) {
  const config = getHederaConfig();

  if (!config.topicId) {
    return [];
  }

  const baseUrl = config.mirrorNodeUrl ?? getMirrorBaseUrl(config.network);
  const origin = new URL(baseUrl).origin;
  let url = `${baseUrl}/topics/${config.topicId}/messages?limit=100&order=desc`;
  const messages: MirrorTopicMessage[] = [];

  for (let page = 0; page < limitPages && url; page += 1) {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'A2A/0.1',
      },
    });

    if (!response.ok) {
      throw new Error(`Mirror Node returned ${response.status}.`);
    }

    const payload = (await response.json()) as {
      messages?: MirrorTopicMessage[];
      links?: { next?: string | null };
    };

    messages.push(...(payload.messages ?? []));

    if (!payload.links?.next) {
      break;
    }

    url = new URL(payload.links.next, origin).toString();
  }

  return messages;
}

function createEmptyMetrics(agent: string, mode: HederaMode): HederaAgentMetrics {
  return {
    agent,
    completions: 0,
    failures: 0,
    revenueUsdc: '0.000000',
    rating: '4.50',
    lastCompletionAt: null,
    mode,
  };
}

export async function logServiceCompletion(input: ServiceCompletionLogInput) {
  const event = buildCompletionEvent(input);

  if (!event || !hasLiveHederaConfig()) {
    return {
      provider: 'hedera',
      mode: 'stub' as const,
      input,
    };
  }

  const client = createHederaClient();

  if (!client) {
    return {
      provider: 'hedera',
      mode: 'stub' as const,
      input,
    };
  }

  try {
    const config = getHederaConfig();
    const response = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(config.topicId!))
      .setMessage(JSON.stringify(event))
      .execute(client);
    const receipt = await response.getReceipt(client);

    return {
      provider: 'hedera',
      mode: 'live' as const,
      topicId: config.topicId,
      transactionId: response.transactionId.toString(),
      topicSequenceNumber:
        typeof receipt.topicSequenceNumber !== 'undefined'
          ? String(receipt.topicSequenceNumber)
          : null,
      event,
    };
  } finally {
    client.close();
  }
}

export async function getAgentReputationMap(agentNames: string[]) {
  if (agentNames.length === 0) {
    return new Map<string, HederaAgentMetrics>();
  }

  const emptyMap = new Map<string, HederaAgentMetrics>(
    agentNames.map((agent) => [agent, createEmptyMetrics(agent, 'stub')]),
  );

  if (!hasLiveHederaConfig()) {
    return emptyMap;
  }

  try {
    const messages = await fetchTopicMessages();
    const wanted = new Set(agentNames);
    const metrics = new Map<string, HederaAgentMetrics>(
      agentNames.map((agent) => [agent, createEmptyMetrics(agent, 'live')]),
    );

    for (const record of messages) {
      const decoded = decodeMirrorMessage(record);

      if (!decoded || !wanted.has(decoded.agent)) {
        continue;
      }

      const current = metrics.get(decoded.agent) ?? createEmptyMetrics(decoded.agent, 'live');
      const nextCompletions =
        decoded.status === 'success' && decoded.type === 'service_completed'
          ? current.completions + 1
          : current.completions;
      const nextFailures =
        decoded.status === 'failed' || decoded.type === 'service_failed'
          ? current.failures + 1
          : current.failures;
      const nextRevenue =
        decoded.status === 'success' && decoded.type === 'service_completed'
          ? toPositiveNumber(current.revenueUsdc) + toPositiveNumber(decoded.priceUsdc)
          : toPositiveNumber(current.revenueUsdc);
      const lastCompletionAt =
        current.lastCompletionAt ?? decoded.createdAt ?? null;

      metrics.set(decoded.agent, {
        agent: decoded.agent,
        completions: nextCompletions,
        failures: nextFailures,
        revenueUsdc: nextRevenue.toFixed(6),
        rating: calculateRating(nextCompletions, nextFailures),
        lastCompletionAt,
        mode: 'live',
      });
    }

    return metrics;
  } catch {
    return emptyMap;
  }
}

export async function getAgentReputation(agentName: string) {
  const metrics = await getAgentReputationMap([agentName]);
  return metrics.get(agentName) ?? createEmptyMetrics(agentName, 'stub');
}
