import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getErrorMessage, isSupabaseConfigured } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      ok: true,
      mode: 'offline',
      needsConfirmationCount: 0,
      expiredCount: 0,
    });
  }

  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: expiredRows, error: expireError } = await admin
      .from('listings')
      .update({
        availability_status: 'EXPIRED',
        updated_at: nowIso,
      })
      .in('availability_status', ['AVAILABLE', 'NEEDS_CONFIRMATION'])
      .lte('expires_at', nowIso)
      .is('deleted_at', null)
      .select('id');

    if (expireError) {
      return NextResponse.json({ error: expireError.message }, { status: 500 });
    }

    const { data: confirmRows, error: confirmError } = await admin
      .from('listings')
      .update({
        availability_status: 'NEEDS_CONFIRMATION',
        updated_at: nowIso,
      })
      .eq('availability_status', 'AVAILABLE')
      .lte('confirm_before', nowIso)
      .gt('expires_at', nowIso)
      .is('deleted_at', null)
      .select('id');

    if (confirmError) {
      return NextResponse.json({ error: confirmError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      expiredCount: expiredRows?.length ?? 0,
      needsConfirmationCount: confirmRows?.length ?? 0,
      ranAt: nowIso,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, 'Cron execution failed.') },
      { status: 500 }
    );
  }
}

