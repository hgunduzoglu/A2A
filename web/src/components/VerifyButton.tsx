'use client';

import {
  useIDKitRequest,
  type IDKitResult,
  type RpContext,
  orbLegacy,
} from '@worldcoin/idkit';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useEffect, useRef, useState } from 'react';

type VerificationStatus =
  | { type: 'idle'; message: string }
  | { type: 'pending'; message: string }
  | { type: 'success'; message: string; nullifier: string | null; mode: 'live' | 'mock' }
  | { type: 'error'; message: string };

interface RpSignatureResponse {
  ok: boolean;
  mode: 'live' | 'mock';
  action: string;
  rp_context?: RpContext;
  message: string;
}

interface VerificationResponse {
  ok: boolean;
  mode: 'live' | 'mock';
  message: string;
  nullifier: string | null;
}

const appId = process.env.NEXT_PUBLIC_APP_ID as `app_${string}` | undefined;
const defaultAction = process.env.NEXT_PUBLIC_ACTION_ID ?? 'verify-human';

export function VerifyButton() {
  const { isInstalled } = useMiniKit();
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [action, setAction] = useState(defaultAction);
  const [status, setStatus] = useState<VerificationStatus>({
    type: 'idle',
    message: '',
  });

  const placeholderContext: RpContext = {
    rp_id: '',
    nonce: '',
    created_at: 0,
    expires_at: 0,
    signature: '',
  };

  const flow = useIDKitRequest({
    app_id: appId ?? ('app_placeholder' as `app_${string}`),
    action,
    rp_context: rpContext ?? placeholderContext,
    allow_legacy_proofs: true,
    preset: orbLegacy(),
  });

  const handledResultRef = useRef<IDKitResult | null>(null);

  useEffect(() => {
    if (!flow.result || flow.result === handledResultRef.current) return;
    handledResultRef.current = flow.result;

    void (async () => {
      try {
        const response = await fetch('/api/verify-worldid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flow.result),
        });
        const data = (await response.json()) as VerificationResponse;

        if (!response.ok || !data.ok) {
          await MiniKit.sendHapticFeedback({ hapticsType: 'notification', style: 'error' }).catch(() => {});
          setStatus({ type: 'error', message: data.message || 'Verification failed.' });
          return;
        }

        await MiniKit.sendHapticFeedback({ hapticsType: 'notification', style: 'success' }).catch(() => {});
        setStatus({
          type: 'success',
          message: data.message,
          nullifier: data.nullifier,
          mode: data.mode,
        });
      } catch (err) {
        setStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'Verification failed.',
        });
      }
    })();
  }, [flow.result]);

  useEffect(() => {
    if (flow.errorCode) {
      setStatus({
        type: 'error',
        message: `World ID error: ${flow.errorCode}`,
      });
    }
  }, [flow.errorCode]);

  async function startVerification() {
    await MiniKit.sendHapticFeedback({ hapticsType: 'selection-changed' }).catch(() => {});

    setStatus({ type: 'pending', message: 'Preparing...' });

    try {
      const response = await fetch('/api/rp-signature', { method: 'POST' });
      const result = (await response.json()) as RpSignatureResponse;

      if (!response.ok || !result.ok) {
        setStatus({ type: 'error', message: result.message || 'Failed to prepare verification.' });
        return;
      }

      setAction(result.action);

      if (result.mode === 'mock' || !result.rp_context || !appId) {
        setStatus({ type: 'pending', message: 'Running mock verification...' });
        const mockResponse = await fetch('/api/verify-worldid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: defaultAction,
            mockNullifier: crypto.randomUUID(),
            responses: [],
          }),
        });
        const mockData = (await mockResponse.json()) as VerificationResponse;
        if (mockData.ok) {
          await MiniKit.sendHapticFeedback({ hapticsType: 'notification', style: 'success' }).catch(() => {});
          setStatus({ type: 'success', message: mockData.message, nullifier: mockData.nullifier, mode: 'mock' });
        } else {
          setStatus({ type: 'error', message: mockData.message });
        }
        return;
      }

      setRpContext(result.rp_context);
      setStatus({ type: 'pending', message: 'Approve the verification in World App...' });

      // Small delay to let react update rpContext before opening flow
      setTimeout(() => {
        flow.open();
      }, 100);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to start verification.',
      });
    }
  }

  return (
    <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
            World ID
          </p>
          <h3 className="font-[family:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Prove you are human
          </h3>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            isInstalled
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-white/80 text-slate-500'
          }`}
        >
          {isInstalled ? 'World App' : 'Browser'}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        One-time verification with World ID. Your identity stays private —
        we only store a proof that you are a unique human.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <button
          className="rounded-[22px] bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={status.type === 'pending'}
          onClick={() => void startVerification()}
          type="button"
        >
          {status.type === 'pending' ? 'Verifying...' : 'Verify with World ID'}
        </button>

        {status.type === 'pending' ? (
          <p className="text-center text-sm text-slate-500">{status.message}</p>
        ) : null}

        {status.type === 'success' ? (
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-medium">Verified</p>
            {status.nullifier ? (
              <p className="mt-1 break-all font-mono text-xs text-emerald-700">
                {status.nullifier}
              </p>
            ) : null}
          </div>
        ) : null}

        {status.type === 'error' ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
