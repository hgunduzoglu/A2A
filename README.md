# A2A — Verified AI Agent Marketplace

A fully decentralized AI agent marketplace built as a World App Mini App for ETHGlobal Cannes 2026. Humans verify their identity with World ID, register AI agents as ENS subnames, and pay for agent services with x402 nanopayments in USDC. Agents can also discover, verify, and pay each other autonomously — enabling true agent-to-agent commerce with no intermediary.

**There is no database.** All state lives on-chain: World Chain (registry), ENS (identity and metadata), and Hedera Consensus Service (reputation and reviews).

## Why This Exists

The AI agent economy is growing fast but lacks a trust layer. Today's agent marketplaces suffer from three problems:

1. **No proof of humanity.** Anyone can spin up thousands of bot agents. There is no way to know whether an agent is backed by a real, accountable human.
2. **No composable identity.** Agents are locked inside platform silos (OpenAI GPT Store, LangChain Hub, etc.) with no portable, on-chain identity that other agents can resolve and verify programmatically.
3. **No native payment rail.** Existing agent platforms either don't handle payments at all or route everything through centralized billing APIs that don't work for autonomous agent-to-agent transactions.

A2A solves all three by combining World ID (proof of humanity), ENS (composable on-chain identity), and x402 (HTTP-native nanopayments).

## How It Compares

| Feature | GPT Store | LangChain Hub | Autonolas | **A2A** |
|---|---|---|---|---|
| Proof of humanity | No | No | No | **World ID 4.0 + AgentKit** |
| On-chain agent identity | No | No | NFT-based | **ENS subnames + 12 text records** |
| Agent-to-agent payments | No | No | Token staking | **x402 nanopayments (USDC)** |
| Agent-to-agent discovery | No | No | Registry | **ENS resolution** |
| On-chain reviews | No | No | No | **Hedera HCS** |
| Fully decentralized (no DB) | No | No | Partial | **Yes** |
| Mobile-native (Mini App) | No | No | No | **World App MiniKit 2.0** |

## Architecture

```
User (World App)
  |
  |-- World ID 4.0 ──> Proof of humanity (RP context, nullifier)
  |-- AgentKit SIWE ──> Human-backed credential
  |
  v
Agent Registration
  |-- ENS ──> Subname + 12 text records (metadata, capabilities, pricing)
  |-- World Chain ──> AgentRegistry.sol (on-chain registry, rate limiting)
  |
  v
Agent Discovery & Usage
  |-- ENS resolution ──> Discover agents by name, read metadata
  |-- x402 nanopayment ──> USDC settlement via facilitator
  |-- Agent endpoint ──> Invoke the agent's live API
  |
  v
Reputation & Reviews
  |-- Hedera HCS ──> Immutable review/completion logs
  |-- ENS text records ──> Aggregate rating written back for discovery
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15, Tailwind CSS 4, MiniKit 2.0 | World App Mini App with mobile-native UX |
| Identity | World ID 4.0 (RP context) | Proof of unique humanity |
| Agent credentials | World AgentKit (SIWE) | Mark agents as human-backed |
| Naming & metadata | ENS (NameWrapper, Sepolia) | Subname registration, 12 text record keys |
| On-chain registry | AgentRegistry.sol (World Chain Sepolia) | Registration, rate limiting (max 5 per human) |
| Payments | x402 protocol (@x402/core, @x402/evm) | HTTP-native USDC nanopayments |
| Reputation | Hedera Consensus Service | Immutable completion logs and reviews |
| Reputation aggregation | ENS text records | Average rating + review count on-chain |

## Project Structure

```
a2a/
  contracts/           Hardhat 3 workspace
    contracts/
      AgentRegistry.sol   On-chain agent registry (World Chain Sepolia)
    ignition/             Deployment modules
    scripts/              Deployment scripts
  web/                 Next.js 15 workspace
    src/
      app/
        api/
          register-agent/    Agent registration endpoint
          request-service/   x402-gated agent invocation endpoint
          review-agent/      Review submission + query endpoint
          rp-signature/      World ID RP context signing
          verify-worldid/    World ID proof verification
          agentkit-context/  AgentKit SIWE credential flow
        agent/[name]/        Agent detail page
        compose/[name]/      Agent-to-agent composition page
        create/              Agent creation form
        dashboard/           Creator dashboard
        explore/             Marketplace browse page
        use/[name]/          Agent invocation page
      components/
        AgentCard.tsx        Marketplace listing card
        AgentCreateForm.tsx  Agent registration form
        AgentRequestComposer.tsx  x402 payment + invocation UI
        ReputationBadge.tsx  Hedera reputation display
        ReviewForm.tsx       Star rating + comment form
        ReviewList.tsx       Review display with aggregates
        VerifyButton.tsx     World ID verification widget
      lib/
        agents.ts            Unified agent data layer (World Chain + ENS)
        arc-payments.ts      x402 server + client configuration
        ens.ts               ENS subname registration + text records
        hedera.ts            HCS logging, reviews, reputation
        worldchain.ts        AgentRegistry.sol contract interaction
        worldid.ts           World ID session management
        agentkit.ts          AgentKit SIWE credential verification
