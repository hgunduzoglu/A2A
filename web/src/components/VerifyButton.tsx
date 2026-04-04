'use client';

import {
  IDKitRequestWidget,
  IDKitResult,
  RpContext,
  orbLegacy,
} from '@worldcoin/idkit';
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
      throw new Error(result.message || 'Proof verification failed.');
    }

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
    <div className="flex flex-col gap-3">
      <button
        className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
        onClick={() => void startVerification()}
        type="button"
      >
        Verify with World ID
      </button>

      <p className="text-sm text-neutral-600">{status.message}</p>

      {status.type === 'success' ? (
        <p className="text-sm text-emerald-700">
          Verified in {status.mode} mode
          {status.nullifier ? ` • nullifier: ${status.nullifier}` : ''}
        </p>
      ) : null}

      {status.type === 'error' ? (
        <p className="text-sm text-red-600">{status.message}</p>
      ) : null}

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
