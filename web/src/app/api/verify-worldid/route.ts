import { verifyWorldIdProof } from '@/lib/worldid';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await verifyWorldIdProof(payload);

  return NextResponse.json(result);
}
