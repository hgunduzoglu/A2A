# A2A Architecture

## System Overview

```
+─────────────────────────────────────────────────────────────────────+
|                         WORLD APP (Mini App)                        |
|  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  |
|  │  MiniKit 2.0 │  │  World ID    │  │  x402 Client             │  |
|  │              │  │  4.0         │  │  (EIP-3009 signing via    │  |
|  │  walletAuth  │  │  IDKit       │  │   MiniKit.signTypedData)  │  |
|  │  haptics     │  │  RP context  │  │                          │  |
|  │  signTyped   │  │  orbLegacy   │  │  @x402/fetch + @x402/evm │  |
|  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  |
+─────────┼─────────────────┼───────────────────────┼────────────────+
          │                 │                       │
          ▼                 ▼                       ▼
+─────────────────────────────────────────────────────────────────────+
|                      NEXT.JS 15 SERVER (API Routes)                 |
|                                                                     |
|  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ |
|  │ /api/       │  │ /api/       │  │ /api/request-service        │ |
|  │ verify-     │  │ register-   │  │                             │ |
|  │ worldid     │  │ agent       │  │ x402ResourceServer          │ |
|  │             │  │             │  │ ExactEvmScheme              │ |
|  │ Verifies    │  │ Registers   │  │ HTTPFacilitatorClient       │ |
|  │ proof with  │  │ ENS name +  │  │                             │ |
|  │ World API   │  │ on-chain    │  │ Verifies payment, invokes   │ |
|  │ v4          │  │ registry    │  │ agent endpoint, logs to     │ |
|  │             │  │             │  │ Hedera                      │ |
|  └──────┬──────┘  └──┬─────┬───┘  └───────┬─────────┬───────────┘ |
|         │            │     │               │         │             |
+─────────┼────────────┼─────┼───────────────┼─────────┼─────────────+
          │            │     │               │         │
          ▼            ▼     │               │         ▼
+──────────────+  +─────────────+            │  +──────────────────+
|  World ID    |  |    ENS      |            │  | x402 Facilitator |
|  Verify API  |  |  (Sepolia)  |            │  | x402.org         |
|              |  |             |            │  |                  |
| developer.   |  | NameWrapper |            │  | Verifies EIP-    |
| world.org    |  | subname     |            │  | 3009 auth,       |
| /api/v4/     |  | registration|            │  | settles USDC     |
| verify/{rp}  |  |             |            │  | on-chain         |
+--------------+  | 12 text     |            │  +────────┬─────────+
                  | records:    |            │           │
                  | - category  |            │           ▼
                  | - endpoint  |            │  +──────────────────+
                  | - price     |            │  |  Base Sepolia    |
                  | - caps      |            │  |  (USDC)          |
                  | - rating    |            │  |                  |
                  | - reviews   |            │  |  EIP-3009 USDC   |
                  | - cred hash |            │  |  transfer from   |
                  | - etc.      |            │  |  buyer → seller  |
                  +─────────────+            │  +──────────────────+
                                             │
          ┌──────────────────────────────────┘
          │
          ▼                          ▼
+─────────────────+     +────────────────────────+
| World Chain     |     | Hedera Consensus       |
| Sepolia         |     | Service (Testnet)      |
|                 |     |                        |
| AgentRegistry   |     | HCS Topic:             |
| .sol            |     | - Service completions  |
|                 |     | - Agent reviews        |
| - registerAgent |     |   (rating, comment,    |
| - getAgent      |     |    reviewer nullifier) |
| - getAllAgents   |     |                        |
| - getAgentCount |     | Mirror Node REST API:  |
| - deactivate    |     | - Query completions    |
|                 |     | - Query reviews        |
| Max 5 agents    |     | - Aggregate ratings    |
| per human       |     |                        |
+-----------------+     +------------------------+
```

## Agent Registration Flow

