'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 text-center shadow-2xs space-y-4">
        <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-neutral-900">Something went wrong</h1>
          <p className="text-xs text-neutral-500 font-normal leading-relaxed">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
