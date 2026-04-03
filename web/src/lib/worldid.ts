export interface WorldIdProofPayload {
  action?: string;
  merkle_root?: string;
  nullifier_hash?: string;
  proof?: string;
}

export async function verifyWorldIdProof(payload: WorldIdProofPayload) {
  return {
    ok: Boolean(
      payload.action || payload.merkle_root || payload.nullifier_hash || payload.proof,
    ),
    provider: 'world-id',
    mode: 'stub',
  };
}
