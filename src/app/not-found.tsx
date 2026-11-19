import React from 'react';
import Link from 'next/link';
import { PackageSearch, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 text-center shadow-2xs space-y-4">
        <div className="w-11 h-11 rounded-full bg-neutral-100 text-ug-navy flex items-center justify-center mx-auto">
          <PackageSearch className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-neutral-900">Page Not Found</h1>
          <p className="text-xs text-neutral-500 font-normal leading-relaxed">
            The listing, storefront, or page you are looking for may have expired or been removed.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campus Store</span>
        </Link>
      </div>
    </div>
  );
}
