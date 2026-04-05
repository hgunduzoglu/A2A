import { toAgentEnsName } from '@/lib/agents';
import { issueAgentkitChallenge } from '@/lib/agentkit';
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
        message: 'You must verify with World ID before creating an AgentKit credential.',
      },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parentDomain = process.env.ENS_PARENT_DOMAIN ?? 'a2a.eth';
  const { ensName } = toAgentEnsName(
    typeof payload.name === 'string' ? payload.name : '',
    parentDomain,
  );
  const origin = new URL(request.url).origin;
  const challenge = issueAgentkitChallenge({
    origin,
    ensName,
  });

  return NextResponse.json({
    ok: true,
    mode: challenge.mode,
    ensName,
    resourceUri: challenge.resourceUri,
    chainId: challenge.chainId,
    auth: {
      nonce: challenge.auth.nonce,
      statement: challenge.auth.statement,
      requestId: challenge.auth.requestId,
      expirationTime: challenge.auth.expirationTime.toISOString(),
    },
  });
}
