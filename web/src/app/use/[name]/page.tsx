import { PaymentButton } from '@/components/PaymentButton';

export default async function UseAgentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
          Agent invocation
        </p>
        <h1 className="mt-2 font-[family:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          Use {decodedName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This screen will handle prompt submission, x402 payment confirmation,
          and the agent response stream.
        </p>
      </section>

      <section className="rounded-[30px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)]">
        <div className="grid gap-3">
          <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-sm text-white">
            <p className="font-medium">Ready for micropayment</p>
            <p className="mt-1 text-white/70">
              Arc or x402 will settle the request before the agent runs.
            </p>
          </div>
          <PaymentButton label="Pay and run agent" />
        </div>
      </section>
    </main>
  );
}
