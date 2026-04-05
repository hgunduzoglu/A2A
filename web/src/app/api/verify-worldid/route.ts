import {
  WORLD_ID_SESSION_COOKIE,
  encodeWorldIdSession,
  verifyWorldIdProof,
} from '@/lib/worldid';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await verifyWorldIdProof(payload);

  const response = NextResponse.json(result, {
    status: result.ok ? 200 : 400,
  });

  if (result.ok && result.nullifier) {
    response.cookies.set({
      name: WORLD_ID_SESSION_COOKIE,
      value: encodeWorldIdSession({
        mode: result.mode,
        nullifier: result.nullifier,
        verifiedAt: result.verifiedAt,
      }),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}
