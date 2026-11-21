import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppUrl,
  buildDirectStoreWhatsAppUrl,
  buildMultiItemOrderWhatsAppUrl,
} from '../src/lib/whatsapp.ts';

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

test('buildMultiItemOrderWhatsAppUrl formats multi-item order with total and pickup spot', () => {
  const url = buildMultiItemOrderWhatsAppUrl({
    whatsappNumber: '+233 50 123 4567',
    storeName: "Ama's Kitchen",
    hallName: 'Jean Nelson AKA Hall',
    pickupSpot: "Jean Nelson Porter's Lodge",
    items: [
      { title: 'Hot Jollof Rice', price: 35, quantity: 2 },
      { title: 'Chilled Zobo Drink', price: 10, quantity: 1 },
    ],
  });

  assert.ok(url.startsWith('https://wa.me/233501234567?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes("Hello Ama's Kitchen!"));
  assert.ok(decoded.includes('• 2x Hot Jollof Rice (GH₵70.00)'));
  assert.ok(decoded.includes('• 1x Chilled Zobo Drink (GH₵10.00)'));
  assert.ok(decoded.includes('Estimated Total: GH₵80.00'));
  assert.ok(decoded.includes("Jean Nelson Porter's Lodge"));
});

test('buildMultiItemOrderWhatsAppUrl handles unpriced items gracefully', () => {
  const url = buildMultiItemOrderWhatsAppUrl({
    whatsappNumber: '+233203334455',
    storeName: 'Legon Tech Hub',
    items: [
      { title: 'Laptop Repair', price: null, quantity: 1 },
      { title: 'USB-C Cable', price: 40, quantity: 1 },
    ],
  });

  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('Price on enquiry'));
  assert.ok(decoded.includes('Estimated Total: GH₵40.00 + unpriced item(s)'));
});

