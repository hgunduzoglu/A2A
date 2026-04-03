export async function createAgentCredential(input: Record<string, unknown>) {
  return {
    provider: 'agentkit',
    mode: 'stub',
    input,
  };
}
