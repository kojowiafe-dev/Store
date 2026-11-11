import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice } from '../src/lib/utils';

test('formatPrice formats null and undefined gracefully', () => {
  assert.strictEqual(formatPrice(null, 'GHS', false), 'Contact for Price');
  assert.strictEqual(formatPrice(null, 'GHS', true), 'Price Negotiable');
  assert.strictEqual(formatPrice(undefined, 'GHS', false), 'Contact for Price');
});

test('formatPrice formats numerical GHS amounts', () => {
  const result = formatPrice(35, 'GHS', false);
  assert.ok(result.includes('35.00') || result.includes('35'));
  assert.ok(result.includes('GH') || result.includes('GHS'));
});

test('formatPrice appends Negotiable tag when requested', () => {
  const result = formatPrice(120, 'GHS', true);
  assert.ok(result.includes('(Negotiable)'));
});

