import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase environment is not yet configured, allow public browsing to function
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  }) as unknown as SupabaseClient<Database>;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect authenticated sellers away from login/register pages directly to dashboard
  if (
    user &&
    (pathname.startsWith('/seller/login') || pathname.startsWith('/seller/register'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/seller';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Protect seller portal routes (allow login and register pages)
  if (
    pathname.startsWith('/seller') &&
    !pathname.startsWith('/seller/login') &&
    !pathname.startsWith('/seller/register')
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/seller/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes: must be authenticated and have is_admin = true
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/seller/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // Verify admin role in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      // Redirect non-admins to homepage silently
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/seller/:path*', '/admin/:path*'],
};

