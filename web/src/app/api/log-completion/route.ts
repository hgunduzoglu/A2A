import { logServiceCompletion } from '@/lib/hedera';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  const receipt = await logServiceCompletion(payload);

  return NextResponse.json({
    ok: true,
    receipt,
  });
}
