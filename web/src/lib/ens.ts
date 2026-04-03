export async function registerAgentSubname(input: Record<string, unknown>) {
  return {
    provider: 'ens',
    mode: 'stub',
    input,
  };
}

export async function resolveAgentProfile(name: string) {
  return {
    name,
    provider: 'ens',
    mode: 'stub',
  };
}
