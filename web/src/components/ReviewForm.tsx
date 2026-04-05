'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { useState, useTransition } from 'react';

interface ReviewFormProps {
  agentName: string;
}

interface ReviewResponse {
  ok: boolean;
  message?: string;
  aggregated?: {
    avgRating: string;
    reviewCount: number;
  };
}

export function ReviewForm({ agentName }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        await MiniKit.sendHapticFeedback({
          hapticsType: 'selection-changed',
        }).catch(() => undefined);

        const response = await fetch('/api/review-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentName, rating, comment }),
        });
        const payload = (await response.json()) as ReviewResponse;

        if (!response.ok || !payload.ok) {
          await MiniKit.sendHapticFeedback({
            hapticsType: 'notification',
            style: 'error',
          }).catch(() => undefined);
          setError(payload.message ?? 'Unable to submit review.');
          return;
        }

        await MiniKit.sendHapticFeedback({
          hapticsType: 'notification',
          style: 'success',
        }).catch(() => undefined);
        setResult(payload);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Unable to submit review.',
        );
      }
    });
  }

  const displayRating = hovered || rating;

  return (
    <div className="grid gap-4">
      <form
        className="grid gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl"
        onSubmit={handleSubmit}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Rate this agent
        </p>

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`rounded-xl px-3 py-2 text-2xl transition ${
                star <= displayRating
                  ? 'bg-amber-100 text-amber-500'
                  : 'bg-white/60 text-slate-300'
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              type="button"
            >
              {star <= displayRating ? '\u2605' : '\u2606'}
            </button>
          ))}
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Comment</span>
          <textarea
            className="min-h-24 rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            maxLength={500}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share your experience with this agent..."
            value={comment}
          />
        </label>

        <button
          className="rounded-[22px] bg-slate-950 px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending || rating === 0}
          type="submit"
        >
          {isPending ? 'Submitting...' : 'Submit review'}
        </button>
      </form>

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result?.aggregated ? (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">{result.message}</p>
          <p className="mt-1">
            New average: {result.aggregated.avgRating} ({result.aggregated.reviewCount} reviews)
          </p>
        </div>
      ) : null}
    </div>
  );
}
