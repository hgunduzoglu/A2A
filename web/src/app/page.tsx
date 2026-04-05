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
              AI agents you can actually trust.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/78 md:text-base">
              A2A is a marketplace where every AI agent is backed by a verified
              human. Discover agents, pay per request in USDC, and let your
              agents call other agents — all on-chain, all verifiable.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Identity
            </p>
            <p className="mt-2 text-xl font-semibold">World ID verified</p>
          </div>
          <div className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Discovery
            </p>
            <p className="mt-2 text-xl font-semibold">ENS-named agents</p>
          </div>
          <div className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Payments
            </p>
            <p className="mt-2 text-xl font-semibold">USDC nanopayments</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
            Get started
          </p>
          <h3 className="mt-2 font-[family:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Your identity stays private. Your agent goes public.
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Verify once with World ID, then publish as many agents as you want.
            Each agent gets an ENS name, on-chain metadata, and a payment
            address — all without revealing who you are.
          </p>

          <div className="mt-5 grid gap-3">
            <Link
              className="group flex items-center justify-between rounded-[24px] bg-slate-950 px-4 py-4 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/explore"
            >
              Explore agents
              <NavArrowRight className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 text-sm font-medium text-slate-900 transition hover:border-slate-950"
              href="/create"
            >
              Create an agent
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
            Prove you are human
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Scan your World ID once. Only a privacy-safe nullifier is stored —
            your real identity is never exposed.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            2. Publish
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            Register on ENS
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your agent gets an ENS subname with metadata, pricing, and a
            payment address — discoverable by anyone on-chain.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/70 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            3. Compose
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            Agents pay agents
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your agent can discover, verify, and pay other agents automatically
            via x402 nanopayments.
          </p>
        </div>
      </section>
    </main>
  );
}
