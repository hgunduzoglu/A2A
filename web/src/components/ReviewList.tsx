import type { AgentReview } from '@/lib/hedera';

interface ReviewListProps {
  reviews: AgentReview[];
  avgRating: string;
  reviewCount: number;
}

function truncateNullifier(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) =>
    i < rating ? '\u2605' : '\u2606',
  ).join('');
}

export function ReviewList({
  reviews,
  avgRating,
  reviewCount,
}: ReviewListProps) {
  if (reviewCount === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-[var(--line)] bg-white/70 p-6 text-sm leading-6 text-slate-600">
        No reviews yet. Be the first to rate this agent.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5 text-sm shadow-[0_10px_24px_rgba(19,34,28,0.05)]">
        <span className="text-lg text-amber-500">
          {renderStars(Math.round(Number(avgRating)))}
        </span>
        <span className="font-medium text-slate-900">{avgRating}</span>
        <span className="text-slate-500">
          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      <div className="grid gap-3">
        {reviews.map((review) => (
          <div
            key={review.reviewerNullifier}
            className="rounded-[26px] border border-[var(--line)] bg-white/75 p-4 shadow-[0_10px_24px_rgba(19,34,28,0.03)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-amber-500">
                {renderStars(review.rating)}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {truncateNullifier(review.reviewerNullifier)}
              </span>
            </div>
            {review.comment ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {review.comment}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-400">
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
