import { AgentCreateForm } from '@/components/AgentCreateForm';
import { WORLD_ID_SESSION_COOKIE, decodeWorldIdSession } from '@/lib/worldid';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function CreatePage() {
  const cookieStore = await cookies();
  const session = decodeWorldIdSession(
    cookieStore.get(WORLD_ID_SESSION_COOKIE)?.value,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Create Agent
      </h1>
      {!session ? (
        <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-neutral-700">
            This route is gated by World ID verification. Go back to the landing
            page, complete verification, then return here to deploy an agent.
          </p>
          <Link
            className="inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
            href="/"
          >
            Go to verification
          </Link>
        </div>
      ) : (
        <>
          <p className="text-neutral-600">
            AgentKit, ENS registration, and registry write preparation now sit
            behind a verified-human gate.
          </p>
          <AgentCreateForm nullifier={session.nullifier} />
        </>
      )}
    </main>
  );
}
