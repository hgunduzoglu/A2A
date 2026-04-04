import { createAgentCredential } from '@/lib/agentkit';
import { registerAgentSubname } from '@/lib/ens';
import {
  getAgentCountForHuman,
  getAgentListingByEnsName,
  saveAgentListing,
} from '@/lib/marketplace';
import {
  WORLD_ID_SESSION_COOKIE,
  decodeWorldIdSession,
} from '@/lib/worldid';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
  const agentName =
    typeof payload.name === 'string' && payload.name.trim().length > 0
      ? payload.name.trim()
      : 'unnamed-agent';
  const ensName = `${agentName.toLowerCase().replace(/\s+/g, '')}.${parentDomain}`;
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
  };
  const credential = await createAgentCredential(enrichedPayload);
  const ensRecord = await registerAgentSubname({
    ...enrichedPayload,
    credentialHash:
      typeof credential.credentialHash === 'string'
        ? credential.credentialHash
        : undefined,
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
      typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'textRecords' in ensRecord &&
      Array.isArray(ensRecord.textRecords)
        ? (ensRecord.textRecords.find(
            (entry: unknown) =>
              Array.isArray(entry) &&
              entry[0] === 'payment-address' &&
              typeof entry[1] === 'string',
          )?.[1] ?? null)
        : null,
    registrationMode:
      typeof ensRecord === 'object' &&
      ensRecord !== null &&
      'mode' in ensRecord &&
      typeof ensRecord.mode === 'string'
        ? ensRecord.mode
        : 'stub',
  });

  return NextResponse.json({
    ok: true,
    message: 'Agent registered successfully and indexed for marketplace discovery.',
    agent: {
      ensName,
      category: payload.category,
      endpoint: payload.endpoint,
      price: payload.price,
      capabilities: Array.isArray(payload.capabilities) ? payload.capabilities : [],
      nullifier: session.nullifier,
    },
    credential,
    ensRecord,
    marketplace: {
      id: listing.id,
      status: listing.status,
      indexedAt: listing.updatedAt,
      agentCountForHuman: agentCountForHuman + 1,
    },
  });
}
