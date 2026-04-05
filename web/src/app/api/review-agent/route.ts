import { getAgentListingByEnsName } from '@/lib/agents';
import { updateAgentRatingRecords } from '@/lib/ens';
import { getAgentReviews, submitAgentReview } from '@/lib/hedera';
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
        message: 'You must verify with World ID before reviewing an agent.',
      },
      { status: 401 },
    );
  }

  const payload = await request.json();
  const agentName =
    typeof payload.agentName === 'string' ? payload.agentName.trim() : '';
  const rating = typeof payload.rating === 'number' ? payload.rating : 0;
  const comment =
    typeof payload.comment === 'string' ? payload.comment.trim() : '';

  if (!agentName) {
    return NextResponse.json(
      { ok: false, message: 'agentName is required.' },
      { status: 400 },
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { ok: false, message: 'Rating must be between 1 and 5.' },
      { status: 400 },
    );
  }

  const agent = await getAgentListingByEnsName(agentName);

  if (!agent) {
    return NextResponse.json(
      { ok: false, message: 'Agent not found.' },
      { status: 404 },
    );
  }

  if (agent.worldNullifierHash.toLowerCase() === session.nullifier.toLowerCase()) {
    return NextResponse.json(
      { ok: false, message: 'You cannot review your own agent.' },
      { status: 409 },
    );
  }

  const receipt = await submitAgentReview({
    agent: agentName,
    reviewerNullifier: session.nullifier,
    rating,
    comment,
  });

  const { avgRating, reviewCount } = await getAgentReviews(agentName);

  const ensUpdate = await updateAgentRatingRecords(
    agentName,
    avgRating,
    reviewCount,
  ).catch((error) => ({
    provider: 'ens',
    mode: 'error',
    message: error instanceof Error ? error.message : 'ENS update failed.',
  }));

  return NextResponse.json({
    ok: true,
    message: 'Review submitted and ENS rating updated.',
    review: receipt,
    aggregated: {
      avgRating,
      reviewCount,
    },
    ensUpdate,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agentName = url.searchParams.get('agent') ?? '';

  if (!agentName) {
    return NextResponse.json(
      { ok: false, message: 'agent query parameter is required.' },
      { status: 400 },
    );
  }

  const { reviews, avgRating, reviewCount, mode } =
    await getAgentReviews(agentName);

  return NextResponse.json({
    ok: true,
    agent: agentName,
    avgRating,
    reviewCount,
    reviews,
    mode,
  });
}
