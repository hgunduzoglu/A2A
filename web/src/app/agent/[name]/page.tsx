import { ReputationBadge } from '@/components/ReputationBadge';
import { resolveAgentProfile } from '@/lib/ens';
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
          Agent Detail
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          {decodedName}
        </h1>
      </div>

      <div className="inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
        Verified human-backed agent
      </div>

      <ReputationBadge
        completions={agent.completionCount}
        rating={agent.reputationScore}
      />

      <p className="text-neutral-600">{description}</p>

      <section className="grid gap-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Category
          </span>
          <span className="text-neutral-900">{agent.category}</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Price
          </span>
          <span className="text-neutral-900">${price} USDC / request</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Endpoint
          </span>
          <span className="break-all text-neutral-900">{endpoint}</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Capabilities
          </span>
          <span className="text-neutral-900">
            {capabilities.length > 0 ? capabilities.join(', ') : 'Not provided'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-950">
          Verification and ENS Metadata
        </h2>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Verification level
          </span>
          <span className="text-neutral-900">{verification}</span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Nullifier hash
          </span>
          <span className="break-all font-mono text-sm text-neutral-900">
            {worldNullifier}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            ENS resolver
          </span>
          <span className="break-all font-mono text-sm text-neutral-900">
            {agent.ensResolver ?? 'Resolver not found'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Payment address
          </span>
          <span className="break-all font-mono text-sm text-neutral-900">
            {paymentAddress ?? 'Not set'}
          </span>
        </div>
      </section>
    </main>
  );
}
