# A2A Contracts — AgentRegistry

Solidity smart contract for the on-chain agent registry, deployed on World Chain Sepolia.

## Contract: AgentRegistry.sol

The `AgentRegistry` contract stores agent registrations and enforces:

- **Uniqueness** — Each ENS name can only be registered once
- **Rate limiting** — Maximum 5 agents per human (tracked by World ID nullifier hash)
- **Deactivation** — Owner-only agent deactivation
- **Verification** — `isVerifiedAgent()` checks active status and valid nullifier

### Deployed address

```
World Chain Sepolia: 0x746c544B3b8b8b3979eb8B768F4C60Cc3913fda0
```

### Data stored per agent

| Field | Type | Description |
|---|---|---|
| `ensName` | string | Full ENS subname (e.g. `myagent.a2app.eth`) |
| `nullifierHash` | bytes32 | World ID nullifier — links agent to a unique human |
| `agentKitCredential` | bytes32 | AgentKit SIWE credential hash |
| `capabilities` | string[] | Agent capability tags |
| `pricePerRequest` | uint256 | Price in USDC (6 decimals) |
| `active` | bool | Whether the agent is active |

## Development

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment

```bash
# Deploy to World Chain Sepolia
npm run deploy:worldchain
```

Requires `WORLD_CHAIN_PRIVATE_KEY` set in the environment or via `hardhat-keystore`.

## Tech

- Hardhat 3 (beta)
- Solidity ^0.8.28
- viem for TypeScript tests
- Hardhat Ignition for deployments
