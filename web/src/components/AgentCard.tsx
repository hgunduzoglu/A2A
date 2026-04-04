import Link from 'next/link';

interface AgentCardProps {
  name: string;
  category: string;
  description: string;
  price: string;
  reputation: string;
  verifiedHuman?: boolean;
}

export function AgentCard({
  name,
  category,
  description,
  price,
  reputation,
  verifiedHuman = true,
}: AgentCardProps) {
  const encodedName = encodeURIComponent(name);

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
          {category}
        </p>
        <h2 className="text-xl font-semibold text-neutral-950">{name}</h2>
        {verifiedHuman ? (
          <p className="text-sm font-medium text-emerald-700">
            Verified human-backed agent
          </p>
        ) : null}
        <p className="text-sm text-neutral-600">{description}</p>
        <div className="flex flex-wrap gap-3 text-sm text-neutral-700">
          <span>{price}</span>
          <span>Rating {reputation}</span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900"
          href={`/agent/${encodedName}`}
        >
          View Details
        </Link>
        <Link
          className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          href={`/use/${encodedName}`}
        >
          Use Agent
        </Link>
      </div>
    </article>
  );
}
