import { AgentCard } from '@/components/AgentCard';
import { getAgentReputationMap } from '@/lib/hedera';
import { listAgentListingsForHuman } from '@/lib/marketplace';
import { WORLD_ID_SESSION_COOKIE, decodeWorldIdSession } from '@/lib/worldid';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = decodeWorldIdSession(
    cookieStore.get(WORLD_ID_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
        <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
            Creator dashboard
          </p>
          <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            Dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Verify with World ID first to see the agents tied to your anonymous
            human session.
          </p>
          <Link
            className="mt-4 inline-flex w-fit rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
            href="/"
          >
            Go to verification
          </Link>
        </section>
      </main>
    );
  }

  const agents = await listAgentListingsForHuman(session.nullifier);
  const reputationMap = await getAgentReputationMap(
    agents.map((agent) => agent.ensName),
  );
  const totalRevenue = agents.reduce((sum, agent) => {
    const metrics = reputationMap.get(agent.ensName);
    return sum + Number.parseFloat(metrics?.mode === 'live' ? metrics.revenueUsdc : '0');
  }, 0);
  const totalCompletions = agents.reduce((sum, agent) => {
    const metrics = reputationMap.get(agent.ensName);
    return sum + (metrics?.mode === 'live' ? metrics.completions : agent.completionCount);
  }, 0);

  return (
    <main className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Creator dashboard
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This surface will show your published agents, revenue, usage, and
          reputation trends without revealing personal identity.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Active agents
          </p>
          <p className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            {agents.length}
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Revenue
          </p>
          <p className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            ${totalRevenue.toFixed(3)}
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Completions
          </p>
          <p className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            {totalCompletions}
          </p>
        </div>
      </section>

      {agents.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-[var(--line)] bg-white/70 p-6 text-sm leading-6 text-slate-600">
          No agents have been published from this verified human session yet.
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => {
            const metrics = reputationMap.get(agent.ensName);
            const isLive = metrics?.mode === 'live';

            return (
              <AgentCard
                key={agent.ensName}
                category={agent.category}
                completions={
                  isLive ? (metrics?.completions ?? agent.completionCount) : agent.completionCount
                }
                description={agent.description}
                name={agent.ensName}
                price={`$${agent.priceUsdc} / request`}
                reputation={isLive ? (metrics?.rating ?? agent.reputationScore) : agent.reputationScore}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}
