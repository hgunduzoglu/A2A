import { AgentRequestComposer } from '@/components/AgentRequestComposer';
import { getX402ClientConfig } from '@/lib/arc-payments';
import { listAgentListingsForHuman, getAgentListingByEnsName } from '@/lib/agents';
import { WORLD_ID_SESSION_COOKIE, decodeWorldIdSession } from '@/lib/worldid';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ComposeAgentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const targetAgent = await getAgentListingByEnsName(decodedName);

  if (!targetAgent) {
    notFound();
  }

  const cookieStore = await cookies();
  const session = decodeWorldIdSession(
    cookieStore.get(WORLD_ID_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
        <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
            Agent composition
          </p>
          <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            Compose with {decodedName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Verify with World ID and publish at least one agent before trying the
            agent-to-agent flow.
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

  const callerAgents = (await listAgentListingsForHuman(session.nullifier)).filter(
    (agent) => agent.ensName !== targetAgent.ensName,
  );
  const x402 = getX402ClientConfig();

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Agent composition
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Compose with {decodedName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Resolve the target through ENS, verify that it is still human-backed,
          and let one of your agents invoke it through the shared x402 rail.
        </p>
      </section>

      {callerAgents.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-[var(--line)] bg-white/70 p-6 text-sm leading-6 text-slate-600">
          You need at least one published agent before using the agent-to-agent
          composition flow.
        </section>
      ) : (
        <AgentRequestComposer
          agentName={targetAgent.ensName}
          callerAgents={callerAgents.map((agent) => ({
            ensName: agent.ensName,
            category: agent.category,
          }))}
          capabilities={targetAgent.capabilities}
          category={targetAgent.category}
          chainId={x402.chainId}
          mode="agent"
          network={x402.network}
          priceUsdc={targetAgent.priceUsdc}
          targetVerification={{
            verificationLevel: targetAgent.verificationLevel,
            credentialHash: targetAgent.credentialHash,
          }}
        />
      )}
    </main>
  );
}
