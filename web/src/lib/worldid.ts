import type { IDKitResult, RpContext } from '@worldcoin/idkit';
import { signRequest } from '@worldcoin/idkit/signing';

export type WorldIdMode = 'live' | 'mock';
export const WORLD_ID_SESSION_COOKIE = 'a2a_world_id_session';

export interface WorldIdVerificationResponse {
  ok: boolean;
  mode: WorldIdMode;
  message: string;
  nullifier: string | null;
  verifiedAt: string;
  raw?: unknown;
}

export interface WorldIdSession {
  mode: WorldIdMode;
  nullifier: string;
  verifiedAt: string;
}

export interface RpContextResponse {
  ok: boolean;
  mode: WorldIdMode;
  action: string;
  rp_context?: RpContext;
  message: string;
}

interface WorldIdConfig {
  appId?: string;
  action: string;
  rpId?: string;
  rpSigningKey?: string;
}

function getWorldIdConfig(): WorldIdConfig {
  return {
    appId: process.env.NEXT_PUBLIC_APP_ID,
    action: process.env.NEXT_PUBLIC_ACTION_ID ?? 'verify-human',
    rpId: process.env.RP_ID,
    rpSigningKey: process.env.RP_SIGNING_KEY,
  };
}

export function getWorldIdMode(): WorldIdMode {
  const config = getWorldIdConfig();

  if (!config.appId || !config.rpId || !config.rpSigningKey) {
    return 'mock';
  }

  return 'live';
}

export function getWorldIdAction() {
  return getWorldIdConfig().action;
}

export function encodeWorldIdSession(session: WorldIdSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeWorldIdSession(value?: string | null): WorldIdSession | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value)) as WorldIdSession;
  } catch {
    return null;
  }
}

export function createRpContextResponse(): RpContextResponse {
  const config = getWorldIdConfig();

  if (!config.rpId || !config.rpSigningKey) {
    return {
      ok: true,
      mode: 'mock',
      action: config.action,
      message:
        'RP_ID or RP_SIGNING_KEY is missing. Falling back to mock verification.',
    };
  }

  const signature = signRequest(config.action, config.rpSigningKey);

  return {
    ok: true,
    mode: 'live',
    action: config.action,
    rp_context: {
      rp_id: config.rpId,
      nonce: signature.nonce,
      created_at: signature.createdAt,
      expires_at: signature.expiresAt,
      signature: signature.sig,
    },
    message: 'World ID relying-party context created successfully.',
  };
}

function getFirstNullifier(result: IDKitResult) {
  const response = result.responses[0];

  if (!response) {
    return null;
  }

  if ('nullifier' in response) {
    return response.nullifier;
  }

  if ('session_nullifier' in response) {
    return response.session_nullifier[0] ?? null;
  }

  return null;
}

export async function verifyWorldIdProof(
  payload: IDKitResult | Record<string, unknown>,
): Promise<WorldIdVerificationResponse> {
  const config = getWorldIdConfig();
  const verificationPayload =
    typeof payload === 'object' && payload !== null
      ? {
          ...payload,
          action:
            'action' in payload && typeof payload.action === 'string'
              ? payload.action
              : config.action,
        }
      : payload;

  if (!config.rpId) {
    return {
      ok: true,
      mode: 'mock',
      message:
        'World ID credentials are not configured yet. Returning mock verification.',
      nullifier:
        typeof verificationPayload === 'object' &&
        verificationPayload &&
        'mockNullifier' in verificationPayload
          ? String(verificationPayload.mockNullifier)
          : 'mock-nullifier',
      verifiedAt: new Date().toISOString(),
      raw: verificationPayload,
    };
  }

  const response = await fetch(
    `https://developer.world.org/api/v4/verify/${config.rpId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'A2A/0.1',
      },
      body: JSON.stringify(verificationPayload),
      cache: 'no-store',
    },
  );

  const raw = await response.json().catch(() => null);
  const result = verificationPayload as IDKitResult;
  const nullifier = getFirstNullifier(result);
  const ok =
    response.ok &&
    typeof raw === 'object' &&
    raw !== null &&
    'success' in raw &&
    Boolean(raw.success);

  return {
    ok,
    mode: 'live',
    message: ok
      ? 'World ID proof verified successfully.'
      : 'World ID proof verification failed.',
    nullifier,
    verifiedAt: new Date().toISOString(),
    raw,
  };
}
