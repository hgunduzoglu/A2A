interface ReputationBadgeProps {
  rating: string;
  completions: number;
}

export function ReputationBadge({
  rating,
  completions,
}: ReputationBadgeProps) {
  return (
    <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5 text-sm text-slate-700 shadow-[0_10px_24px_rgba(19,34,28,0.05)]">
      <span className="font-medium text-slate-900">Rating {rating}</span>
      <span>{completions} completions</span>
    </div>
  );
}
