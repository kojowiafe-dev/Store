import { ADMIN_WHATSAPP_NUMBER, PLATFORM_NAME, PILOT_HALL } from './constants.ts';

export function buildWhatsAppUrl(params: {
  whatsappNumber: string; // E.164 e.g. "+233501234567"
  productTitle: string;
  storeName?: string;
  platformName?: string;
}): string {
  const cleanPhone = params.whatsappNumber.replace(/[^0-9]/g, '').trim();
  const platform = params.platformName ?? PLATFORM_NAME;
  const greeting = params.storeName ? `Hello ${params.storeName}, ` : 'Hello, ';
  const message = `${greeting}I found your listing for "${params.productTitle}" on ${platform}. Is it still available?`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildDirectStoreWhatsAppUrl(params: {
  whatsappNumber: string;
  storeName: string;
  platformName?: string;
}): string {
  const cleanPhone = params.whatsappNumber.replace(/[^0-9]/g, '').trim();
  const platform = params.platformName ?? PLATFORM_NAME;
  const message = `Hello ${params.storeName}, I found your storefront on ${platform} and would like to ask about your products.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface OrderEnquiryItem {
  title: string;
  price: number | null;
  currency?: string;
  quantity: number;
}

export function buildMultiItemOrderWhatsAppUrl(params: {
  whatsappNumber: string;
  storeName: string;
  items: OrderEnquiryItem[];
  hallName?: string;
  pickupSpot?: string | null;
  platformName?: string;
}): string {
  const cleanPhone = params.whatsappNumber.replace(/[^0-9]/g, '').trim();
  const platform = params.platformName ?? PLATFORM_NAME;

  const validItems = params.items.filter((item) => item.quantity > 0);
  if (validItems.length === 0) {
    return buildDirectStoreWhatsAppUrl({
      whatsappNumber: params.whatsappNumber,
      storeName: params.storeName,
      platformName: platform,
    });
  }

  let knownTotal = 0;
  let hasUnpricedItem = false;

  const lines = validItems.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    if (item.price !== null && Number.isFinite(item.price)) {
      const subtotal = item.price * qty;
      knownTotal += subtotal;
      return `• ${qty}x ${item.title} (GH₵${subtotal.toFixed(2)})`;
    }
    hasUnpricedItem = true;
    return `• ${qty}x ${item.title} (Price on enquiry)`;
  });

  const totalLine =
    knownTotal > 0
      ? `Estimated Total: GH₵${knownTotal.toFixed(2)}${hasUnpricedItem ? ' + unpriced item(s)' : ''}`
      : 'Total: Please confirm prices';

  const locationParts = [params.pickupSpot?.trim(), params.hallName?.trim()].filter(Boolean);
  const locationLine =
    locationParts.length > 0 ? `\nDelivery / Pickup: ${locationParts.join(' · ')}` : '';

  const message = [
    `Hello ${params.storeName}! I found your storefront on ${platform}.`,
    '',
    'I would like to order:',
    ...lines,
    '',
    `${totalLine}${locationLine}`,
    'Are these available right now?',
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildAdminAdWhatsAppUrl(params?: {
  packageTitle?: string;
  priceLabel?: string;
  storeName?: string;
  storefrontSlug?: string;
  listingTitle?: string;
  whatsappNumber?: string;
}): string {
  const cleanPhone = (params?.whatsappNumber ?? ADMIN_WHATSAPP_NUMBER)
    .replace(/[^0-9]/g, '')
    .trim();

  const storePart = params?.storeName
    ? ` for my store "${params.storeName}"${params.storefrontSlug ? ` (/store/${params.storefrontSlug})` : ''}`
    : '';
  const listingPart = params?.listingTitle
    ? ` (Listing: "${params.listingTitle}")`
    : '';
  const pkgPart = params?.packageTitle
    ? ` the "${params.packageTitle}"${params.priceLabel ? ` (${params.priceLabel})` : ''} ad package`
    : ' advertising & promotion packages';

  const message = `Hello ${PLATFORM_NAME} Admin, I would like to book${pkgPart}${storePart}${listingPart} in ${PILOT_HALL.name}. Please share the Mobile Money payment details to activate my promotion.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
