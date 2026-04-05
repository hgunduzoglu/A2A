import {
  createAgentBookVerifier,
  validateAgentkitMessage,
  verifyAgentkitSignature,
  type AgentkitPayload,
} from '@worldcoin/agentkit';
import { randomBytes } from 'crypto';
import { keccak256, stringToHex } from 'viem';
import { parseSiweMessage } from 'viem/siwe';

const AGENTKIT_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const AGENTKIT_CHAIN_ID = 'eip155:480';

interface AgentkitChallenge {
  ensName: string;
  domain: string;
  resourceUri: string;
  statement: string;
  requestId: string;
  expiresAt: number;
}

interface AgentkitWalletAuthPayload {
  address: string;
  message: string;
  signature: string;
}

interface IssueAgentkitChallengeInput {
  origin: string;
  ensName: string;
}

interface CreateAgentCredentialInput {
  walletAuth: unknown;
  worldNullifierHash: string;
  ensName: string;
}

declare global {
  var __a2aAgentkitChallenges: Map<string, AgentkitChallenge> | undefined;
}

function getChallengeStore() {
  if (!globalThis.__a2aAgentkitChallenges) {
    globalThis.__a2aAgentkitChallenges = new Map<string, AgentkitChallenge>();
  }

  const now = Date.now();

  for (const [nonce, challenge] of globalThis.__a2aAgentkitChallenges.entries()) {
    if (challenge.expiresAt <= now) {
      globalThis.__a2aAgentkitChallenges.delete(nonce);
    }
  }

  return globalThis.__a2aAgentkitChallenges;
}

function readWalletAuthPayload(input: unknown): AgentkitWalletAuthPayload {
  if (
    !input ||
    typeof input !== 'object' ||
    !('address' in input) ||
    !('message' in input) ||
    !('signature' in input)
  ) {
    throw new Error(
      'World wallet authorization is missing. Open the Mini App in World App and try again.',
    );
  }

  const payload = input as Record<string, unknown>;

  if (
    typeof payload.address !== 'string' ||
    typeof payload.message !== 'string' ||
    typeof payload.signature !== 'string'
  ) {
    throw new Error('World wallet authorization payload is malformed.');
  }

  return {
    address: payload.address,
    message: payload.message,
    signature: payload.signature,
  };
}

export function issueAgentkitChallenge(input: IssueAgentkitChallengeInput) {
  const origin = new URL(input.origin).origin;
  const resourceUri = new URL('/create', origin).toString();
  const domain = new URL(origin).host;
  const nonce = randomBytes(16).toString('hex');
  const expirationTime = new Date(Date.now() + AGENTKIT_CHALLENGE_TTL_MS);
  const statement = `Authorize A2A to create a human-backed AgentKit credential for ${input.ensName}.`;
  const requestId = `register:${input.ensName}:${nonce.slice(0, 8)}`;

  getChallengeStore().set(nonce, {
    ensName: input.ensName,
    domain,
    resourceUri,
    statement,
    requestId,
    expiresAt: expirationTime.getTime(),
  });

  return {
    provider: 'agentkit',
    mode: 'live' as const,
    chainId: AGENTKIT_CHAIN_ID,
    resourceUri,
    auth: {
      nonce,
      statement,
      requestId,
      expirationTime,
    },
  };
}

function consumeAgentkitChallenge(nonce: string) {
  const store = getChallengeStore();
  const challenge = store.get(nonce) ?? null;

  if (challenge) {
    store.delete(nonce);
  }

  return challenge;
}

function toAgentkitPayload(walletAuth: AgentkitWalletAuthPayload) {
  const parsed = parseSiweMessage(walletAuth.message);
  const issuedAt = parsed.issuedAt?.toISOString();

  if (!issuedAt) {
    throw new Error('World wallet authorization is missing issuedAt metadata.');
  }

  if (
    !parsed.address ||
    !parsed.domain ||
    !parsed.uri ||
    !parsed.version ||
    !parsed.nonce
  ) {
    throw new Error('World wallet authorization SIWE message is incomplete.');
  }

  if (parsed.address.toLowerCase() !== walletAuth.address.toLowerCase()) {
    throw new Error('World wallet authorization address does not match the signed SIWE message.');
  }

  const payload: AgentkitPayload = {
    domain: parsed.domain,
    address: parsed.address,
    statement: parsed.statement,
    uri: parsed.uri,
    version: parsed.version,
    chainId: `eip155:${parsed.chainId}`,
    type: 'eip191',
    nonce: parsed.nonce,
    issuedAt,
    expirationTime: parsed.expirationTime?.toISOString(),
    notBefore: parsed.notBefore?.toISOString(),
    requestId: parsed.requestId,
    resources: parsed.resources,
    signatureScheme: 'eip191',
    signature: walletAuth.signature,
  };

  return payload;
}

export async function createAgentCredential(input: CreateAgentCredentialInput) {
  const walletAuth = readWalletAuthPayload(input.walletAuth);
  const payload = toAgentkitPayload(walletAuth);
  const challenge = consumeAgentkitChallenge(payload.nonce);

  if (!challenge) {
    throw new Error('AgentKit challenge expired. Please try deploying the agent again.');
  }

  if (challenge.ensName !== input.ensName) {
    throw new Error('AgentKit challenge does not match the requested ENS agent name.');
  }

  if (payload.domain !== challenge.domain) {
    throw new Error('AgentKit signature domain mismatch.');
  }

  if (payload.uri !== challenge.resourceUri) {
    throw new Error('AgentKit signature URI mismatch.');
  }

  if (payload.statement !== challenge.statement) {
    throw new Error('AgentKit signature statement mismatch.');
  }

  if (payload.requestId !== challenge.requestId) {
    throw new Error('AgentKit signature request ID mismatch.');
  }

  const validation = await validateAgentkitMessage(payload, challenge.resourceUri);

  if (!validation.valid) {
    throw new Error(validation.error ?? 'AgentKit message validation failed.');
  }

  const verification = await verifyAgentkitSignature(payload);

  if (!verification.valid) {
    throw new Error(
      verification.error ?? 'World wallet signature could not be verified for AgentKit.',
    );
  }

  const humanId = await createAgentBookVerifier()
    .lookupHuman(payload.address, payload.chainId)
    .catch(() => null);
  const credentialHash = keccak256(
    stringToHex(
      JSON.stringify({
        ensName: input.ensName,
        worldNullifierHash: input.worldNullifierHash,
        agentkit: {
          address: payload.address.toLowerCase(),
          chainId: payload.chainId,
          nonce: payload.nonce,
          issuedAt: payload.issuedAt,
          signature: payload.signature,
          humanId,
        },
      }),
    ),
  );

  return {
    provider: 'agentkit',
    mode: 'live' as const,
    credentialHash,
    chainId: payload.chainId,
    messageUri: payload.uri,
    signatureScheme: payload.signatureScheme ?? 'eip191',
    humanLookup: humanId ? ('found' as const) : ('not_found' as const),
    humanId,
    verifiedAt: new Date().toISOString(),
  };
}
