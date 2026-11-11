'use client';

import React, { useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { approveSeller } from '@/actions/admin.actions';

export function ApproveSellerButton({ sellerId }: { sellerId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveSeller(sellerId);
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleApprove}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{isPending ? 'Approving...' : 'Approve Storefront'}</span>
    </button>
  );
}

