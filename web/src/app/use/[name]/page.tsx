import { PaymentButton } from '@/components/PaymentButton';

export default async function UseAgentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Use {decodeURIComponent(name)}
      </h1>
      <p className="text-neutral-600">
        Request composition, nanopayment confirmation, and streamed responses
        will live here.
      </p>
      <PaymentButton label="Pay with Arc" />
    </main>
  );
}
