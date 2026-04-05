import { resolveAgentProfile } from '@/lib/ens';
import { logServiceCompletion } from '@/lib/hedera';
import { getAgentListingByEnsName, type AgentListing } from '@/lib/agents';
import { HTTPFacilitatorClient, x402HTTPResourceServer } from '@x402/core/http';
import { x402ResourceServer } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { NextResponse } from 'next/server';

type RequestServicePayload = {
  agentName?: string;
  prompt?: string;
  callerAgentName?: string;
};

type RequestAdapter = {
  getHeader(name: string): string | undefined;
  getMethod(): string;
  getPath(): string;
  getUrl(): string;
  getAcceptHeader(): string;
  getUserAgent(): string;
  getBody(): unknown;
};

type PreparedPaymentContext =
  | {
      type: 'response';
      response: NextResponse;
    }
  | {
      type: 'ready';
      listing: AgentListing;
      payload: {
        agentName: string;
        prompt: string;
        callerAgentName?: string;
      };
      callerAgent: AgentListing | null;
      targetVerification: {
        verificationLevel: string | null;
        credentialHash: string | null;
      };
      requestContext: {
        adapter: RequestAdapter;
        path: string;
        method: string;
      };
      paymentPayload: Record<string, unknown>;
      paymentRequirements: Record<string, unknown>;
      declaredExtensions?: Record<string, unknown>;
    };

declare global {
  var __a2aX402ServerPromise:
    | Promise<x402HTTPResourceServer>
    | undefined;
}

function getX402Config() {
  return {
    facilitatorUrl:
      process.env.X402_FACILITATOR_URL ?? 'https://x402.org/facilitator',
    network: (process.env.X402_NETWORK ??
      'eip155:84532') as `${string}:${string}`,
  };
}

function createRequestAdapter(request: Request, body: unknown): RequestAdapter {
  const url = new URL(request.url);

  return {
    getHeader(name: string) {
      return request.headers.get(name) ?? undefined;
    },
    getMethod() {
      return request.method;
    },
    getPath() {
      return url.pathname;
    },
    getUrl() {
      return request.url;
    },
    getAcceptHeader() {
      return request.headers.get('accept') ?? 'application/json';
    },
    getUserAgent() {
      return request.headers.get('user-agent') ?? '';
    },
    getBody() {
      return body;
    },
  };
}

function toNextResponse(response: {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  isHtml?: boolean;
}) {
  if (response.isHtml) {
    return new NextResponse(String(response.body ?? ''), {
      status: response.status,
      headers: response.headers,
    });
  }

  return NextResponse.json(response.body ?? {}, {
    status: response.status,
    headers: response.headers,
  });
}

async function getDynamicAgentListing(body: unknown) {
  if (!body || typeof body !== 'object' || !('agentName' in body)) {
    return null;
  }

  const agentName = typeof body.agentName === 'string' ? body.agentName : '';

  if (!agentName) {
    return null;
  }

  return getAgentListingByEnsName(agentName);
}

async function getPaymentServer() {
  if (!globalThis.__a2aX402ServerPromise) {
    const config = getX402Config();
    const facilitatorClient = new HTTPFacilitatorClient({
      url: config.facilitatorUrl,
    });
    const resourceServer = new x402ResourceServer(facilitatorClient).register(
      'eip155:*',
      new ExactEvmScheme(),
    );
    const httpServer = new x402HTTPResourceServer(resourceServer, {
      'POST /api/request-service': {
        accepts: {
          scheme: 'exact',
          network: config.network,
          payTo: async (context) => {
            const listing = await getDynamicAgentListing(
              context.adapter.getBody ? context.adapter.getBody() : undefined,
            );

            if (!listing?.paymentAddress) {
              throw new Error(
                'This agent is missing a payment address for x402 settlement.',
              );
            }

            return listing.paymentAddress;
          },
          price: async (context) => {
            const listing = await getDynamicAgentListing(
              context.adapter.getBody ? context.adapter.getBody() : undefined,
            );

            if (!listing) {
              throw new Error('Agent listing not found.');
            }

            return `$${listing.priceUsdc}`;
          },
        },
        description: 'Paid A2A agent request',
        mimeType: 'application/json',
        unpaidResponseBody: async (context) => {
          const body = context.adapter.getBody
            ? context.adapter.getBody()
            : undefined;
          const listing = await getDynamicAgentListing(body);

          return {
            contentType: 'application/json',
            body: {
              ok: false,
              mode: 'x402',
              message: 'Payment required before this agent can be invoked.',
              agent: listing?.ensName ?? null,
              priceUsdc: listing?.priceUsdc ?? null,
              network: getX402Config().network,
            },
          };
        },
      },
    });

    globalThis.__a2aX402ServerPromise = httpServer.initialize().then(() => httpServer);
  }

  return globalThis.__a2aX402ServerPromise;
}

