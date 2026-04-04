import { createRpContextResponse } from '@/lib/worldid';
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(createRpContextResponse());
}
