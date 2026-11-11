import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();

export const CreateListingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters.')
    .max(120, 'Title cannot exceed 120 characters.')
    .transform(stripHtml),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number.' })
    .min(0, 'Price cannot be negative.')
    .nullable()
    .optional(),
  price_negotiable: z.boolean().default(false),
  category_id: z.string().uuid('Please select a valid category.'),
  photos: z
    .array(z.string())
    .max(3, 'You can upload a maximum of 3 photos.')
    .default([]),
});

export const UpdateListingSchema = CreateListingSchema.partial();

export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

