'use client';

import { MiniKit } from '@worldcoin/minikit-js';

interface PaymentButtonProps {
  label?: string;
}

export function PaymentButton({
  label = 'Pay with Arc',
}: PaymentButtonProps) {
  return (
    <button
      className="w-full rounded-[22px] bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
      onClick={() => {
        void MiniKit.sendHapticFeedback({
          hapticsType: 'impact',
          style: 'light',
        }).catch(() => undefined);
      }}
      type="button"
    >
      {label}
    </button>
  );
}