function buildMockAgentResult(listing: AgentListing, prompt: string) {
  const normalizedPrompt = prompt.trim();
  const lowerPrompt = normalizedPrompt.toLowerCase();
  const sentiment =
    lowerPrompt.includes('bull') || lowerPrompt.includes('up')
      ? 'bullish'
      : lowerPrompt.includes('bear') || lowerPrompt.includes('down')
        ? 'bearish'
        : 'mixed';

  return {
    summary: `${listing.agentName} processed your request and produced a ${sentiment} outlook.`,
    prompt: normalizedPrompt,
    highlights: [
      `Category: ${listing.category}`,
      `Capabilities: ${listing.capabilities.join(', ') || 'general analysis'}`,
      `Endpoint source: ${listing.endpoint}`,
    ],
    verdict:
      sentiment === 'bullish'
        ? 'Momentum remains constructive with positive trend continuation risk.'
        : sentiment === 'bearish'
          ? 'Risk remains elevated and downside protection should be considered.'
          : 'Signals are balanced and require confirmation from fresh data.',
  };
}

function getEnsRecords(profile: Awaited<ReturnType<typeof resolveAgentProfile>>) {
  if (
    typeof profile === 'object' &&
    profile !== null &&
    'records' in profile &&
    profile.records &&
    typeof profile.records === 'object'
  ) {
    return profile.records as Record<string, string>;
  }

  return {};
}

function toHighlightList(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 6);
}

function summarizeObject(value: Record<string, unknown>) {
  const preferredKeys = ['summary', 'result', 'output', 'message', 'answer'];

  for (const key of preferredKeys) {
    const candidate = value[key];

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return JSON.stringify(value).slice(0, 220);
}

function normalizeLiveAgentResult(
  listing: AgentListing,
  prompt: string,
  payload: unknown,
  upstreamStatus: number,
) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const value = payload as Record<string, unknown>;
    const summary =
      typeof value.summary === 'string' && value.summary.trim()
        ? value.summary.trim()
        : `${listing.agentName} returned a live response.`;
    const verdict =
      typeof value.verdict === 'string' && value.verdict.trim()
        ? value.verdict.trim()
        : summarizeObject(value);
    const highlights = [
      ...toHighlightList(value.highlights),
      `Endpoint source: ${listing.endpoint}`,
      `Upstream status: ${upstreamStatus}`,
    ].slice(0, 6);

    return {
      summary,
      prompt:
        typeof value.prompt === 'string' && value.prompt.trim()
          ? value.prompt.trim()
          : prompt,
      highlights,
      verdict,
      raw: payload,
    };
  }

  if (typeof payload === 'string' && payload.trim()) {
    return {
      summary: `${listing.agentName} returned a live response.`,
      prompt,
      highlights: [
        `Endpoint source: ${listing.endpoint}`,
        `Upstream status: ${upstreamStatus}`,
      ],
      verdict: payload.trim(),
      raw: payload,
    };
  }

  return {
    ...buildMockAgentResult(listing, prompt),
    summary: `${listing.agentName} responded, but no structured payload was returned.`,
    highlights: [
      `Category: ${listing.category}`,
      `Endpoint source: ${listing.endpoint}`,
      `Upstream status: ${upstreamStatus}`,
    ],
    raw: payload,
  };
}

