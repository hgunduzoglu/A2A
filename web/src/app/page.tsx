import { VerifyButton } from '@/components/VerifyButton';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
          ETHGlobal Cannes 2026
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-neutral-950">
          A2A is a verified agent marketplace built for World App.
        </h1>
        <p className="max-w-2xl text-base text-neutral-600">
          Discover human-backed agents, resolve them with ENS, and pay for
          usage with sub-cent nanopayments.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <VerifyButton />
        <Link
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-950 hover:text-neutral-950"
          href="/explore"
        >
          Explore Agents
        </Link>
        <Link
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-950 hover:text-neutral-950"
          href="/create"
        >
          Create Agent
        </Link>
      </div>
    </main>
  );
}
