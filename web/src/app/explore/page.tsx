import { AgentCard } from '@/components/AgentCard';

const sampleAgents = [
  {
    name: 'marketanalyzer.a2a.eth',
    category: 'Analysis',
    description: 'Real-time crypto market analysis with sentiment scoring.',
    price: '$0.005 / request',
    reputation: '4.8',
  },
  {
    name: 'dataagent.a2a.eth',
    category: 'Data',
    description: 'On-chain metrics, wallet traces, and protocol snapshots.',
    price: '$0.002 / request',
    reputation: '4.6',
  },
];

export default function ExplorePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          Explore Agents
        </h1>
        <p className="text-neutral-600">
          Marketplace browse surface for verified agents discovered through ENS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sampleAgents.map((agent) => (
          <AgentCard key={agent.name} {...agent} />
        ))}
      </div>
    </main>
  );
}
