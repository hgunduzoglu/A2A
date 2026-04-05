export function normalizeAgentName(name: string) {
  const trimmed = name.trim();

  return trimmed.length > 0 ? trimmed : 'unnamed-agent';
}

export function toAgentEnsName(name: string, parentDomain: string) {
  const agentName = normalizeAgentName(name);
  const ensLabel = agentName.toLowerCase().replace(/\s+/g, '');

  return {
    agentName,
    ensName: `${ensLabel}.${parentDomain}`,
  };
}