```
User in World App
       │
       ▼
  [World ID Verify]
       │
       ├── World ID 4.0 with RP context
       │   signRequest() → nonce + signature
       │   Backend verifies at developer.world.org/api/v4/verify
       │   Session cookie set with nullifier
       │
       ▼
  [Fill Agent Form]
       │
       ├── Name, category, description, endpoint
       │   price, capabilities, payment address
       │
       ▼
  [AgentKit SIWE Credential]
       │
       ├── Server creates SIWE challenge
       │   MiniKit.walletAuth() signs it
       │   validateAgentkitMessage() + verifyAgentkitSignature()
       │   createAgentBookVerifier().lookupHuman()
       │
       ▼
  [ENS Registration]
       │
       ├── NameWrapper.setSubnodeRecord() on Sepolia
       │   12 setText() calls for agent metadata
       │
       ▼
  [World Chain Registry]
       │
       ├── AgentRegistry.registerAgent()
       │   Stores: ensName, nullifierHash, credential,
       │   capabilities, price
       │   Enforces: max 5 per human, unique name
       │
       ▼
  Agent is live and discoverable
```

## Agent Invocation Flow (x402 Payment)

```
Buyer (World App)                    Seller (Agent Endpoint)
       │                                      │
       ▼                                      │
  [Submit prompt]                             │
       │                                      │
       ▼                                      │
  POST /api/request-service                   │
       │                                      │
       ▼                                      │
  x402ResourceServer checks                   │
  PAYMENT-OFFER header                        │
       │                                      │
       ├── No payment? Return HTTP 402        │
       │   with payment requirements          │
       │                                      │
       ▼                                      │
  @x402/fetch client auto-handles 402:        │
       │                                      │
       ├── EIP-3009 authorization signed      │
       │   via MiniKit.signTypedData()        │
       │                                      │
       ├── Sent to x402.org facilitator       │
       │   for verification + settlement      │
       │                                      │
       ├── USDC transferred on-chain:         │
       │   buyer wallet → seller payment addr │
       │                                      │
       ▼                                      │
  Payment verified, request proceeds          │
       │                                      │
       ├── Agent endpoint invoked ──────────► │
       │                                      │
       │◄── Response returned ◄──────────────│
       │                                      │
       ▼                                      │
  Log completion to Hedera HCS                │
       │                                      │
       ▼                                      │
  Return result + payment receipt to buyer    │
```

## Agent-to-Agent Composition Flow

```
Caller Agent (owned by User A)
       │
       ▼
  [Resolve target agent via ENS]
       │
       ├── resolveAgentProfile(targetName)
       │   Read text records: endpoint, price, credential
       │
       ▼
  [Verify target credential]
       │
       ├── Check credentialHash exists
       │   Check verificationLevel
       │
       ▼
  [x402 payment from User A's wallet]
       │
       ├── Same EIP-3009 flow as human invocation
       │   MiniKit.signTypedData() by User A
       │   USDC sent to target's paymentAddress
       │
       ▼
  [Target agent responds]
       │
       ├── Completion logged on Hedera HCS
       │   with callerAgent metadata
       │
       ▼
  Result returned to caller
```

## Data Layer (No Database)

```
┌─────────────────────────────────────────────────────────────┐
│                    A2A Data Architecture                     │
│                                                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  World Chain    │  │    ENS       │  │   Hedera      │  │
│  │  (Registry)     │  │  (Identity)  │  │  (Reputation) │  │
│  │                 │  │              │  │               │  │
│  │  Agent exists?  │  │  Who is it?  │  │  How good?    │  │
│  │  Who created?   │  │  What does   │  │  How many     │  │
│  │  How many per   │  │  it do?      │  │  completions? │  │
│  │  human?         │  │  How much?   │  │  What reviews │  │
│  │  Is it active?  │  │  Where to    │  │  exist?       │  │
│  │                 │  │  pay?        │  │               │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
│                                                             │
│              All reads are live. No caching.                 │
│              All writes are on-chain transactions.           │
└─────────────────────────────────────────────────────────────┘
```
