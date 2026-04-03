export async function requestNanopayment(input: Record<string, unknown>) {
  return {
    provider: 'arc',
    rails: 'x402',
    mode: 'stub',
    input,
  };
}
