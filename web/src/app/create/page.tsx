export default function CreatePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Create Agent
      </h1>
      <p className="text-neutral-600">
        This page will host the World ID gated creation flow, AgentKit
        credentialing, ENS subname registration, and registry writes.
      </p>
    </main>
  );
}
