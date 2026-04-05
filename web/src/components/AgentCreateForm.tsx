'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { useState, useTransition } from 'react';

type AgentFormState = {
  name: string;
  category: string;
  description: string;
  endpoint: string;
  price: string;
  capabilities: string;
  paymentAddress: string;
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
    paymentAddress?: string | null;
  };
  ensRecord?: {
    mode?: string;
    createHash?: string;
    textRecordTransactionHashes?: string[];
  };
  registryRecord?: {
    mode?: string;
    contractAddress?: string;
    txHash?: string;
  };
  marketplace?: {
    id: number;
    status: string;
    indexedAt: string;
    agentCountForHuman: number;
  };
  credential?: {
    mode?: string;
    credentialHash?: string;
    chainId?: string;
    humanLookup?: string;
    verifiedAt?: string;
  };
};

type AgentkitContextResponse = {
  ok: boolean;
  message?: string;
  ensName?: string;
  auth?: {
    nonce: string;
    statement?: string;
    requestId?: string;
    expirationTime?: string;
  };
};

const initialState: AgentFormState = {
  name: '',
  category: 'Analysis',
  description: '',
  endpoint: '',
  price: '0.005',
  capabilities: 'market-analysis, sentiment',
  paymentAddress: '',
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
      try {
        await MiniKit.sendHapticFeedback({
          hapticsType: 'selection-changed',
        });
      } catch {}

      try {
        const contextResponse = await fetch('/api/agentkit-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name,
          }),
        });
        const contextPayload =
          (await contextResponse.json()) as AgentkitContextResponse;

        if (
          !contextResponse.ok ||
          !contextPayload.ok ||
          !contextPayload.auth?.nonce
        ) {
          throw new Error(
            contextPayload.message ??
              'Unable to prepare the AgentKit signature challenge.',
          );
        }

        const walletAuthResult = await MiniKit.walletAuth({
          nonce: contextPayload.auth.nonce,
          statement: contextPayload.auth.statement,
          requestId: contextPayload.auth.requestId,
          expirationTime: contextPayload.auth.expirationTime
            ? new Date(contextPayload.auth.expirationTime)
            : undefined,
        });

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
            agentkitAuth: walletAuthResult.data,
          }),
        });

        const payload = (await response.json()) as RegisterAgentResponse;

        if (!response.ok || !payload.ok) {
          try {
            await MiniKit.sendHapticFeedback({
              hapticsType: 'notification',
              style: 'error',
            });
          } catch {}

          setError(payload.message ?? 'Unable to register agent.');
          return;
        }

        try {
          await MiniKit.sendHapticFeedback({
            hapticsType: 'notification',
            style: 'success',
          });
        } catch {}

        setResult(payload);
      } catch (submitError) {
        try {
          await MiniKit.sendHapticFeedback({
            hapticsType: 'notification',
            style: 'error',
          });
        } catch {}

        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Unable to create the AgentKit credential.',
        );
      }
    });
  }

  async function fillWithWorldWallet() {
    setError(null);

    try {
      const result = await MiniKit.walletAuth({
        nonce: crypto.randomUUID().replace(/-/g, ''),
        statement: 'Use this wallet as the payout address for your A2A agent.',
      });

      updateField('paymentAddress', result.data.address);
      await MiniKit.sendHapticFeedback({
        hapticsType: 'notification',
        style: 'success',
      }).catch(() => undefined);
    } catch (walletError) {
      setError(
        walletError instanceof Error
          ? walletError.message
          : 'Unable to load your World wallet address.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Verified human session is active.
        <div className="mt-2 break-all font-mono text-xs">{nullifier}</div>
        <p className="mt-3 text-xs leading-5 text-emerald-800/80">
          Deploying an agent will also prompt a World wallet signature so we can
          mint a live AgentKit credential tied to this anonymous World ID session.
        </p>
      </div>

      <form
        className="grid gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Agent name</span>
          <input
            className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="MarketAnalyzer"
            required
            value={form.name}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Category</span>
          <select
            className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
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
          <span className="text-sm font-medium text-slate-800">Description</span>
          <textarea
            className="min-h-28 rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Real-time crypto market analysis with sentiment scoring."
            required
            value={form.description}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">API endpoint</span>
          <input
            className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            onChange={(event) => updateField('endpoint', event.target.value)}
            placeholder="https://api.example.com/analyze"
            required
            type="url"
            value={form.endpoint}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Price per request</span>
          <input
            className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            inputMode="decimal"
            onChange={(event) => updateField('price', event.target.value)}
            required
            value={form.price}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Capabilities</span>
          <input
            className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            onChange={(event) => updateField('capabilities', event.target.value)}
            placeholder="market-analysis, sentiment"
            value={form.capabilities}
          />
        </label>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-800">
              Payment address
            </span>
            <button
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              onClick={fillWithWorldWallet}
              type="button"
            >
              Use World wallet
            </button>
          </div>
          <input
            className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 font-mono text-sm outline-none transition focus:border-slate-950"
            onChange={(event) => updateField('paymentAddress', event.target.value)}
            placeholder="0x..."
            required
            value={form.paymentAddress}
          />
          <p className="text-xs leading-5 text-slate-500">
            x402 payments will be sent to this address. Use a wallet you control.
          </p>
        </div>

        <button
          className="mt-2 rounded-[22px] bg-slate-950 px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Deploying agent...' : 'Deploy Agent'}
        </button>
      </form>

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result?.agent ? (
        <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-slate-700 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
          <p className="font-semibold text-slate-950">
            {result.message ?? 'Agent registered successfully.'}
          </p>
          <p className="mt-2">ENS name: {result.agent.ensName}</p>
          <p>Category: {result.agent.category}</p>
          <p>Endpoint: {result.agent.endpoint}</p>
          <p>Price: {result.agent.price} USDC</p>
          <p className="break-all">
            Payment address: {result.agent.paymentAddress ?? 'Not set'}
          </p>
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
          {result.registryRecord?.txHash ? (
            <p className="break-all">World Chain registry tx: {result.registryRecord.txHash}</p>
          ) : null}
          {result.registryRecord?.contractAddress ? (
            <p className="break-all">
              AgentRegistry: {result.registryRecord.contractAddress}
            </p>
          ) : null}
          {result.credential?.credentialHash ? (
            <p className="break-all">
              AgentKit credential: {result.credential.mode ?? 'unknown'} •{' '}
              {result.credential.credentialHash}
            </p>
          ) : null}
          {result.credential?.humanLookup ? (
            <p>
              AgentBook lookup:{' '}
              {result.credential.humanLookup === 'found'
                ? 'human-backed wallet found'
                : 'signature verified, no public AgentBook link yet'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
