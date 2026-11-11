import React from 'react';
import Link from 'next/link';
import { ArrowLeft, PackageSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
        <PackageSearch className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-1">Item or Store Not Found</h1>
      <p className="text-xs text-neutral-500 max-w-xs mb-5 leading-relaxed font-normal">
        The listing or student storefront you are looking for may have been removed, sold out, or expired.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Marketplace</span>
      </Link>
    </div>
  );
}
