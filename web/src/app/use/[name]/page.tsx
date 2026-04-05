import { AgentRequestComposer } from '@/components/AgentRequestComposer';
import { getX402ClientConfig } from '@/lib/arc-payments';
import { getAgentListingByEnsName } from '@/lib/agents';
import { notFound } from 'next/navigation';

export default async function UseAgentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const agent = await getAgentListingByEnsName(decodedName);

  if (!agent) {
    notFound();
  }

  const x402 = getX402ClientConfig();

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Agent invocation
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Use {decodedName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pay with x402 on {x402.networkLabel}, then receive the agent response
          after settlement succeeds.
        </p>
      </section>

      <AgentRequestComposer
        agentName={agent.ensName}
        capabilities={agent.capabilities}
        category={agent.category}
        chainId={x402.chainId}
        network={x402.network}
        networkLabel={x402.networkLabel}
        priceUsdc={agent.priceUsdc}
      />
    </main>
  );
}