async function parseEndpointResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => '');
}

async function invokeAgentEndpoint(
  listing: AgentListing,
  prompt: string,
  requester: string | null,
  callerAgent: AgentListing | null,
) {
  const response = await fetch(listing.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
      'User-Agent': 'A2A/0.1',
    },
    body: JSON.stringify({
      prompt,
      agent: {
        ensName: listing.ensName,
        category: listing.category,
        capabilities: listing.capabilities,
        priceUsdc: listing.priceUsdc,
      },
      callerAgent: callerAgent
        ? {
            ensName: callerAgent.ensName,
            category: callerAgent.category,
            capabilities: callerAgent.capabilities,
            credentialHash: callerAgent.credentialHash,
          }
        : undefined,
      requester: requester ?? undefined,
      source: 'a2a-mini-app',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await parseEndpointResponse(response);

  if (!response.ok) {
    let message = `Agent endpoint returned ${response.status}.`;

    if (typeof payload === 'string' && payload.trim()) {
      message = payload.trim().slice(0, 240);
    } else if (payload && typeof payload === 'object' && 'message' in payload) {
      message = String(payload.message).slice(0, 240);
    }

    throw new Error(message);
  }

  return normalizeLiveAgentResult(listing, prompt, payload, response.status);
}

export function getX402ClientConfig() {
  const config = getX402Config();
  const chainId = Number(config.network.split(':')[1]) || 84532;

  return {
    network: config.network as `${string}:${string}`,
    chainId,
    networkLabel: process.env.NEXT_PUBLIC_X402_NETWORK_LABEL ?? 'Base Sepolia',
  };
}

export async function prepareNanopayment(
  request: Request,
  input: RequestServicePayload,
): Promise<PreparedPaymentContext> {
  const agentName = typeof input.agentName === 'string' ? input.agentName : '';
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';
  const callerAgentName =
    typeof input.callerAgentName === 'string' ? input.callerAgentName : '';

  if (!agentName || !prompt.trim()) {
    return {
      type: 'response',
      response: NextResponse.json(
        {
          ok: false,
          message: 'agentName and prompt are required.',
        },
        { status: 400 },
      ),
    };
  }

  const listing = await getAgentListingByEnsName(agentName);
  const callerAgent = callerAgentName
    ? await getAgentListingByEnsName(callerAgentName)
    : null;

  if (!listing) {
    return {
      type: 'response',
      response: NextResponse.json(
        {
          ok: false,
          message: 'Agent listing not found.',
        },
        { status: 404 },
      ),
    };
  }

  if (!listing.paymentAddress) {
    return {
      type: 'response',
      response: NextResponse.json(
        {
          ok: false,
          message: 'This agent does not have a payment address configured.',
        },
        { status: 409 },
      ),
    };
  }

  if (callerAgentName) {
    if (!callerAgent) {
      return {
        type: 'response',
        response: NextResponse.json(
          {
            ok: false,
            message: 'Calling agent was not found.',
          },
          { status: 404 },
        ),
      };
    }

    if (callerAgent.ensName === listing.ensName) {
      return {
        type: 'response',
        response: NextResponse.json(
          {
            ok: false,
            message: 'An agent cannot compose with itself.',
          },
          { status: 409 },
        ),
      };
    }

    if (!callerAgent.credentialHash) {
      return {
        type: 'response',
        response: NextResponse.json(
          {
            ok: false,
            message: 'The calling agent is missing its human-backed credential.',
          },
          { status: 409 },
        ),
      };
    }
  }

  const targetProfile = await resolveAgentProfile(listing.ensName);
  const targetRecords = getEnsRecords(targetProfile);
  const targetVerificationLevel =
    targetRecords['world-verification'] ?? listing.verificationLevel ?? null;
  const targetCredentialHash =
    targetRecords['agent-credential'] ?? listing.credentialHash ?? null;

  if (!targetVerificationLevel || !targetCredentialHash) {
    return {
      type: 'response',
      response: NextResponse.json(
        {
          ok: false,
          message:
            'The target agent is missing required ENS verification or credential metadata.',
        },
        { status: 409 },
      ),
    };
  }

  const adapter = createRequestAdapter(request, { agentName, prompt });
  const requestContext = {
    adapter,
    path: adapter.getPath(),
    method: adapter.getMethod(),
  };
  const httpServer = await getPaymentServer();
  const result = await httpServer.processHTTPRequest(requestContext, {
    appName: 'A2A',
    testnet: true,
    currentUrl: adapter.getUrl(),
  });

  if (result.type === 'payment-error') {
    return {
      type: 'response',
      response: toNextResponse(result.response),
    };
  }

  if (result.type !== 'payment-verified') {
    return {
      type: 'response',
      response: NextResponse.json(
        {
          ok: false,
          message: 'Unexpected x402 state.',
        },
        { status: 500 },
      ),
    };
  }

  return {
    type: 'ready',
    listing,
    payload: {
      agentName,
      prompt: prompt.trim(),
      callerAgentName: callerAgentName || undefined,
    },
    callerAgent,
    targetVerification: {
      verificationLevel: targetVerificationLevel,
      credentialHash: targetCredentialHash,
    },
    requestContext,
    paymentPayload: result.paymentPayload,
    paymentRequirements: result.paymentRequirements,
    declaredExtensions: result.declaredExtensions,
  };
}

export async function settleNanopayment(
  context: Extract<PreparedPaymentContext, { type: 'ready' }>,
) {
  const httpServer = await getPaymentServer();
  let result;

  try {
    result = await invokeAgentEndpoint(
      context.listing,
      context.payload.prompt,
      null,
      context.callerAgent,
    );
  } catch (error) {
    return {
      type: 'response' as const,
      response: NextResponse.json(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'Agent endpoint invocation failed.',
        },
        { status: 502 },
      ),
    };
  }

  const responseBody = {
    ok: true,
    mode: 'x402',
    agent: context.listing.ensName,
    callerAgent: context.callerAgent?.ensName ?? null,
    priceUsdc: context.listing.priceUsdc,
    network: getX402Config().network,
    targetVerification: context.targetVerification,
    result,
  };
  const settlement = await httpServer.processSettlement(
    context.paymentPayload as never,
    context.paymentRequirements as never,
    context.declaredExtensions,
    {
      request: context.requestContext,
      responseBody: Buffer.from(JSON.stringify(responseBody), 'utf8'),
    },
  );

  if (!settlement.success) {
    return {
      type: 'response' as const,
      response: toNextResponse(settlement.response),
    };
  }

  const completionLog = await logServiceCompletion({
    type: 'service_completed',
    agent: context.listing.ensName,
    callerAgent: context.callerAgent?.ensName ?? null,
    requester: settlement.payer ?? null,
    priceUsdc: context.listing.priceUsdc,
    paymentNetwork: settlement.network,
    paymentTransaction: settlement.transaction,
  }).catch((error) => ({
    provider: 'hedera',
    mode: 'error',
    message: error instanceof Error ? error.message : 'Unknown Hedera error.',
  }));
  const compositionLog = context.callerAgent
    ? await logServiceCompletion({
        type: 'service_composed',
        agent: context.callerAgent.ensName,
        callerAgent: context.callerAgent.ensName,
        requester: settlement.payer ?? null,
        priceUsdc: context.listing.priceUsdc,
        paymentNetwork: settlement.network,
        paymentTransaction: settlement.transaction,
      }).catch((error) => ({
        provider: 'hedera',
        mode: 'error',
        message: error instanceof Error ? error.message : 'Unknown Hedera error.',
      }))
    : null;

  return {
    type: 'settled' as const,
    body: {
      ...responseBody,
      payment: {
        payer: settlement.payer ?? null,
        network: settlement.network,
        transaction: settlement.transaction,
      },
      completionLog,
      compositionLog,
    },
    headers: settlement.headers,
  };
}
