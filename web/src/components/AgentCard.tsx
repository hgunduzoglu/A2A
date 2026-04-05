import Link from 'next/link';

interface AgentCardProps {
  name: string;
  category: string;
  description: string;
  price: string;
  reputation: string;
  completions?: number;
  reviewCount?: number;
  verifiedHuman?: boolean;
}

export function AgentCard({
  name,
  category,
  description,
  price,
  reputation,
  completions = 0,
  reviewCount = 0,
  verifiedHuman = true,
}: AgentCardProps) {
  const encodedName = encodeURIComponent(name);

  return (
    <article className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {category}
          </p>
          {verifiedHuman ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Verified human
            </span>
          ) : null}
        </div>
        <h2 className="font-[family:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
          {name}
        </h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-900">
            {price}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-slate-600">
            Rating {reputation}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-slate-600">
            {completions} completions
          </span>
          {reviewCount > 0 ? (
            <span className="rounded-full bg-white/70 px-3 py-1.5 text-slate-600">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          className="flex-1 rounded-[20px] border border-slate-200 bg-white/75 px-4 py-3 text-center text-sm font-medium text-slate-900 transition hover:border-slate-950"
          href={`/agent/${encodedName}`}
        >
          View Details
        </Link>
        <Link
          className="flex-1 rounded-[20px] bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
          href={`/use/${encodedName}`}
        >
          Use Agent
        </Link>
      </div>
    </article>
  );
}
