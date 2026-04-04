import { AgentCard } from '@/components/AgentCard';
import { listAgentListings } from '@/lib/marketplace';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const categories = ['All', 'Trading', 'Analysis', 'Data', 'Content', 'Code'];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const activeCategory =
    params?.category && categories.includes(params.category)
      ? params.category
      : 'All';
  const agents = await listAgentListings(
    activeCategory === 'All' ? null : activeCategory,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          Explore Agents
        </h1>
        <p className="text-neutral-600">
          Marketplace browse surface for verified agents discovered through ENS.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <Link
              key={category}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-950 hover:text-neutral-950'
              }`}
              href={category === 'All' ? '/explore' : `/explore?category=${category}`}
            >
              {category}
            </Link>
          );
        })}
      </div>

      {agents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-8 text-neutral-600">
          No agents are indexed in this category yet. Create the first verified
          agent and it will appear here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.ensName}
              category={agent.category}
              description={agent.description}
              name={agent.ensName}
              price={`$${agent.priceUsdc} / request`}
              reputation={agent.reputationScore}
            />
          ))}
        </div>
      )}
    </main>
  );
}
