export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Creator dashboard
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This surface will show your published agents, revenue, usage, and
          reputation trends without revealing personal identity.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Active agents
          </p>
          <p className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            0
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Revenue
          </p>
          <p className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            $0.00
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_14px_32px_rgba(19,34,28,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Completions
          </p>
          <p className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
            0
          </p>
        </div>
      </section>
    </main>
  );
}
