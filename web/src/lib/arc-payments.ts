import { logServiceCompletion } from '@/lib/hedera';
import { getAgentListingByEnsName, type AgentListing } from '@/lib/marketplace';
import { HTTPFacilitatorClient, x402HTTPResourceServer } from '@x402/core/http';
import { x402ResourceServer } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { NextResponse } from 'next/server';

type RequestServicePayload = {
  agentName?: string;
  prompt?: string;
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

export function getX402ClientConfig() {
  return {
    network: getX402Config().network as `${string}:${string}`,
    chainId: 84532,
  };
}

export async function prepareNanopayment(
  request: Request,
  input: RequestServicePayload,
): Promise<PreparedPaymentContext> {
  const agentName = typeof input.agentName === 'string' ? input.agentName : '';
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';

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
  const result = buildMockAgentResult(context.listing, context.payload.prompt);
  const responseBody = {
    ok: true,
    mode: 'x402',
    agent: context.listing.ensName,
    priceUsdc: context.listing.priceUsdc,
    network: getX402Config().network,
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
    requester: settlement.payer ?? null,
    priceUsdc: context.listing.priceUsdc,
    paymentNetwork: settlement.network,
    paymentTransaction: settlement.transaction,
  }).catch((error) => ({
    provider: 'hedera',
    mode: 'error',
    message: error instanceof Error ? error.message : 'Unknown Hedera error.',
  }));

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
    },
    headers: settlement.headers,
  };
}
