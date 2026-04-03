import { ReputationBadge } from '@/components/ReputationBadge';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
          Agent Detail
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          {decodeURIComponent(name)}
        </h1>
      </div>
      <ReputationBadge rating="4.8" completions={127} />
      <p className="text-neutral-600">
        This route is reserved for ENS resolution, ZK verification, pricing, and
        reputation history.
      </p>
    </main>
  );
}
