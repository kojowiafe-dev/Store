'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, Download, Share2, Loader2 } from 'lucide-react';
import { PILOT_HALL, PLATFORM_NAME } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { ListingAvailabilityStatus } from '@/types/database.types';

interface StatusFlyerModalProps {
  listing: {
    slug: string;
    title: string;
    price: number | null;
    currency: string;
    price_negotiable: boolean;
    availability_status: ListingAvailabilityStatus;
    primary_image_path?: string | null;
  };
  storeName: string;
  storefrontSlug: string;
  hallName?: string;
  pickupSpot?: string | null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  // Ellipsize last line if overflowed
  if (lines.length === maxLines) {
    const lastIdx = maxLines - 1;
    let last = lines[lastIdx];
    while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 4) {
      last = last.slice(0, -1);
    }
    if (words.join(' ').length > lines.join(' ').length) {
      lines[lastIdx] = `${last.trim()}...`;
    }
  }

  return lines;
}

function loadImageWithCors(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function StatusFlyerModal({
  listing,
  storeName,
  storefrontSlug,
  hallName = PILOT_HALL.name,
  pickupSpot,
}: StatusFlyerModalProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  const renderFlyer = useCallback(async () => {
    setGenerating(true);
    try {
      const width = 1080;
      const height = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient (UG Navy)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#001F3F');
      bgGrad.addColorStop(0.55, '#002B57');
      bgGrad.addColorStop(1, '#00142A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle decorative accent circles
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.beginPath();
      ctx.arc(width - 80, 220, 260, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(212, 175, 55, 0.10)';
      ctx.beginPath();
      ctx.arc(100, height - 240, 240, 0, Math.PI * 2);
      ctx.fill();

      // Top Header Brand Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      drawRoundedRect(ctx, 72, 72, width - 144, 116, 28);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 42px system-ui, -apple-system, sans-serif';
      ctx.fillText(PLATFORM_NAME.toUpperCase(), 112, 144);

      ctx.fillStyle = '#A7F3D0';
      ctx.font = '500 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${hallName} · UG`, width - 112, 140);
      ctx.textAlign = 'left';

      // Main White Product Card
      const cardX = 72;
      const cardY = 232;
      const cardW = width - 144;
      const cardH = 1230;
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 42);
      ctx.fill();

      // Product Photo Frame
      const imgX = cardX + 42;
      const imgY = cardY + 42;
      const imgW = cardW - 84;
      const imgH = 740;

      ctx.save();
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 30);
      ctx.clip();

      const productImg = listing.primary_image_path
        ? await loadImageWithCors(listing.primary_image_path)
        : null;

      if (productImg) {
        // Object-fit cover math
        const scale = Math.max(imgW / productImg.width, imgH / productImg.height);
        const drawW = productImg.width * scale;
        const drawH = productImg.height * scale;
        const dx = imgX + (imgW - drawW) / 2;
        const dy = imgY + (imgH - drawH) / 2;
        ctx.drawImage(productImg, dx, dy, drawW, drawH);
      } else {
        // Clean branded placeholder
        const placeholderGrad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
        placeholderGrad.addColorStop(0, '#F0FDF4');
        placeholderGrad.addColorStop(1, '#E2E8F0');
        ctx.fillStyle = placeholderGrad;
        ctx.fillRect(imgX, imgY, imgW, imgH);

        ctx.fillStyle = '#001F3F';
        ctx.font = '700 54px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(storeName, imgX + imgW / 2, imgY + imgH / 2 - 12);
        ctx.fillStyle = '#64748B';
        ctx.font = '500 32px system-ui, -apple-system, sans-serif';
        ctx.fillText('Available Now on Campus Store', imgX + imgW / 2, imgY + imgH / 2 + 44);
        ctx.textAlign = 'left';
      }
      ctx.restore();

      // Availability Badge floating on image
      const isAvail = listing.availability_status === 'AVAILABLE';
      const badgeLabel = isAvail ? 'IN STOCK TODAY' : 'CONFIRM AVAILABILITY';
      ctx.fillStyle = isAvail ? '#059669' : '#D97706';
      drawRoundedRect(ctx, imgX + 28, imgY + 28, isAvail ? 310 : 410, 62, 31);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(badgeLabel, imgX + 58, imgY + 69);

      // Product Title
      const textX = cardX + 48;
      let cursorY = imgY + imgH + 74;
      ctx.fillStyle = '#111827';
      ctx.font = '700 52px system-ui, -apple-system, sans-serif';
      const titleLines = wrapText(ctx, listing.title, cardW - 96, 2);
      for (const line of titleLines) {
        ctx.fillText(line, textX, cursorY);
        cursorY += 66;
      }

      // Price Row
      cursorY += 20;
      const priceText = formatPrice(listing.price, listing.currency, false);
      ctx.fillStyle = '#047857';
      ctx.font = '800 76px system-ui, -apple-system, sans-serif';
      ctx.fillText(priceText, textX, cursorY);

      if (listing.price_negotiable) {
        const priceW = ctx.measureText(priceText).width;
        ctx.fillStyle = '#ECFDF5';
        drawRoundedRect(ctx, textX + priceW + 24, cursorY - 52, 220, 56, 28);
        ctx.fill();
        ctx.fillStyle = '#065F46';
        ctx.font = '600 28px system-ui, -apple-system, sans-serif';
        ctx.fillText('Negotiable', textX + priceW + 58, cursorY - 14);
      }

      // Store & Pickup Footer inside white card
      cursorY += 68;
      ctx.fillStyle = '#F8FAFC';
      drawRoundedRect(ctx, textX, cursorY - 36, cardW - 96, 128, 24);
      ctx.fill();

      ctx.fillStyle = '#001F3F';
      ctx.font = '700 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(storeName, textX + 28, cursorY + 18);

      ctx.fillStyle = '#475569';
      ctx.font = '500 28px system-ui, -apple-system, sans-serif';
      const locationText = pickupSpot ? `Pickup: ${pickupSpot}` : `Hall: ${hallName}`;
      ctx.fillText(locationText, textX + 28, cursorY + 64);

      // Bottom WhatsApp CTA & QR Code Bar
      const footerY = cardY + cardH + 46;
      ctx.fillStyle = '#128C7E';
      drawRoundedRect(ctx, cardX, footerY, cardW, 336, 36);
      ctx.fill();

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://campusstore.ug';
      const listingUrl = `${origin}/listings/${listing.slug}`;
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=6&data=${encodeURIComponent(listingUrl)}`;
      const qrImg = await loadImageWithCors(qrSrc);

      // QR Box
      const qrBoxX = cardX + 36;
      const qrBoxY = footerY + 38;
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, qrBoxX, qrBoxY, 260, 260, 24);
      ctx.fill();

      if (qrImg) {
        ctx.drawImage(qrImg, qrBoxX + 14, qrBoxY + 14, 232, 232);
      } else {
        ctx.fillStyle = '#001F3F';
        ctx.font = '700 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN LINK', qrBoxX + 130, qrBoxY + 138);
        ctx.textAlign = 'left';
      }

      // CTA Copy next to QR
      const ctaX = qrBoxX + 296;
      ctx.fillStyle = '#D1FAE5';
      ctx.font = '700 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('ORDER ON WHATSAPP', ctaX, footerY + 104);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 44px system-ui, -apple-system, sans-serif';
      ctx.fillText('Reply or scan QR', ctaX, footerY + 166);
      ctx.fillText('to order instantly', ctaX, footerY + 220);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '500 24px monospace';
      ctx.fillText(`/store/${storefrontSlug}`, ctaX, footerY + 276);

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewUrl(dataUrl);
    } catch {
      toast.error('Could not render status flyer. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [listing, storeName, storefrontSlug, hallName, pickupSpot, toast]);

  useEffect(() => {
    if (open) {
      renderFlyer();
    }
  }, [open, renderFlyer]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `campus-store-${listing.slug}-status.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Status flyer downloaded! Ready for WhatsApp Status.');
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    setSharing(true);
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], `campus-store-${listing.slug}-status.png`, {
        type: 'image/png',
      });

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `${listing.title} — ${storeName}`,
          text: `Available now at ${storeName} (${hallName}) on ${PLATFORM_NAME}!`,
        });
        toast.success('Opened share sheet for WhatsApp Status!');
      } else {
        handleDownload();
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        handleDownload();
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 transition-colors cursor-pointer"
        title="Generate a 9:16 WhatsApp Status flyer"
      >
        <Sparkles className="w-3 h-3" />
        <span>Status Flyer</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-neutral-200/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  WhatsApp Status Flyer (9:16)
                </h3>
                <p className="text-[11px] text-neutral-400 font-normal mt-0.5">
                  Branded graphic sized for WhatsApp &amp; Instagram Status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close flyer modal"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas Preview */}
            <div className="flex items-center justify-center bg-neutral-100/80 rounded-xl p-3 border border-neutral-200/60 min-h-[340px]">
              {generating || !previewUrl ? (
                <div className="flex flex-col items-center gap-2 text-xs text-neutral-500">
                  <Loader2 className="w-5 h-5 animate-spin text-ug-navy" />
                  <span>Generating 9:16 flyer...</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={`Status flyer for ${listing.title}`}
                  className="max-h-[360px] w-auto rounded-lg shadow-md border border-neutral-200"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={generating || !previewUrl}
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                disabled={generating || sharing || !previewUrl}
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white bg-[#128C7E] hover:bg-[#075E54] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{sharing ? 'Opening...' : 'Post to Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
