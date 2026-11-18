'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PILOT_HALL, isSupabaseConfigured, getErrorMessage } from '@/lib/constants';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function SellerRegisterPage() {
  const [storeName, setStoreName] = useState('');
  const [storefrontSlug, setStorefrontSlug] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+233');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync store name to slug
  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    setStorefrontSlug(slug);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (!whatsappNumber.startsWith('+233') || whatsappNumber.length < 12) {
      setErrorMessage('Please provide a valid Ghana WhatsApp number starting with +233.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase is not configured yet. Add your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server.'
      );
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Step 1: Sign up in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: storeName.trim(),
            whatsapp_number: whatsappNumber.trim(),
          },
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        await supabase.from('seller_profiles').insert({
          user_id: authData.user.id,
          hall_id: PILOT_HALL.id,
          store_name: storeName.trim(),
          storefront_slug: storefrontSlug.trim(),
          store_description: storeDescription.trim() || null,
          is_approved: false,
        });
      }

      setIsSuccess(true);
      setLoading(false);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'An unexpected error occurred during registration.');
      if (msg.toLowerCase().includes('failed to fetch')) {
        setErrorMessage(
          'Could not reach Supabase (Failed to fetch). Check that NEXT_PUBLIC_SUPABASE_URL in .env.local is your real project URL, your Supabase project is active, and you restarted npm run dev.'
        );
      } else {
        setErrorMessage(msg);
      }
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[75vh] flex flex-col justify-center max-w-sm mx-auto px-4 py-6">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 text-center shadow-2xs">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-neutral-900 mb-1.5">Check Your Email</h2>
          <p className="text-xs text-neutral-600 leading-relaxed mb-5 font-normal">
            We have sent a confirmation link to <span className="font-medium text-neutral-800">{email}</span>. Click the link to verify your email.
          </p>
          <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-500 mb-5 text-left border border-neutral-200/70 font-normal leading-relaxed">
            <span className="font-medium text-neutral-700 block mb-0.5">What happens next?</span>
            To maintain student buyer trust in Jean Nelson AKA Hall, the campus coordinator will review and activate your storefront within 24 hours of email confirmation.
          </div>
          <Link
            href="/seller/login"
            className="inline-flex w-full justify-center py-2.5 rounded-xl text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors"
          >
            Go to Seller Login
          </Link>
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
              placeholder="+233501234567"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
            />
            <p className="text-[11px] text-neutral-400 mt-1 font-normal">
              Ghana country code +233. Buyers will message you here.
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
