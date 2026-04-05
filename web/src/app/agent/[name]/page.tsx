import { ReputationBadge } from '@/components/ReputationBadge';
import { resolveAgentProfile } from '@/lib/ens';
import { getAgentReputation } from '@/lib/hedera';
import { getAgentListingByEnsName } from '@/lib/marketplace';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function parseCapabilities(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

export default async function AgentDetailPage({
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

  const ensProfile = await resolveAgentProfile(decodedName);
  const reputation = await getAgentReputation(decodedName);
  const isLiveReputation = reputation.mode === 'live';
  const records =
    typeof ensProfile === 'object' &&
    ensProfile !== null &&
    'records' in ensProfile &&
    ensProfile.records &&
    typeof ensProfile.records === 'object'
      ? (ensProfile.records as Record<string, string>)
      : {};
  const capabilities = parseCapabilities(
    records['agent-capabilities'],
    agent.capabilities,
  );
  const description = records['agent-description'] ?? agent.description;
  const endpoint = records['agent-endpoint'] ?? agent.endpoint;
  const price = records['agent-price'] ?? agent.priceUsdc;
  const paymentAddress = records['payment-address'] ?? agent.paymentAddress;
  const worldNullifier =
    records['world-nullifier'] ?? agent.worldNullifierHash;
  const verification = records['world-verification'] ?? agent.verificationLevel;

  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Agent Detail
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          {decodedName}
        </h1>
      </section>

      <div className="inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
        Verified human-backed agent
      </div>

      <ReputationBadge
        completions={
          isLiveReputation ? reputation.completions : agent.completionCount
        }
        rating={isLiveReputation ? reputation.rating : agent.reputationScore}
      />

      <p className="text-sm leading-6 text-slate-600">{description}</p>

      <section className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Category
          </span>
          <span className="text-slate-900">{agent.category}</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Price
          </span>
          <span className="text-slate-900">${price} USDC / request</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Endpoint
          </span>
          <span className="break-all text-slate-900">{endpoint}</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Capabilities
          </span>
          <span className="text-slate-900">
            {capabilities.length > 0 ? capabilities.join(', ') : 'Not provided'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-slate-950">
          Verification and ENS Metadata
        </h2>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Verification level
          </span>
          <span className="text-slate-900">{verification}</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Nullifier hash
          </span>
          <span className="break-all font-mono text-sm text-slate-900">
            {worldNullifier}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            ENS resolver
          </span>
          <span className="break-all font-mono text-sm text-slate-900">
            {agent.ensResolver ?? 'Resolver not found'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Payment address
          </span>
          <span className="break-all font-mono text-sm text-slate-900">
            {paymentAddress ?? 'Not set'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Hedera reputation
          </span>
          <span className="text-slate-900">
            {isLiveReputation ? reputation.rating : agent.reputationScore} rating
            {' • '}
            {isLiveReputation ? reputation.completions : agent.completionCount} completions
          </span>
        </div>
      </section>
    </main>
  );
}
