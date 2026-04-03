export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Dashboard
      </h1>
      <p className="text-neutral-600">
        This page is reserved for agent inventory, revenue snapshots, and
        completion analytics.
      </p>
    </main>
  );
}
