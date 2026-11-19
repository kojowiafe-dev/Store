'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { registerSellerAccount } from '@/actions/auth.actions';
import { getErrorMessage } from '@/lib/constants';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/Toast';

export default function SellerRegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [storeName, setStoreName] = useState('');
  const [storefrontSlug, setStorefrontSlug] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+233');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [autoSignedIn, setAutoSignedIn] = useState(false);

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    setStorefrontSlug(slug);
  };

  const failWith = (message: string) => {
    setErrorMessage(message);
    toast.error(message);
    setLoading(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (password.length < 8) {
      failWith('Password must be at least 8 characters long.');
      return;
    }

    const cleanedPhone = whatsappNumber.replace(/[\s\-()]/g, '').trim();
    const isValidGhanaPhone =
      /^\+233\d{9}$/.test(cleanedPhone) ||
      /^0\d{9}$/.test(cleanedPhone) ||
      /^233\d{9}$/.test(cleanedPhone);

    if (!isValidGhanaPhone) {
      failWith('Enter a valid Ghana WhatsApp number (e.g. +233501234567 or 0501234567).');
      return;
    }

    try {
      const result = await registerSellerAccount({
        storeName,
        storefrontSlug,
        whatsappNumber: cleanedPhone,
        email,
        password,
        storeDescription,
      });

      if (!result.success) {
        failWith(result.error);
        return;
      }

      if (result.data.autoSignedIn) {
        toast.success('Storefront created! Redirecting to your dashboard...');
        router.push('/seller');
        router.refresh();
        return;
      }

      setAutoSignedIn(false);
      setIsSuccess(true);
      setLoading(false);
      toast.success('Storefront registered successfully!');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'An unexpected error occurred during registration.');
      if (msg.toLowerCase().includes('failed to fetch')) {
        failWith(
          'Could not reach the server. Check your internet connection and verify Supabase settings in .env.local.'
        );
      } else {
        failWith(msg);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[75vh] flex flex-col justify-center max-w-sm mx-auto px-4 py-6">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 text-center shadow-2xs">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-neutral-900 mb-1.5">
            Storefront Registered
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed mb-4 font-normal">
            <span className="font-medium text-neutral-900">{storeName}</span> has been registered in{' '}
            <span className="font-medium text-neutral-900">Jean Nelson AKA Hall</span> for{' '}
            <span className="font-medium text-neutral-800">{email.trim()}</span>.
          </p>
          <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-500 mb-5 text-left border border-neutral-200/70 font-normal leading-relaxed">
            <span className="font-medium text-neutral-700 block mb-0.5">What happens next?</span>
            Your storefront link is <span className="font-mono text-neutral-700">/store/{storefrontSlug}</span>. Once the hall coordinator approves your store, your listings go live to all buyers.
          </div>

          <div className="space-y-2">
            {autoSignedIn ? (
              <>
                <Link
                  href="/seller"
                  className="inline-flex w-full justify-center py-2.5 rounded-xl text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors"
                >
                  Go to Seller Dashboard
                </Link>
                <Link
                  href="/seller/login"
                  className="inline-flex w-full justify-center py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200/80 hover:bg-neutral-50 transition-colors"
                >
                  Seller Login
                </Link>
              </>
            ) : (
              <Link
                href="/seller/login"
                className="inline-flex w-full justify-center py-2.5 rounded-xl text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors"
              >
                Go to Seller Login
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex flex-col justify-center max-w-md mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 mb-5 transition-colors font-normal"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Campus Store</span>
      </Link>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-ug-navy text-white flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <Store className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">Open Your Storefront</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-normal">
            Pilot launch: Jean Nelson AKA Hall student sellers
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
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
                onChange={(e) => setStorefrontSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
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
              Student Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. kwame@st.ug.edu.gh"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <PasswordInput
              id="register-password"
              value={password}
              onChange={setPassword}
              minLength={8}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
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
            {loading ? 'Creating Storefront...' : 'Register Storefront'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500 font-normal">
          <span>Already registered? </span>
          <Link
            href="/seller/login"
            className="font-medium text-ug-navy hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
className = "font-medium text-ug-navy hover:underline"
  >
  Sign in
          </Link >
        </div >
      </div >
    </div >
  );
}
className = "font-medium text-ug-navy hover:underline"
  >
  Sign in
          </Link >
        </div >
      </div >
    </div >
  );
}
