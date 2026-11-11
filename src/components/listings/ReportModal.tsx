'use client';

import React, { useState, useTransition } from 'react';
import { Flag, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { submitReport } from '@/actions/report.actions';
import type { ReportReason } from '@/types/database.types';

const REASONS: { label: string; value: ReportReason }[] = [
  { label: 'Item is already sold or unavailable', value: 'already_sold' },
  { label: 'Misleading description or incorrect photos', value: 'misleading' },
  { label: 'Wrong or incorrect price listed', value: 'wrong_price' },
  { label: 'Prohibited item or policy violation', value: 'prohibited_item' },
  { label: 'Spam or duplicate listing', value: 'spam' },
  { label: 'Inappropriate or abusive content', value: 'inappropriate' },
  { label: 'Other issue', value: 'other' },
];

interface ReportModalProps {
  listingId: string;
  listingTitle: string;
}

export function ReportModal({ listingId, listingTitle }: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('already_sold');
  const [details, setDetails] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await submitReport({
        listing_id: listingId,
        reason,
        details: details.trim() || undefined,
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsOpen(false);
          setDetails('');
        }, 2000);
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors font-normal"
      >
        <Flag className="w-3 h-3" />
        <span>Report this listing</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-sm">Report Listing</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {isSuccess ? (
              <div className="p-6 text-center flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">Report Received</h4>
                <p className="text-xs text-neutral-500 font-normal leading-relaxed">
                  Thank you for keeping Campus Store safe. Our moderation team will review this listing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
                <div>
                  <p className="text-[11px] text-neutral-400 mb-0.5 font-normal">Listing:</p>
                  <p className="text-xs font-medium text-neutral-800 line-clamp-1">{listingTitle}</p>
                </div>

                {errorMessage && (
                  <div className="p-2.5 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="report-reason" className="block text-xs font-medium text-neutral-700 mb-1">
                    Reason
                  </label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="w-full text-xs rounded-xl border border-neutral-200/90 p-2.5 focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 outline-none font-normal"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="report-details" className="block text-xs font-medium text-neutral-700 mb-1">
                    Details (Optional)
                  </label>
                  <textarea
                    id="report-details"
                    rows={2}
                    maxLength={500}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Brief explanation..."
                    className="w-full text-xs rounded-xl border border-neutral-200/90 p-2.5 focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 outline-none resize-none font-normal placeholder:text-neutral-400"
                  />
                </div>

                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                    className="px-3 py-1.5 text-xs font-normal text-neutral-600 hover:text-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
