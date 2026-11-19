'use server';

import { createClient, createServerDbClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/constants';
import { SubmitReportSchema, type SubmitReportInput } from '@/schemas/report.schema';
import type { ActionResult } from '@/types/api.types';

export async function submitReport(
  rawInput: SubmitReportInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const parseResult = SubmitReportSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Please select a valid report reason.',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    if (!isSupabaseConfigured()) {
      return { success: true, data: { id: `mock-report-${Date.now()}` } };
    }

    const input = parseResult.data;
    const supabase = await createClient();

    // Check optional reporter session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = await createServerDbClient();
    const { data: report, error } = await db
      .from('reports')
      .insert({
        listing_id: input.listing_id,
        reporter_id: user?.id ?? null,
        reason: input.reason,
        details: input.details ?? null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !report) {
      return {
        success: false,
        error: error?.message ?? 'Failed to submit report.',
      };
    }

    return { success: true, data: { id: report.id } };
  } catch {
    return { success: false, error: 'Failed to submit report.' };
  }
}
