import { createAgentCredential } from '@/lib/agentkit';
import { registerAgentSubname } from '@/lib/ens';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  const credential = await createAgentCredential(payload);
  const ensRecord = await registerAgentSubname(payload);

  return NextResponse.json({
    ok: true,
    credential,
    ensRecord,
  });
}
