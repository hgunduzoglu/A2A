import { keccak256, stringToHex } from 'viem';

export async function createAgentCredential(input: Record<string, unknown>) {
  const credentialHash = keccak256(stringToHex(JSON.stringify(input)));

  return {
    provider: 'agentkit',
    mode: 'stub',
    credentialHash,
    input,
  };
}
