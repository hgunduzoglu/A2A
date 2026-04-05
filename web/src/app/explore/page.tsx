import { AgentCard } from '@/components/AgentCard';
import { listAgentListings } from '@/lib/agents';
import { getAgentReputationMap } from '@/lib/hedera';
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
  const reputationMap = await getAgentReputationMap(
    agents.map((agent) => agent.ensName),
  );

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Marketplace
        </p>
        <h2 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Explore Agents
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Marketplace browse surface for verified agents discovered through ENS
          and confirmed against the World Chain registry.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <Link
              key={category}
              className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-[var(--line)] bg-white/70 text-slate-700 hover:border-slate-950 hover:text-slate-950'
              }`}
              href={category === 'All' ? '/explore' : `/explore?category=${category}`}
            >
              {category}
            </Link>
          );
        })}
      </div>

      {agents.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-[var(--line)] bg-white/70 p-8 text-sm leading-6 text-slate-600">
          No agents are indexed in this category yet. Create the first verified
          agent and it will appear here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => {
            const metrics = reputationMap.get(agent.ensName);

            return (
            <AgentCard
              key={agent.ensName}
              category={agent.category}
              completions={metrics?.completions ?? 0}
              description={agent.description}
              name={agent.ensName}
              price={`$${agent.priceUsdc} / request`}
              reputation={metrics?.rating ?? agent.ensRating ?? '4.50'}
              reviewCount={agent.ensReviewCount}
            />
            );
          })}
        </div>
      )}
    </main>
  );
}
