import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateListingSchema } from '../src/schemas/listing.schema.ts';
import { CreateSellerProfileSchema, UpdateStoreStatusSchema } from '../src/schemas/seller.schema.ts';
import { SubmitReportSchema } from '../src/schemas/report.schema.ts';

test('CreateListingSchema validates valid inputs and strips HTML', () => {
  const result = CreateListingSchema.safeParse({
    title: '<b>Crispy Fried Yam & Turkey</b>',
    description: '<script>alert(1)</script>Fresh and hot',
    price: 45,
    price_negotiable: false,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    photos: [],
  });

  assert.ok(result.success);
  if (result.success) {
    assert.strictEqual(result.data.title, 'Crispy Fried Yam & Turkey');
    assert.strictEqual(result.data.description, 'alert(1)Fresh and hot');
  }
});

test('CreateListingSchema rejects invalid category uuid and negative prices', () => {
  const result = CreateListingSchema.safeParse({
    title: 'Test Item',
    price: -10,
    category_id: 'invalid-uuid',
  });

  assert.strictEqual(result.success, false);
});

test('CreateSellerProfileSchema validates storefront slug format and WhatsApp numbers', () => {
  const valid = CreateSellerProfileSchema.safeParse({
    store_name: "Ama's Kitchen",
    storefront_slug: 'amas-kitchen',
    hall_id: 'b1000000-0000-0000-0000-000000000001',
    whatsapp_number: '+233501234567',
    store_description: 'Student food joint',
  });
  assert.ok(valid.success);

  const invalidSlug = CreateSellerProfileSchema.safeParse({
    store_name: "Ama's Kitchen",
    storefront_slug: 'Ama Kitchen with spaces',
    hall_id: 'b1000000-0000-0000-0000-000000000001',
    whatsapp_number: '+233501234567',
  });
  assert.strictEqual(invalidSlug.success, false);

  const invalidPhone = CreateSellerProfileSchema.safeParse({
    store_name: "Ama's Kitchen",
    storefront_slug: 'amas-kitchen',
    hall_id: 'b1000000-0000-0000-0000-000000000001',
    whatsapp_number: '0501234567', // Missing country code
  });
  assert.strictEqual(invalidPhone.success, false);
});

test('SubmitReportSchema validates known report reasons', () => {
  const valid = SubmitReportSchema.safeParse({
    listing_id: '00000000-0000-0000-0000-000000000001',
    reason: 'already_sold',
    details: 'Seller messaged me saying it was finished.',
  });
  assert.ok(valid.success);

  const invalid = SubmitReportSchema.safeParse({
    listing_id: '00000000-0000-0000-0000-000000000001',
    reason: 'non_existent_reason',
  });
  assert.strictEqual(invalid.success, false);
});

test('UpdateStoreStatusSchema validates operating status and strips HTML from notes', () => {
  const valid = UpdateStoreStatusSchema.safeParse({
    store_status: 'PRE_ORDER',
    operating_hours_note: '<b>Next batch at 1:00 PM</b>',
    primary_pickup_spot: "Jean Nelson Porter's Lodge",
  });
  assert.ok(valid.success);
  if (valid.success) {
    assert.strictEqual(valid.data.operating_hours_note, 'Next batch at 1:00 PM');
  }

  const invalid = UpdateStoreStatusSchema.safeParse({
    store_status: 'INVALID_STATE',
  });
  assert.strictEqual(invalid.success, false);
});
