import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppUrl, buildDirectStoreWhatsAppUrl } from '../src/lib/whatsapp';

test('buildWhatsAppUrl cleans special characters and encodes product title', () => {
  const url = buildWhatsAppUrl({
    whatsappNumber: '+233 (50) 123-4567',
    productTitle: 'Hot Jollof Rice & Chicken',
    storeName: "Ama's Kitchen",
  });

  assert.ok(url.startsWith('https://wa.me/233501234567?text='));
  assert.ok(url.includes(encodeURIComponent("Hello Ama's Kitchen,")));
  assert.ok(url.includes(encodeURIComponent('Hot Jollof Rice & Chicken')));
  assert.ok(url.includes(encodeURIComponent('Campus Store')));
});

test('buildDirectStoreWhatsAppUrl creates clean direct store message', () => {
  const url = buildDirectStoreWhatsAppUrl({
    whatsappNumber: '+233 20 333 4455',
    storeName: 'Legon Tech Hub',
  });

  assert.ok(url.startsWith('https://wa.me/233203334455?text='));
  assert.ok(url.includes(encodeURIComponent('Hello Legon Tech Hub,')));
  assert.ok(url.includes(encodeURIComponent('found your storefront on Campus Store')));
});

