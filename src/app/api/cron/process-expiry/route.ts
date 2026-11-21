import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Verify optional cron secret header for Vercel Cron or GitHub Actions
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        message: 'Mock execution: Supabase service role key not set in environment.',
        timestamp: new Date().toISOString(),
      });
    }

    const adminClient = createAdminClient();

    // 1. Execute SQL RPC function if defined
    const { data, error } = await adminClient.rpc('process_listing_expiry_transitions');

    if (error) {
      // Fallback: execute programmatic two-phase transitions
      const nowIso = new Date().toISOString();

      // Phase 1: AVAILABLE -> NEEDS_CONFIRMATION when confirm_before <= now
      const { data: needsConfirmData } = await adminClient
        .from('listings')
        .update({ availability_status: 'NEEDS_CONFIRMATION', updated_at: nowIso })
        .eq('availability_status', 'AVAILABLE')
        .lte('confirm_before', nowIso)
        .select('id');

      // Phase 2: NEEDS_CONFIRMATION -> EXPIRED when expires_at <= now
      const { data: expiredData } = await adminClient
        .from('listings')
        .update({ availability_status: 'EXPIRED', updated_at: nowIso })
        .eq('availability_status', 'NEEDS_CONFIRMATION')
        .lte('expires_at', nowIso)
        .select('id');

      return NextResponse.json({
        success: true,
        method: 'programmatic_fallback',
        transitions: {
          to_needs_confirmation: needsConfirmData?.length ?? 0,
          to_expired: expiredData?.length ?? 0,
        },
        timestamp: nowIso,
      });
    }

    return NextResponse.json({
      success: true,
      method: 'database_rpc',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Cron execution failed.') },
      { status: 500 }
    );
  }
}

