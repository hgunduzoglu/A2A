import { createAgentCredential } from '@/lib/agentkit';
import { toAgentEnsName } from '@/lib/agents';
import { registerAgentSubname } from '@/lib/ens';
import {
  getAgentCountForHuman,
  getAgentListingByEnsName,
  saveAgentListing,
} from '@/lib/marketplace';
import { registerAgentOnWorldChain } from '@/lib/worldchain';
import {
  WORLD_ID_SESSION_COOKIE,
  decodeWorldIdSession,
} from '@/lib/worldid';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

export async function POST(request: Request) {
  const parentDomain = process.env.ENS_PARENT_DOMAIN ?? 'a2a.eth';
  const cookieStore = await cookies();
  const session = decodeWorldIdSession(
    cookieStore.get(WORLD_ID_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: 'You must verify with World ID before creating an agent.',
      },
      { status: 401 },
    );
  }

  const payload = await request.json();
  const paymentAddress =
    typeof payload.paymentAddress === 'string' && isAddress(payload.paymentAddress)
      ? payload.paymentAddress
      : undefined;
  const { agentName, ensName } = toAgentEnsName(
    typeof payload.name === 'string' ? payload.name : '',
    parentDomain,
  );
  const existingListing = await getAgentListingByEnsName(ensName);

  if (existingListing) {
    return NextResponse.json(
      {
        ok: false,
        message: 'This ENS agent name is already listed in the marketplace.',
      },
      { status: 409 },
    );
  }

  const agentCountForHuman = await getAgentCountForHuman(session.nullifier);

  if (agentCountForHuman >= 5) {
    return NextResponse.json(
      {
        ok: false,
        message: 'A verified human can list up to 5 agents.',
      },
      { status: 429 },
    );
  }

  const enrichedPayload = {
    ...payload,
    ensName,
    nullifier: session.nullifier,
    paymentAddress,
  };
  let credential;

  try {
    credential = await createAgentCredential({
      walletAuth: payload.agentkitAuth,
      worldNullifierHash: session.nullifier,
      ensName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create the AgentKit credential.',
      },
      { status: 400 },
    );
  }

  const ensRecord = await registerAgentSubname({
    ...enrichedPayload,
    credentialHash:
      typeof credential.credentialHash === 'string'
        ? credential.credentialHash
        : undefined,
  });
  const registryRecord = await registerAgentOnWorldChain({
    ensName,
    nullifierHash: session.nullifier,
    credentialHash:
      typeof credential.credentialHash === 'string'
        ? credential.credentialHash
        : null,
    capabilities: Array.isArray(payload.capabilities)
      ? payload.capabilities.map((value: unknown) => String(value))
      : [],
    priceUsdc: typeof payload.price === 'string' ? payload.price : '0',
  });
  const listing = await saveAgentListing({
    ensName,
    agentName,
    category:
      typeof payload.category === 'string' && payload.category.trim().length > 0
        ? payload.category
        : 'Analysis',
    description:
      typeof payload.description === 'string' ? payload.description : '',
    endpoint: typeof payload.endpoint === 'string' ? payload.endpoint : '',
    priceUsdc: typeof payload.price === 'string' ? payload.price : '0',
    capabilities: Array.isArray(payload.capabilities)
      ? payload.capabilities.map((value: unknown) => String(value))
      : [],
    worldNullifierHash: session.nullifier,
    verificationLevel: 'orb',
    credentialHash:
      typeof credential.credentialHash === 'string'
        ? credential.credentialHash
        : null,
    ensNode:
      typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'node' in ensRecord &&
      typeof ensRecord.node === 'string'
        ? ensRecord.node
        : null,
    ensResolver:
      typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'resolver' in ensRecord &&
      typeof ensRecord.resolver === 'string'
        ? ensRecord.resolver
        : null,
    ensCreateTxHash:
      typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'createHash' in ensRecord &&
      typeof ensRecord.createHash === 'string'
        ? ensRecord.createHash
        : null,
    ensTextRecordTxHashes:
      typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'textRecordTransactionHashes' in ensRecord &&
      Array.isArray(ensRecord.textRecordTransactionHashes)
        ? ensRecord.textRecordTransactionHashes.map((value) => String(value))
        : [],
    paymentAddress:
      paymentAddress ??
      (typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'textRecords' in ensRecord &&
      Array.isArray(ensRecord.textRecords)
        ? (ensRecord.textRecords.find(
            (entry: unknown) =>
              Array.isArray(entry) &&
              entry[0] === 'payment-address' &&
              typeof entry[1] === 'string',
          )?.[1] ?? null)
        : null),
    registryContractAddress:
      typeof registryRecord === 'object' &&
      registryRecord !== null &&
      'contractAddress' in registryRecord &&
      typeof registryRecord.contractAddress === 'string'
        ? registryRecord.contractAddress
        : null,
    registryTxHash:
      typeof registryRecord === 'object' &&
      registryRecord !== null &&
      'txHash' in registryRecord &&
      typeof registryRecord.txHash === 'string'
        ? registryRecord.txHash
        : null,
    agentkitMode:
      typeof credential === 'object' &&
      credential !== null &&
      'mode' in credential &&
      typeof credential.mode === 'string'
        ? credential.mode
        : 'stub',
    agentkitHumanId:
      typeof credential === 'object' &&
      credential !== null &&
      'humanId' in credential &&
      typeof credential.humanId === 'string'
        ? credential.humanId
        : null,
    agentkitVerifiedAt:
      typeof credential === 'object' &&
      credential !== null &&
      'verifiedAt' in credential &&
      typeof credential.verifiedAt === 'string'
        ? credential.verifiedAt
        : null,
    registrationMode:
      typeof registryRecord === 'object' &&
      registryRecord !== null &&
      'mode' in registryRecord &&
      typeof registryRecord.mode === 'string'
        ? registryRecord.mode
        : typeof ensRecord === 'object' &&
            ensRecord !== null &&
            'mode' in ensRecord &&
            typeof ensRecord.mode === 'string'
          ? ensRecord.mode
        : 'stub',
  });

  return NextResponse.json({
    ok: true,
    message:
      registryRecord.mode === 'live'
        ? 'Agent registered with AgentKit, ENS, World Chain, and the marketplace index.'
        : 'Agent registered with AgentKit and ENS, then indexed for marketplace discovery. World Chain deploy address is still missing.',
    agent: {
      ensName,
      category: payload.category,
      endpoint: payload.endpoint,
      price: payload.price,
      capabilities: Array.isArray(payload.capabilities) ? payload.capabilities : [],
      nullifier: session.nullifier,
      paymentAddress:
        paymentAddress ??
        (typeof ensRecord === 'object' &&
        ensRecord !== null &&
        'textRecords' in ensRecord &&
        Array.isArray(ensRecord.textRecords)
          ? (ensRecord.textRecords.find(
              (entry: unknown) =>
                Array.isArray(entry) &&
                entry[0] === 'payment-address' &&
                typeof entry[1] === 'string',
            )?.[1] ?? null)
          : null),
    },
    credential,
    ensRecord,
    registryRecord,
    marketplace: {
      id: listing.id,
      status: listing.status,
      indexedAt: listing.updatedAt,
      agentCountForHuman: agentCountForHuman + 1,
    },
  });
}
