interface ReputationBadgeProps {
  rating: string;
  completions: number;
}

export function ReputationBadge({
  rating,
  completions,
}: ReputationBadgeProps) {
  return (
    <div className="inline-flex w-fit items-center gap-3 rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700">
      <span>Rating {rating}</span>
      <span>{completions} completions</span>
    </div>
  );
}
