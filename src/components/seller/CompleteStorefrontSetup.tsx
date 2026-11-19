'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, AlertCircle } from 'lucide-react';
import { completeStorefrontSetup } from '@/actions/auth.actions';
import { getErrorMessage } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';

interface CompleteStorefrontSetupProps {
  userEmail?: string;
  initialStoreName?: string;
  initialWhatsapp?: string;
}

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function CompleteStorefrontSetup({
  userEmail,
  initialStoreName = '',
  initialWhatsapp = '+233',
}: CompleteStorefrontSetupProps) {
  const router = useRouter();
  const toast = useToast();

  const [storeName, setStoreName] = useState(initialStoreName);
  const [storefrontSlug, setStorefrontSlug] = useState(() => toHandle(initialStoreName));
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsapp || '+233');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    setStorefrontSlug(toHandle(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await completeStorefrontSetup({
        storeName,
        storefrontSlug,
        whatsappNumber,
        storeDescription,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success('Storefront setup complete!');
      router.refresh();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to complete storefront setup.');
      setErrorMessage(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-6">
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-ug-navy text-white flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <Store className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">Complete Storefront Setup</h1>
          <p className="text-xs text-neutral-500 mt-1 font-normal">
            {userEmail
              ? `Signed in as ${userEmail}. Finish setting up your hall storefront below.`
              : 'Finish setting up your Jean Nelson AKA Hall storefront to start listing items.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Store Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              placeholder="e.g. Ama's Kitchen or Legon Tech"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Store URL Handle <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center text-xs text-neutral-500 bg-neutral-50/70 rounded-xl border border-neutral-200/90 px-3.5 py-2.5 focus-within:border-ug-navy focus-within:ring-1 focus-within:ring-ug-navy/15">
              <span className="shrink-0 font-mono text-neutral-400">campusstore.ug/store/</span>
              <input
                type="text"
                required
                value={storefrontSlug}
                onChange={(e) =>
                  setStorefrontSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                className="w-full bg-transparent text-neutral-800 text-xs font-medium focus:outline-none ml-0.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Hall of Residence
            </label>
            <input
              type="text"
              disabled
              value="Jean Nelson AKA Hall (Pilot)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500 font-normal cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              WhatsApp Contact Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+233501234567 or 0501234567"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
            />
            <p className="text-[11px] text-neutral-400 mt-1 font-normal">
              Enter +233... or local 050... format. Buyers will message you here.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Store Bio (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Describe your offerings and pickup spots in Jean Nelson AKA Hall..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs resize-none font-normal placeholder:text-neutral-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors shadow-xs disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Saving Storefront...' : 'Save & Launch Storefront'}
          </button>
        </form>
      </div>
    </div>
  );
}

