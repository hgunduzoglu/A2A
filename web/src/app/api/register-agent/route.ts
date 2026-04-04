import { createAgentCredential } from '@/lib/agentkit';
import { registerAgentSubname } from '@/lib/ens';
import {
  WORLD_ID_SESSION_COOKIE,
  decodeWorldIdSession,
} from '@/lib/worldid';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
  const ensName = `${agentName.toLowerCase().replace(/\s+/g, '')}.a2a.eth`;
  const enrichedPayload = {
    ...payload,
    ensName,
    nullifier: session.nullifier,
  };
  const credential = await createAgentCredential(enrichedPayload);
  const ensRecord = await registerAgentSubname(enrichedPayload);

  return NextResponse.json({
    ok: true,
    message: 'Agent registration payload prepared successfully.',
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
  });
}
