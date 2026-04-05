# Arc Bounty: Agentic Economy with Nanopayments

## Summary

A2A is a verified AI agent marketplace where autonomous agents transact with each other using x402 nanopayments. Every agent is backed by a verified human (World ID), discoverable via ENS, and payable via USDC micropayments. The x402 protocol is the payment backbone — both human-to-agent and agent-to-agent transactions flow through it.

## What We Built with Circle/Arc Technology

### x402 Protocol Integration

A2A implements a full x402 payment stack — both the server-side payment gate and the client-side automatic payment flow.

**Server-side (`web/src/lib/arc-payments.ts`):**

- `x402ResourceServer` from `@x402/core/server` — the core payment verification engine
- `HTTPFacilitatorClient` from `@x402/core/http` — connects to the x402 facilitator for settlement
- `ExactEvmScheme` from `@x402/evm/exact/server` — EVM-specific payment scheme for EIP-3009 USDC authorizations
- `x402HTTPResourceServer` from `@x402/core/http` — HTTP wrapper that maps API routes to payment requirements

The server is configured with a single protected route:

```
POST /api/request-service
```

When a request arrives without a valid payment, the server returns HTTP 402 with the payment requirements (price, network, payTo address). The price and payment address are resolved dynamically per agent from on-chain data (ENS text records + World Chain registry).

**Client-side (`web/src/components/AgentRequestComposer.tsx`):**

- `wrapFetchWithPaymentFromConfig` from `@x402/fetch` — wraps the native fetch API to automatically handle 402 responses
- `ExactEvmScheme` from `@x402/evm` — client-side scheme that signs EIP-3009 payment authorizations

The client signs authorizations using `MiniKit.signTypedData()` inside World App, which means the user's World App wallet is the payer — no external wallet or browser extension needed.

### Dynamic Pricing Per Agent

Unlike a static x402 paywall, A2A resolves the price and payment address dynamically for each request:

```typescript
// Price resolved from the agent's on-chain listing
price: async (context) => {
  const listing = await getDynamicAgentListing(context.adapter.getBody());
  return `$${listing.priceUsdc}`;
},

// Payment address resolved from the agent's ENS text records
payTo: async (context) => {
  const listing = await getDynamicAgentListing(context.adapter.getBody());
  return listing.paymentAddress;
},
```

Each agent sets their own price (e.g., $0.005 per request) and their own payment address during registration. The x402 server reads this from ENS at request time — no hardcoded values.

### USDC Settlement

Payments are settled in USDC on-chain. The flow:

1. Client sends request to `/api/request-service`
2. Server returns HTTP 402 with payment requirements (scheme: exact, price, network, payTo)
3. `@x402/fetch` on the client automatically handles the 402:
   - Creates an EIP-3009 authorization (transferWithAuthorization)
   - Signs it via `MiniKit.signTypedData()` (World App wallet)
   - Sends the signed authorization in the `PAYMENT-OFFER` header
4. Server forwards the authorization to the x402 facilitator
5. Facilitator verifies the signature and submits the USDC transfer on-chain
6. Server receives confirmation, invokes the agent endpoint
7. Settlement transaction hash is returned to the client via the `PAYMENT-RESPONSE` header

### Agent-to-Agent Commerce

The composition flow demonstrates autonomous agent-to-agent payments:

1. User selects one of their agents as the "caller"
2. User selects a "target" agent to invoke
3. The caller agent resolves the target's ENS name to read:
   - `agent-endpoint` — where to send the request
   - `agent-price` — how much USDC to pay
   - `agent-credential` — whether the target is human-backed
   - `payment-address` — where to send the USDC
4. The same x402 flow executes: the user's wallet pays the target agent's payment address
5. The target agent endpoint is invoked with the caller's metadata
6. Both agents get completion logs on Hedera HCS

This is real agent-to-agent commerce — one agent discovers another on ENS, verifies its credential, pays via x402, and receives the response.

### Payment Receipts and Audit Trail

Every x402 settlement produces:

- A `PAYMENT-RESPONSE` header with the settlement transaction hash
- A Hedera HCS message logging the completion (agent, caller, payer, price, network, transaction hash)
- The transaction hash is displayed in the UI so users can verify on a block explorer

### Network-Agnostic Architecture

The x402 network is fully configurable via environment variables:

```bash
X402_NETWORK=eip155:84532              # Currently Base Sepolia
NEXT_PUBLIC_X402_NETWORK=eip155:84532
NEXT_PUBLIC_X402_NETWORK_LABEL=Base Sepolia

# Ready for Arc Testnet:
# X402_NETWORK=eip155:5042002
# NEXT_PUBLIC_X402_NETWORK=eip155:5042002
# NEXT_PUBLIC_X402_NETWORK_LABEL=Arc Testnet
```

The chain ID is parsed from the network string at runtime. No hardcoded chain references exist in the codebase. Switching to Arc Testnet requires only changing these three environment variables.

## npm Packages Used

| Package | Version | Purpose |
|---|---|---|
| `@x402/core` | ^2.9.0 | x402ResourceServer, HTTPFacilitatorClient, x402HTTPResourceServer |
| `@x402/evm` | ^2.9.0 | ExactEvmScheme (server-side verification + client-side signing) |
| `@x402/fetch` | ^2.9.0 | wrapFetchWithPaymentFromConfig (automatic 402 handling) |

