'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/constants';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      router.push('/seller/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600 transition-colors font-normal disabled:opacity-50 cursor-pointer"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
    </button>
  );
}

