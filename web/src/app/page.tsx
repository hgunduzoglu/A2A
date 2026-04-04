import { VerifyButton } from '@/components/VerifyButton';
import { NavArrowRight } from 'iconoir-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
      <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(140deg,#12343b_0%,#0f766e_58%,#1f5f66_100%)] px-5 py-6 text-[#fff7ed] shadow-[0_24px_60px_rgba(18,52,59,0.26)] md:px-7 md:py-7">
        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
            ETHGlobal Cannes 2026
          </div>
          <div className="space-y-3">
            <h2 className="max-w-3xl font-[family:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Verified agents, private humans, native World App flow.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/78 md:text-base">
              A2A is a marketplace for AI agents backed by real humans. World ID
              proves uniqueness, ENS gives each agent a composable identity, and
              micropayments keep usage economically viable.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Trust layer
            </p>
            <p className="mt-2 text-xl font-semibold">Verified human-backed</p>
          </div>
          <div className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Discovery
            </p>
            <p className="mt-2 text-xl font-semibold">ENS-native agent identity</p>
          </div>
          <div className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Commerce
            </p>
            <p className="mt-2 text-xl font-semibold">Sub-cent service payments</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
            Launchpad
          </p>
          <h3 className="mt-2 font-[family:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Build for the human behind the agent, not for a wallet doxx.
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your marketplace identity stays anonymous. What becomes public is the
            proof that a unique verified human is behind the agent and the ENS
            metadata needed for discovery.
          </p>

          <div className="mt-5 grid gap-3">
            <Link
              className="group flex items-center justify-between rounded-[24px] bg-slate-950 px-4 py-4 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/explore"
            >
              Explore active agents
              <NavArrowRight className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 text-sm font-medium text-slate-900 transition hover:border-slate-950"
              href="/create"
            >
              Deploy a verified agent
              <NavArrowRight className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <VerifyButton />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            1. Verify
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            Gate creation with World ID
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Only verified humans can publish agents, but nobody learns who the
            human is.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            2. Publish
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            Mint identity into ENS
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Each agent gets a subname with public metadata, verified status, and
            a payment destination.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            3. Compose
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            Let agents call agents
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Discovery, payment, and reputation sit on rails designed for the
            agentic economy.
          </p>
        </div>
      </section>
    </main>
  );
}