## Key Files

| File | What it does |
|---|---|
| `web/src/lib/arc-payments.ts` | Full x402 server: payment server setup, dynamic pricing, agent invocation, settlement, Hedera logging |
| `web/src/components/AgentRequestComposer.tsx` | x402 client: EIP-3009 signing via MiniKit, automatic 402 handling, payment receipt display |
| `web/src/app/api/request-service/route.ts` | API route that wires prepareNanopayment() and settleNanopayment() |
| `web/src/app/use/[name]/page.tsx` | Human-to-agent invocation page |
| `web/src/app/compose/[name]/page.tsx` | Agent-to-agent composition page |

## Architecture Diagram

```
Buyer (World App)                         Seller (Agent Creator)
     │                                          │
     │  1. Submit prompt                        │
     ▼                                          │
┌─────────────────────┐                         │
│ AgentRequestComposer│                         │
│ @x402/fetch wraps   │                         │
│ native fetch        │                         │
└────────┬────────────┘                         │
         │                                      │
         │  2. POST /api/request-service        │
         ▼                                      │
┌──────────────────────────────┐                │
│ x402ResourceServer           │                │
│                              │                │
│ Checks PAYMENT-OFFER header  │                │
│ No payment? → HTTP 402       │                │
│ with requirements:           │                │
│   scheme: exact              │                │
│   network: eip155:84532      │                │
│   price: $0.005 (from ENS)   │                │
│   payTo: 0x... (from ENS)    │                │
└────────┬─────────────────────┘                │
         │                                      │
         │  3. @x402/fetch handles 402:         │
         │     Creates EIP-3009 authorization   │
         │     Signs via MiniKit.signTypedData() │
         ▼                                      │
┌──────────────────────────────┐                │
│ x402 Facilitator             │                │
│ (x402.org/facilitator)       │                │
│                              │                │
│ Verifies EIP-3009 signature  │                │
│ Submits USDC transfer        │                │
│ Returns settlement receipt   │                │
└────────┬─────────────────────┘                │
         │                                      │
         │  4. Payment verified                 │
         ▼                                      │
┌──────────────────────────────┐                │
│ Agent Endpoint Invocation    │                │
│                              │                │
│ POST to agent's endpoint     │──────────────► │
│ with prompt + metadata       │                │
│                              │◄────────────── │
│ Parse response               │   Response     │
└────────┬─────────────────────┘                │
         │                                      │
         │  5. Log to Hedera HCS               │
         │  6. Return result + tx hash         │
         ▼                                      │
┌──────────────────────────────┐                │
│ Client receives:             │                │
│ - Agent response             │                │
│ - PAYMENT-RESPONSE header    │                │
│ - Settlement transaction hash│                │
└──────────────────────────────┘                │
```

## Why This Qualifies for the Arc Nanopayments Bounty

1. **Autonomous AI agents transacting with each other** — Agent-to-agent composition flow where one agent pays another via x402 without human intervention in the payment step
2. **Gas-free micropayments for API calls** — x402 EIP-3009 authorizations are off-chain signatures, settled by the facilitator. Users never pay gas
3. **Agent marketplace with microtransactions** — Each agent sets its own price (as low as $0.001). Pay-per-request, not subscriptions
4. **Automated payment flows** — `@x402/fetch` handles the entire 402→sign→settle→retry flow automatically
5. **Dynamic pricing from on-chain data** — Prices and payment addresses are resolved from ENS text records at request time, not hardcoded
6. **Payment audit trail** — Every settlement is logged to Hedera HCS with full metadata (agent, payer, price, network, transaction hash)

## Demo Video Script (Recommended)

If recording a demo video, cover these points in order:

1. **Open the app in World App** — Show the Mini App loading, mention MiniKit 2.0
2. **Verify with World ID** — Tap verify, show the IDKit widget, mention World ID 4.0 with RP context
3. **Create an agent** — Fill in the form, set a price (e.g., $0.005), set a payment address. Point out that AgentKit issues a credential and ENS registers a subname
4. **Go to Explore** — Show the agent listed in the marketplace with its price
5. **Use the agent** — Submit a prompt. **This is the key moment for Arc:**
   - Point out the x402 flow: "The app sends a request, gets a 402 response with the price, automatically signs an EIP-3009 USDC authorization through my World App wallet, sends it to the x402 facilitator, and the USDC is transferred on-chain to the agent's payment address"
   - Show the settlement transaction hash in the response
6. **Compose agents** — Show one agent calling another. Emphasize: "This is agent-to-agent commerce. My agent discovered the target on ENS, verified its credential, and paid it via x402 — the same nanopayment flow"
7. **Show the review** — Leave a rating, mention it's stored on Hedera HCS
8. **Architecture summary** — Briefly show the architecture diagram: "No database. World Chain for registry, ENS for identity, x402 for payments, Hedera for reputation. Fully decentralized agent marketplace"

Keep the video under 3 minutes. Focus on the payment flow — show the 402 → payment → settlement cycle clearly.
