import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();

export const SubmitReportSchema = z.object({
  listing_id: z.string().uuid('Invalid listing reference.'),
  reason: z.enum([
    'spam',
    'misleading',
    'inappropriate',
    'already_sold',
    'wrong_price',
    'prohibited_item',
    'other',
  ]),
  details: z
    .string()
    .max(500, 'Details cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
});

export type SubmitReportInput = z.infer<typeof SubmitReportSchema>;

