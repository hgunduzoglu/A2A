'use client';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import type { ReactNode } from 'react';

const appId = process.env.NEXT_PUBLIC_APP_ID;

// Define props for ClientProviders
interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * ClientProvider wraps the app with essential context providers.
 *
 * - ErudaProvider:
 *     - Should be used only in development.
 *     - Enables an in-browser console for logging and debugging.
 *
 * - MiniKitProvider:
 *     - Required for MiniKit functionality.
 *
 * This component ensures both providers are available to all child components.
 */
export default function ClientProviders({
  children,
}: ClientProvidersProps) {
  return (
    <MiniKitProvider props={{ appId }}>{children}</MiniKitProvider>
  );
}
