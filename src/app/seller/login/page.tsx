'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, AlertCircle, ArrowLeft } from 'lucide-react';
import { loginSellerAccount } from '@/actions/auth.actions';
import { getErrorMessage } from '@/lib/constants';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/Toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const next = searchParams.get('next') ?? '/seller';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await loginSellerAccount({
        email,
        password,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success('Signed in successfully!');
      router.push(next.startsWith('/') ? next : result.data.redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'An unexpected error occurred.');
      setErrorMessage(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center max-w-sm mx-auto px-4 py-6">
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
          <h1 className="text-lg font-semibold text-neutral-900">Seller Portal</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-normal">
            Sign in to manage your Jean Nelson AKA Hall storefront
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Email Address
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
              Password
            </label>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors shadow-xs disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500 font-normal">
          <span>New student seller? </span>
          <Link
            href="/seller/register"
            className="font-medium text-ug-navy hover:underline"
          >
            Register storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SellerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center text-xs text-neutral-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
