'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { ExactEvmScheme } from '@x402/evm';
import {
  decodePaymentResponseHeader,
  wrapFetchWithPaymentFromConfig,
} from '@x402/fetch';
import { useState, useTransition } from 'react';
import type { TypedData, TypedDataDomain } from 'viem';
import { ReviewForm } from '@/components/ReviewForm';

interface AgentRequestComposerProps {
  agentName: string;
  category: string;
  priceUsdc: string;
  capabilities: string[];
  network: `${string}:${string}`;
  networkLabel?: string;
  chainId: number;
  mode?: 'human' | 'agent';
  callerAgents?: Array<{
    ensName: string;
    category: string;
  }>;
  targetVerification?: {
    verificationLevel: string | null;
    credentialHash: string | null;
  };
}

interface RequestServiceSuccess {
  ok: boolean;
  mode: 'x402';
  agent: string;
  callerAgent?: string | null;
  priceUsdc: string;
  network: string;
  targetVerification?: {
    verificationLevel: string | null;
    credentialHash: string | null;
  };
  result: {
    summary: string;
    prompt: string;
    highlights: string[];
    verdict: string;
  };
  payment?: {
    payer: string | null;
    network: string;
    transaction: string;
  };
}

async function getMiniKitWalletAddress() {
  if (MiniKit.user.walletAddress) {
    return MiniKit.user.walletAddress as `0x${string}`;
  }

  const result = await MiniKit.walletAuth({
    nonce: crypto.randomUUID().replace(/-/g, ''),
    statement: 'Authorize your wallet for A2A x402 payments.',
  });

  return result.data.address as `0x${string}`;
}

export function AgentRequestComposer({
  agentName,
  category,
  priceUsdc,
  capabilities,
  network,
  chainId,
  networkLabel = 'Base Sepolia',
  mode = 'human',
  callerAgents = [],
  targetVerification,
}: AgentRequestComposerProps) {
  const [prompt, setPrompt] = useState(
    'Analyze ETH/USDC sentiment for the last 24 hours.',
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RequestServiceSuccess | null>(null);
  const [paymentTx, setPaymentTx] = useState<string | null>(null);
  const [callerAgentName, setCallerAgentName] = useState(
    callerAgents[0]?.ensName ?? '',
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setPaymentTx(null);

    startTransition(async () => {
      try {
        await MiniKit.sendHapticFeedback({
          hapticsType: 'selection-changed',
        }).catch(() => undefined);

        const address = await getMiniKitWalletAddress();
        const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
          schemes: [
            {
              network,
              client: new ExactEvmScheme({
                address,
                async signTypedData({
                  domain,
                  types,
                  primaryType,
                  message,
                }) {
                  const signature = await MiniKit.signTypedData({
                    domain: domain as TypedDataDomain,
                    types: types as TypedData,
                    primaryType,
                    message,
                    chainId,
                  });

                  if (signature.data.status !== 'success') {
                    throw new Error(
                      signature.data.error_code ?? 'sign_typed_data_failed',
                    );
                  }

                  return signature.data.signature as `0x${string}`;
                },
              }),
            },
          ],
        });

        const response = await fetchWithPayment('/api/request-service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentName,
            callerAgentName: mode === 'agent' ? callerAgentName : undefined,
            prompt,
          }),
        });
        const payload = (await response.json()) as RequestServiceSuccess & {
          message?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message ?? 'Unable to process agent request.');
        }

        const paymentHeader = response.headers.get('PAYMENT-RESPONSE');

        if (paymentHeader) {
          const settlement = decodePaymentResponseHeader(paymentHeader);
          setPaymentTx(settlement.transaction);
        }

        await MiniKit.sendHapticFeedback({
          hapticsType: 'notification',
          style: 'success',
        }).catch(() => undefined);

        setResult(payload);
      } catch (submitError) {
        await MiniKit.sendHapticFeedback({
          hapticsType: 'notification',
          style: 'error',
        }).catch(() => undefined);

        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Unable to complete the x402 request.',
        );
      }
    });
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[30px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)]">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-white">
            {category}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 text-slate-700">
            ${priceUsdc} USDC
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 text-slate-700">
            {network}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {mode === 'agent'
            ? 'Your selected agent will resolve the target over ENS, validate its credential metadata, and trigger the same x402 payment rail before the response is returned.'
            : `This request will trigger an x402 payment on ${networkLabel} before the agent response is returned.`}
        </p>

        <p className="mt-3 text-sm text-slate-600">
          Capabilities: {capabilities.join(', ') || 'general analysis'}
        </p>
        {targetVerification ? (
          <p className="mt-2 text-sm text-slate-600">
            ENS verification: {targetVerification.verificationLevel ?? 'missing'} •
            credential {targetVerification.credentialHash ? 'present' : 'missing'}
          </p>
        ) : null}
      </section>

      <form
        className="grid gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Request prompt</span>
          <textarea
            className="min-h-32 rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
            onChange={(event) => setPrompt(event.target.value)}
            required
            value={prompt}
          />
        </label>

        {mode === 'agent' ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">
              Calling agent
            </span>
            <select
              className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-950"
              onChange={(event) => setCallerAgentName(event.target.value)}
              required
              value={callerAgentName}
            >
              {callerAgents.map((agent) => (
                <option key={agent.ensName} value={agent.ensName}>
                  {agent.ensName} · {agent.category}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          className="rounded-[22px] bg-slate-950 px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending || (mode === 'agent' && !callerAgentName)}
          type="submit"
        >
          {isPending
            ? 'Processing payment...'
            : mode === 'agent'
              ? 'Pay and compose agents'
              : 'Pay and run agent'}
        </button>
      </form>

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="grid gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
              Agent response
            </p>
            <h2 className="mt-2 font-[family:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
              {result.result.summary}
            </h2>
            {result.callerAgent ? (
              <p className="mt-2 text-sm text-slate-600">
                Composed via {result.callerAgent}
              </p>
            ) : null}
          </div>

          <p className="text-sm leading-6 text-slate-700">{result.result.verdict}</p>

          <div className="grid gap-2">
            {result.result.highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-[20px] bg-white/80 px-4 py-3 text-sm text-slate-700"
              >
                {highlight}
              </div>
            ))}
          </div>

          {paymentTx || result.payment?.transaction ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Payment settled: {paymentTx ?? result.payment?.transaction}
            </div>
          ) : null}
        </section>
      ) : null}

      {result ? <ReviewForm agentName={agentName} /> : null}
    </div>
  );
}
