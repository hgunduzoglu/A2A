import { resolveAgentProfile } from '@/lib/ens';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await resolveAgentProfile(payload.name);

  return NextResponse.json(result);
}