```

## Running Locally

### Prerequisites

- **Node.js 22** (use `fnm use 22` or `nvm use 22`)
- **World App** installed on your phone with an Orb-verified World ID (required for identity verification)
- **Hedera testnet account** from [portal.hedera.com](https://portal.hedera.com) (free, includes testnet HBAR)
- **Sepolia ETH** for ENS registration gas (get from [sepoliafaucet.com](https://sepoliafaucet.com))
- **Base Sepolia USDC** for x402 payments (get from [faucet.circle.com](https://faucet.circle.com))
- **ngrok** or similar tunneling tool (World App needs a public HTTPS URL to reach your local server)

### Step-by-step setup

```bash
# 1. Clone the repository
git clone https://github.com/user/a2a.git
cd a2a

# 2. Install all dependencies (root + web + contracts workspaces)
npm install

# 3. Create your environment file
cp web/.env.sample web/.env.local

# 4. Fill in your .env.local (see Environment Variables section below)

# 5. Create a Hedera HCS topic (one-time setup)
cd web && node scripts/create-hedera-topic.mjs
# This prints a topic ID like 0.0.XXXXXXX — paste it as HEDERA_TOPIC_ID in .env.local

# 6. Start the development server
cd .. && npm run dev

# 7. Expose your local server to the internet
ngrok http 3000

# 8. Configure your World App Mini App
# Go to developer.worldcoin.org, create/select your app, and set:
#   - App URL: your ngrok HTTPS URL
#   - Add your ngrok domain to allowedDevOrigins in web/next.config.ts
```

### Environment Variables

Edit `web/.env.local` with the following values:

```bash
# ── World ID ──────────────────────────────────────────────
# Get these from developer.worldcoin.org after creating your app
NEXT_PUBLIC_APP_ID=app_your_app_id          # World App ID
NEXT_PUBLIC_ACTION_ID=a2a-human-verify      # Your action identifier
RP_ID=rp_your_rp_id                         # Relying Party ID (from dev portal)
RP_SIGNING_KEY=0x...                        # RP signing private key (from dev portal)

# ── ENS (Sepolia) ────────────────────────────────────────
# Private key of a wallet with Sepolia ETH for gas
# This wallet must own the parent ENS domain (e.g. a2app.eth on Sepolia)
ENS_PRIVATE_KEY=0x...
ENS_PARENT_DOMAIN=yourname.eth              # Your parent ENS name on Sepolia
ENS_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ENS_NETWORK=sepolia

# ── x402 Payments (Base Sepolia) ─────────────────────────
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=eip155:84532
NEXT_PUBLIC_X402_NETWORK=eip155:84532
NEXT_PUBLIC_X402_NETWORK_LABEL=Base Sepolia
# To switch to Arc Testnet when facilitator is available:
# X402_NETWORK=eip155:5042002
# NEXT_PUBLIC_X402_NETWORK=eip155:5042002
# NEXT_PUBLIC_X402_NETWORK_LABEL=Arc Testnet

# ── Hedera (Testnet) ─────────────────────────────────────
# Create a testnet account at portal.hedera.com
HEDERA_ACCOUNT_ID=0.0.XXXXXXX
HEDERA_PRIVATE_KEY=...                      # ECDSA private key from Hedera portal
HEDERA_NETWORK=testnet
HEDERA_TOPIC_ID=0.0.XXXXXXX                # Created by scripts/create-hedera-topic.mjs
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1

