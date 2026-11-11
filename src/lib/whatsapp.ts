export function buildWhatsAppUrl(params: {
  whatsappNumber: string; // E.164 e.g. "+233501234567"
  productTitle: string;
  storeName?: string;
  platformName?: string;
}): string {
  // Strip non-digit characters for the wa.me protocol
  const cleanPhone = params.whatsappNumber.replace(/[^0-9]/g, '').trim();
  const platform = params.platformName ?? 'Campus Store';
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
  const platform = params.platformName ?? 'Campus Store';
  const message = `Hello ${params.storeName}, I found your storefront on ${platform} and would like to ask about your products.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

