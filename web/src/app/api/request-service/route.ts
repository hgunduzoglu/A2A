import {
  prepareNanopayment,
  settleNanopayment,
} from '@/lib/arc-payments';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const payload = await request.json();
  const prepared = await prepareNanopayment(request, payload);

  if (prepared.type === 'response') {
    return prepared.response;
  }

  const settled = await settleNanopayment(prepared);

  if (settled.type === 'response') {
    return settled.response;
  }

  return Response.json(settled.body, {
    headers: settled.headers,
  });
}