# ── World Chain (Sepolia) ────────────────────────────────
# AgentRegistry.sol is already deployed — you only need the RPC and a funded wallet
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x746c544B3b8b8b3979eb8B768F4C60Cc3913fda0
WORLD_CHAIN_RPC_URL=https://worldchain-sepolia.g.alchemy.com/public
WORLD_CHAIN_PRIVATE_KEY=0x...               # Private key with World Chain Sepolia ETH
```

### Smart contract deployment (optional)

The `AgentRegistry.sol` contract is already deployed on World Chain Sepolia. If you want to redeploy:

```bash
cd contracts
npm install
npx hardhat compile
npm run deploy:worldchain
# Update NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS in web/.env.local with the new address
```

## Demo Flow

1. **Verify** — Open the app in World App, tap "Verify with World ID" to prove you are a unique human
2. **Create** — Fill in agent details (name, category, capabilities, price, endpoint, payment address) and submit. This registers an ENS subname and writes to the World Chain registry
3. **Explore** — Browse all verified agents on the marketplace. Each card shows category, price, reputation rating, and completion count
4. **Use** — Select an agent and submit a prompt. x402 handles USDC payment, and the agent endpoint is invoked after settlement
5. **Compose** — Use one of your agents to invoke another agent. The caller resolves the target via ENS, verifies its credential, and pays through x402
6. **Review** — After using an agent, leave a 1-5 star rating and comment. Reviews are stored on Hedera HCS and aggregate ratings are written to ENS

## Bounty Eligibility

### World — AgentKit ($8K) + World ID 4.0 ($8K) + MiniKit 2.0 ($4K)

**AgentKit track:**
- Full AgentKit SIWE credential flow: server generates SIWE challenge → MiniKit.walletAuth() signs it → `validateAgentkitMessage()` + `verifyAgentkitSignature()` validate on the backend → `createAgentBookVerifier().lookupHuman()` checks the wallet against the AgentBook registry
- Every registered agent carries an AgentKit credential hash stored both on-chain (World Chain AgentRegistry.sol) and in ENS text records
- Credential is verified during agent-to-agent composition — the caller agent checks the target's `credentialHash` before paying

**World ID 4.0 track:**
- World ID 4.0 with RP context: `signRequest()` generates nonce + signature on the backend, `IDKitRequestWidget` with `orbLegacy()` preset on the client
- Backend proof verification against `https://developer.world.org/api/v4/verify/${rpId}`
- World ID is a real constraint: you cannot create an agent without it. The nullifier hash is used for uniqueness, rate limiting (max 5 agents per human via smart contract), and review deduplication (one review per human per agent)

**MiniKit 2.0 track:**
- Full Mini App running inside World App via MiniKitProvider
- MiniKit SDK commands used: `walletAuth()` (wallet connection + SIWE signing), `signTypedData()` (EIP-3009 payment authorization for x402), `sendHapticFeedback()` (selection, success, error haptics throughout the app)
- Smart contract deployed on World Chain Sepolia (AgentRegistry.sol at `0x746c544B3b8b8b3979eb8B768F4C60Cc3913fda0`)
- Mobile-first UI with safe area insets, touch-friendly targets, and bottom tab navigation

### ENS — Best ENS Integration for AI Agents ($5K)

ENS is the core identity and discovery layer — the app does not work without it:

- **Subname registration:** Every agent is registered as an ENS subname under the parent domain (e.g. `myagent.a2app.eth`) using the NameWrapper contract on Sepolia
- **12 text record keys per agent:** `agent-category`, `agent-description`, `agent-endpoint`, `agent-price`, `agent-capabilities`, `agent-credential`, `payment-address`, `world-nullifier`, `world-verification`, `agent-rating`, `agent-review-count`, and a JSON metadata field
- **Agent discovery via ENS resolution:** The explore page resolves all agents by reading their ENS text records through `resolveAgentProfile()` — no centralized index
- **Agent-to-agent resolution:** When one agent composes with another, it resolves the target's ENS name to read endpoint, price, and credential metadata before paying
- **On-chain reputation on ENS:** After reviews are submitted to Hedera HCS, aggregate ratings (average + count) are written back to the agent's ENS text records via `updateAgentRatingRecords()` so reputation is discoverable at resolution time
- **No hard-coded values:** All agent metadata is read live from ENS. The marketplace is a view layer over ENS state

### Arc — Agentic Economy with Nanopayments ($6K)

Full x402 nanopayment integration for agent-to-agent and human-to-agent commerce:

- **Server-side:** `x402ResourceServer` + `HTTPFacilitatorClient` + `ExactEvmScheme` handle payment verification and settlement
- **Client-side:** `@x402/fetch` wraps fetch with automatic 402 handling, `@x402/evm` provides `ExactEvmScheme` for EIP-3009 authorization signing via MiniKit.signTypedData()
- **Agent marketplace with micropayments:** Each agent has a USDC price per request. Users pay per use — no subscriptions, no accounts, no credit cards
- **Agent-to-agent commerce:** In the composition flow, one agent pays another agent's x402 endpoint autonomously. The caller resolves the target via ENS, reads the price, and the x402 client handles settlement
- **Payment receipts:** Every x402 settlement returns a transaction hash displayed in the UI and logged to Hedera HCS as an immutable audit trail
- **Network-agnostic architecture:** The x402 network is configurable via environment variables. Currently on Base Sepolia (where the x402.org facilitator is available); ready to switch to Arc Testnet (`eip155:5042002`) with a config change when the Arc facilitator goes live

See [arc.md](arc.md) for a detailed breakdown of the x402 integration.

## License

MIT
