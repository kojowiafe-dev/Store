import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();

export const CreateSellerProfileSchema = z.object({
  store_name: z
    .string()
    .min(2, 'Store name must be at least 2 characters.')
    .max(60, 'Store name cannot exceed 60 characters.')
    .transform(stripHtml),
  storefront_slug: z
    .string()
    .min(2, 'Storefront slug must be at least 2 characters.')
    .max(60, 'Storefront slug cannot exceed 60 characters.')
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Slug must consist only of lowercase letters, numbers, and hyphens (e.g. akua-delights).'
    ),
  hall_id: z.string().uuid('Please select a valid campus hall.'),
  whatsapp_number: z
    .string()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      'WhatsApp number must be in international E.164 format (e.g. +233501234567).'
    ),
  store_description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .transform(stripHtml)
    .optional(),
  storefront_image_url: z.string().url('Invalid image URL.').optional(),
});

export const StoreOperatingStatusSchema = z.enum(['OPEN_NOW', 'PRE_ORDER', 'CLOSED']);

export const UpdateSellerProfileSchema = CreateSellerProfileSchema.pick({
  store_description: true,
  storefront_image_url: true,
})
  .extend({
    store_status: StoreOperatingStatusSchema.optional(),
    operating_hours_note: z
      .string()
      .max(120, 'Status note cannot exceed 120 characters.')
      .transform(stripHtml)
      .nullable()
      .optional(),
    primary_pickup_spot: z
      .string()
      .max(120, 'Pickup spot cannot exceed 120 characters.')
      .transform(stripHtml)
      .nullable()
      .optional(),
  })
  .partial();

export const UpdateStoreStatusSchema = z.object({
  store_status: StoreOperatingStatusSchema,
  operating_hours_note: z
    .string()
    .max(120, 'Status note cannot exceed 120 characters.')
    .transform(stripHtml)
    .nullable()
    .optional(),
  primary_pickup_spot: z
    .string()
    .max(120, 'Pickup spot cannot exceed 120 characters.')
    .transform(stripHtml)
    .nullable()
    .optional(),
});

export type CreateSellerProfileInput = z.infer<typeof CreateSellerProfileSchema>;
export type UpdateSellerProfileInput = z.infer<typeof UpdateSellerProfileSchema>;
export type UpdateStoreStatusInput = z.infer<typeof UpdateStoreStatusSchema>;

