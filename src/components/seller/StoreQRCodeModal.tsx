'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, X, Download, Copy, Check } from 'lucide-react';

interface StoreQRCodeModalProps {
  storeName: string;
  storefrontSlug: string;
}

export function StoreQRCodeModal({ storeName, storefrontSlug }: StoreQRCodeModalProps) {
  const [open, setOpen] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStoreUrl(`${window.location.origin}/store/${storefrontSlug}`);
    }
  }, [storefrontSlug]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const qrImageUrl = storeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&color=001F3F&bgcolor=FFFFFF&data=${encodeURIComponent(storeUrl)}`
    : '';

  const handleCopy = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
      >
        <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span className="hidden sm:inline">QR Code</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-2xl max-w-xs w-full p-5 shadow-xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 truncate">{storeName}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 flex items-center justify-center">
              {qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImageUrl}
                  alt={`QR Code for ${storeName}`}
                  width={220}
                  height={220}
                  className="rounded-lg bg-white"
                />
              ) : (
                <div className="w-[220px] h-[220px] bg-neutral-100 rounded-lg animate-pulse" />
              )}
            </div>

            <p className="text-[11px] text-neutral-500 font-normal leading-relaxed">
              Scan to open your Jean Nelson AKA Hall storefront. Save this image for your WhatsApp Status or room door.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>

              {qrImageUrl && (
                <a
                  href={qrImageUrl}
                  download={`${storefrontSlug}-qr.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-ug-navy hover:bg-ug-navy-light text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

