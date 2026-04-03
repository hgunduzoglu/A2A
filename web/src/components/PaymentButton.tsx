'use client';

interface PaymentButtonProps {
  label?: string;
}

export function PaymentButton({
  label = 'Pay with Arc',
}: PaymentButtonProps) {
  return (
    <button
      className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
      type="button"
    >
      {label}
    </button>
  );
}
