import { createAgentCredential } from '@/lib/agentkit';
import {
  toAgentEnsName,
  getAgentListingByEnsName,
  getAgentCountForHuman,
} from '@/lib/agents';
import { registerAgentSubname } from '@/lib/ens';
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
        message: 'This ENS agent name is already registered on the World Chain registry.',
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

  let ensRecord;

  try {
    ensRecord = await registerAgentSubname({
      ...enrichedPayload,
      credentialHash:
        typeof credential.credentialHash === 'string'
          ? credential.credentialHash
          : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `ENS registration failed: ${error.message}`
            : 'ENS subname registration failed.',
      },
      { status: 502 },
    );
  }

  let registryRecord;

  try {
    registryRecord = await registerAgentOnWorldChain({
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
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `ENS registered but World Chain failed: ${error.message}. Try again — the retry is safe.`
            : 'ENS registered but World Chain registration failed. Try again — the retry is safe.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      registryRecord.mode === 'live'
        ? 'Agent registered with AgentKit, ENS, and World Chain. Fully on-chain.'
        : 'Agent registered with AgentKit and ENS. World Chain deploy address is still missing.',
    agent: {
      ensName,
      agentName,
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
    agentCountForHuman: agentCountForHuman + 1,
  });
}
