import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Flag, CheckCircle2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { TakedownButton } from '@/components/admin/TakedownButton';

interface PendingReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    slug: string;
    availability_status: string;
  } | null;
}

export default async function AdminReportsPage() {
  let reports: PendingReportRow[] = [];

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from('reports')
        .select(`
          id,
          reason,
          details,
          status,
          created_at,
          listings (
            id,
            title,
            slug,
            availability_status
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      reports = (data ?? []) as unknown as PendingReportRow[];
    } catch {
      reports = [];
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-normal text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-2xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <Flag className="w-4 h-4 text-neutral-600" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-neutral-900">Buyer Reports</h1>
              <p className="text-xs text-neutral-400 font-normal">
                Pending Community Reports ({reports.length})
              </p>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500 mb-2" strokeWidth={1.5} />
            <p className="text-xs sm:text-sm font-medium text-neutral-700">No pending reports</p>
            <p className="text-xs text-neutral-400 mt-0.5 font-normal">
              The community report queue is clean.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {reports.map((report) => {
              const listing = report.listings;

              return (
                <div
                  key={report.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs sm:text-sm text-neutral-900">
                        {listing?.title ?? 'Listing'}
                      </span>
                      <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                        {report.reason}
                      </span>
                    </div>

                    {report.details && (
                      <p className="text-xs text-neutral-500 italic leading-relaxed font-normal">
                        &ldquo;{report.details}&rdquo;
                      </p>
                    )}
                  </div>

                  {listing && (
                    <TakedownButton
                      listingId={listing.id}
                      reason={report.reason}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
