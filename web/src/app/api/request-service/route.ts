import { requestNanopayment } from '@/lib/arc-payments';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  const payment = await requestNanopayment(payload);

  return NextResponse.json({
    ok: true,
    payment,
  });
}
