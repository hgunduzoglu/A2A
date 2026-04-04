'use client';

import { useState, useTransition } from 'react';

type AgentFormState = {
  name: string;
  category: string;
  description: string;
  endpoint: string;
  price: string;
  capabilities: string;
};

type RegisterAgentResponse = {
  ok: boolean;
  message?: string;
  agent?: {
    ensName: string;
    category: string;
    endpoint: string;
    price: string;
    capabilities: string[];
    nullifier: string;
  };
  ensRecord?: {
    mode?: string;
    createHash?: string;
    textRecordTransactionHashes?: string[];
  };
  marketplace?: {
    id: number;
    status: string;
    indexedAt: string;
    agentCountForHuman: number;
  };
};

const initialState: AgentFormState = {
  name: '',
  category: 'Analysis',
  description: '',
  endpoint: '',
  price: '0.005',
  capabilities: 'market-analysis, sentiment',
};

interface AgentCreateFormProps {
  nullifier: string;
}

export function AgentCreateForm({ nullifier }: AgentCreateFormProps) {
  const [form, setForm] = useState<AgentFormState>(initialState);
  const [result, setResult] = useState<RegisterAgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof AgentFormState>(
    key: K,
    value: AgentFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    startTransition(async () => {
      const response = await fetch('/api/register-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          capabilities: form.capabilities
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const payload = (await response.json()) as RegisterAgentResponse;

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? 'Unable to register agent.');
        return;
      }

      setResult(payload);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Verified human session is active.
        <div className="mt-2 break-all font-mono text-xs">{nullifier}</div>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800">Agent name</span>
          <input
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="MarketAnalyzer"
            required
            value={form.name}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800">Category</span>
          <select
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            onChange={(event) => updateField('category', event.target.value)}
            value={form.category}
          >
            <option>Trading</option>
            <option>Analysis</option>
            <option>Data</option>
            <option>Content</option>
            <option>Code</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800">Description</span>
          <textarea
            className="min-h-28 rounded-2xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Real-time crypto market analysis with sentiment scoring."
            required
            value={form.description}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800">API endpoint</span>
          <input
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            onChange={(event) => updateField('endpoint', event.target.value)}
            placeholder="https://api.example.com/analyze"
            required
            type="url"
            value={form.endpoint}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800">Price per request</span>
          <input
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            inputMode="decimal"
            onChange={(event) => updateField('price', event.target.value)}
            required
            value={form.price}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800">Capabilities</span>
          <input
            className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-950"
            onChange={(event) => updateField('capabilities', event.target.value)}
            placeholder="market-analysis, sentiment"
            value={form.capabilities}
          />
        </label>

        <button
          className="mt-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Deploying agent...' : 'Deploy Agent'}
        </button>
      </form>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result?.agent ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700 shadow-sm">
          <p className="font-semibold text-neutral-950">
            {result.message ?? 'Agent registered successfully.'}
          </p>
          <p className="mt-2">ENS name: {result.agent.ensName}</p>
          <p>Category: {result.agent.category}</p>
          <p>Endpoint: {result.agent.endpoint}</p>
          <p>Price: {result.agent.price} USDC</p>
          <p>Capabilities: {result.agent.capabilities.join(', ')}</p>
          {result.marketplace ? (
            <p>
              Marketplace index: {result.marketplace.status} • agent #
              {result.marketplace.id}
            </p>
          ) : null}
          {result.ensRecord?.createHash ? (
            <p className="break-all">
              ENS subname tx: {result.ensRecord.createHash}
            </p>
          ) : null}
          {result.ensRecord?.textRecordTransactionHashes?.length ? (
            <p>
              ENS text record txs:{' '}
              {result.ensRecord.textRecordTransactionHashes.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
