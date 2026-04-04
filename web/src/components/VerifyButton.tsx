'use client';

import {
  IDKitRequestWidget,
  IDKitResult,
  RpContext,
  orbLegacy,
} from '@worldcoin/idkit';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useState } from 'react';

type VerificationStatus =
  | {
      type: 'idle';
      message: string;
    }
  | {
      type: 'pending';
      message: string;
    }
  | {
      type: 'success';
      message: string;
      nullifier: string | null;
      mode: 'live' | 'mock';
    }
  | {
      type: 'error';
      message: string;
    };

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
  const [isOpen, setIsOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [action, setAction] = useState(defaultAction);
  const [status, setStatus] = useState<VerificationStatus>({
    type: 'idle',
    message: 'Verification not started yet.',
  });

  async function verifyWithBackend(
    payload: IDKitResult | Record<string, unknown>,
  ) {
    const response = await fetch('/api/verify-worldid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as VerificationResponse;

    if (!response.ok || !result.ok) {
      try {
        await MiniKit.sendHapticFeedback({
          hapticsType: 'notification',
          style: 'error',
        });
      } catch {}
      throw new Error(result.message || 'Proof verification failed.');
    }

    try {
      await MiniKit.sendHapticFeedback({
        hapticsType: 'notification',
        style: 'success',
      });
    } catch {}

    setStatus({
      type: 'success',
      message: result.message,
      nullifier: result.nullifier,
      mode: result.mode,
    });
  }

  async function runMockVerification(message: string) {
    setStatus({
      type: 'pending',
      message,
    });

    await verifyWithBackend({
      action: defaultAction,
      mockNullifier: crypto.randomUUID(),
      responses: [],
    });
  }

  async function startVerification() {
    try {
      await MiniKit.sendHapticFeedback({
        hapticsType: 'selection-changed',
      });
    } catch {}

    setStatus({
      type: 'pending',
      message: 'Preparing verification request...',
    });

    const response = await fetch('/api/rp-signature', {
      method: 'POST',
    });
    const result = (await response.json()) as RpSignatureResponse;

    if (!response.ok || !result.ok) {
      setStatus({
        type: 'error',
        message: result.message || 'Unable to prepare World ID verification.',
      });
      return;
    }

    setAction(result.action);

    if (result.mode === 'mock' || !result.rp_context || !appId) {
      await runMockVerification(result.message);
      return;
    }

    setRpContext(result.rp_context);
    setIsOpen(true);
    setStatus({
      type: 'pending',
      message: isInstalled
        ? 'Open World App and approve the verification request.'
        : 'Waiting for a World App verification connection.',
    });
  }

  return (
    <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_40px_rgba(19,34,28,0.06)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
            World ID gate
          </p>
          <h3 className="font-[family:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Verify the human behind the agent.
          </h3>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            isInstalled
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-white text-slate-600'
          }`}
        >
          {isInstalled ? 'Native flow' : 'Preview mode'}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        We verify uniqueness and humanity, then store only the privacy-safe
        nullifier hash.
      </p>

      <div className="mt-5 flex flex-col gap-3">
      <button
        className="rounded-[22px] bg-slate-950 px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={status.type === 'pending'}
        onClick={() => void startVerification()}
        type="button"
      >
        {status.type === 'pending'
          ? 'Preparing verification...'
          : 'Verify with World ID'}
      </button>

      <p className="text-sm text-slate-600">{status.message}</p>

      {status.type === 'success' ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-medium">Verified in {status.mode} mode</p>
          {status.nullifier ? (
            <p className="mt-1 break-all font-mono text-xs">
              nullifier: {status.nullifier}
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

      {appId && rpContext ? (
        <IDKitRequestWidget
          open={isOpen}
          onOpenChange={setIsOpen}
          app_id={appId}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs
          preset={orbLegacy()}
          handleVerify={async (result) => {
            await verifyWithBackend(result);
          }}
          onSuccess={async () => {
            setStatus((current) =>
              current.type === 'success'
                ? current
                : {
                    type: 'success',
                    message: 'World ID verification completed successfully.',
                    nullifier: null,
                    mode: 'live',
                  },
            );
          }}
          onError={async (errorCode) => {
            setStatus({
              type: 'error',
              message: `World ID verification failed: ${errorCode}.`,
            });
          }}
        />
      ) : null}
    </div>
  );
}
