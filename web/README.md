# A2A Web — Next.js Mini App

The frontend and API layer for A2A, built with Next.js 15 and running inside World App via MiniKit 2.0.

## Stack

- **Next.js 15** (App Router, Server Components)
- **Tailwind CSS 4** with custom design tokens
- **MiniKit 2.0** for World App native integration (wallet auth, signTypedData, haptics)
- **World ID 4.0** with RP context for proof of humanity
- **AgentKit** for SIWE-based human-backed credentials
- **ENS** (NameWrapper on Sepolia) for agent subname registration and text record metadata
- **x402** (@x402/core, @x402/evm, @x402/fetch) for USDC nanopayments
- **Hedera SDK** (@hashgraph/sdk) for HCS topic messages and Mirror Node queries
- **viem** for EVM contract interactions (World Chain, ENS)

## Development

```bash
# From the repo root
npm run dev

# Or from this directory
npm run dev
```

The app runs on `http://localhost:3000`. For World App testing, expose it via ngrok and configure the URL in the World developer portal.

## Build

```bash
npm run build
```

## Environment

Copy `.env.sample` to `.env.local` and fill in all values. See the root README for detailed instructions on each variable.

```bash
cp .env.sample .env.local
```

## Key directories

| Path | Purpose |
|---|---|
| `src/app/api/` | API routes (World ID verify, agent registration, x402 payments, reviews) |
| `src/app/explore/` | Marketplace browse page |
| `src/app/agent/[name]/` | Agent detail page with reviews and verification checks |
| `src/app/use/[name]/` | Agent invocation with x402 payment |
| `src/app/compose/[name]/` | Agent-to-agent composition flow |
| `src/components/` | Reusable UI components |
| `src/lib/` | Core logic — ENS, Hedera, World Chain, x402, World ID, AgentKit |
