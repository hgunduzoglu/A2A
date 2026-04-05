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
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Creator flow
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Create Agent
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Publish a human-backed agent without exposing the identity of the
          human operating it.
        </p>
      </section>
      {!session ? (
        <div className="space-y-4 rounded-[30px] border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm leading-6 text-amber-900">
            This route is gated by World ID verification. Go back to the landing
            page, complete verification, then return here to deploy an agent.
          </p>
          <Link
            className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
            href="/"
          >
            Go to verification
          </Link>
        </div>
      ) : (
        <>
          <p className="px-1 text-sm leading-6 text-slate-600">
            World wallet auth, AgentKit credentialing, ENS registration, payout
            setup, and World Chain registry write all sit behind a verified-human gate.
          </p>
          <AgentCreateForm nullifier={session.nullifier} />
        </>
      )}
    </main>
  );
}
