import { ReputationBadge } from '@/components/ReputationBadge';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewList } from '@/components/ReviewList';
import { getAgentListingByEnsName } from '@/lib/agents';
import { resolveAgentProfile } from '@/lib/ens';
import { getAgentReputation, getAgentReviews } from '@/lib/hedera';
import { getRegisteredAgentFromWorldChain } from '@/lib/worldchain';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const agent = await getAgentListingByEnsName(decodedName);
  const registryAgent = await getRegisteredAgentFromWorldChain(decodedName);

  if (!agent && !registryAgent) {
    notFound();
  }

  const [ensProfile, reputation, reviewData] = await Promise.all([
    resolveAgentProfile(decodedName),
    getAgentReputation(decodedName),
    getAgentReviews(decodedName),
  ]);
  const records =
    typeof ensProfile === 'object' &&
    ensProfile !== null &&
    'records' in ensProfile &&
    ensProfile.records &&
    typeof ensProfile.records === 'object'
      ? (ensProfile.records as Record<string, string>)
      : {};
  const capabilities = agent?.capabilities ?? registryAgent?.capabilities ?? [];
  const description = agent?.description ?? '';
  const endpoint = agent?.endpoint ?? 'Not set';
  const price = agent?.priceUsdc ?? registryAgent?.priceUsdc ?? '0';
  const paymentAddress = agent?.paymentAddress ?? null;
  const worldNullifier =
    records['world-nullifier'] ??
    agent?.worldNullifierHash ??
    registryAgent?.nullifierHash;
  const verification = agent?.verificationLevel ?? 'unknown';
  const ensResolver =
    typeof ensProfile === 'object' &&
    ensProfile !== null &&
    'resolver' in ensProfile &&
    typeof ensProfile.resolver === 'string'
      ? ensProfile.resolver
      : null;
  const credentialHash = agent?.credentialHash ?? registryAgent?.credentialHash ?? null;
  const nullifierMatchesRegistry = Boolean(
    registryAgent && worldNullifier && registryAgent.nullifierHash === worldNullifier,
  );
  const credentialMatchesRegistry = Boolean(
    registryAgent &&
      credentialHash &&
      registryAgent.credentialHash === credentialHash,
  );
  const capabilitiesMatchRegistry = Boolean(
    registryAgent &&
      JSON.stringify([...registryAgent.capabilities].sort()) ===
        JSON.stringify([...capabilities].sort()),
  );
  const priceMatchesRegistry = Boolean(
    registryAgent && registryAgent.priceUsdc === price,
  );
  const registryVerified = Boolean(
    registryAgent?.active &&
      nullifierMatchesRegistry &&
      credentialMatchesRegistry,
  );

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
        {registryVerified
          ? 'Verified human-backed agent'
          : 'Agent metadata needs verification review'}
      </div>

      <ReputationBadge
        completions={reputation.completions}
        rating={reputation.rating}
      />

      <p className="text-sm leading-6 text-slate-600">{description}</p>

      <div className="flex gap-3">
        <Link
          className="inline-flex rounded-[20px] border border-slate-200 bg-white/75 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-950"
          href={`/use/${encodeURIComponent(decodedName)}`}
        >
          Use this agent
        </Link>
        <Link
          className="inline-flex rounded-[20px] bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          href={`/compose/${encodeURIComponent(decodedName)}`}
        >
          Compose as agent
        </Link>
      </div>

      <section className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Category
          </span>
          <span className="text-slate-900">
            {agent?.category ?? 'Uncategorized'}
          </span>
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
            {ensResolver ?? 'Resolver not found'}
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
            {reputation.rating} rating
            {' • '}
            {reputation.completions} completions
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            AgentKit credential
          </span>
          <span className="text-slate-900">
            {credentialHash
              ? 'Human-backed credential present'
              : 'Credential not found'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-slate-950">
          Reviews
        </h2>
        <ReviewList
          avgRating={reviewData.avgRating}
          reviewCount={reviewData.reviewCount}
          reviews={reviewData.reviews}
        />
      </section>

      <ReviewForm agentName={decodedName} />

      <section className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-slate-950">
          World Chain Registry Check
        </h2>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Registry status
          </span>
          <span className="text-slate-900">
            {registryAgent?.active ? 'Active on World Chain' : 'Not found on registry'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Nullifier consistency
          </span>
          <span className="text-slate-900">
            {registryAgent
              ? nullifierMatchesRegistry
                ? 'ENS and registry match'
                : 'Mismatch detected'
              : 'Registry unavailable'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Credential consistency
          </span>
          <span className="text-slate-900">
            {registryAgent
              ? credentialMatchesRegistry
                ? 'ENS and registry match'
                : 'Mismatch detected'
              : 'Registry unavailable'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Capability consistency
          </span>
          <span className="text-slate-900">
            {registryAgent
              ? capabilitiesMatchRegistry
                ? 'ENS and registry match'
                : 'Mismatch detected'
              : 'Registry unavailable'}
          </span>
        </div>
        <div className="grid gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Price consistency
          </span>
          <span className="text-slate-900">
            {registryAgent
              ? priceMatchesRegistry
                ? 'ENS and registry match'
                : 'Mismatch detected'
              : 'Registry unavailable'}
          </span>
        </div>
      </section>
    </main>
  );
}
