export async function logServiceCompletion(input: Record<string, unknown>) {
  return {
    provider: 'hedera',
    mode: 'stub',
    input,
  };
}
