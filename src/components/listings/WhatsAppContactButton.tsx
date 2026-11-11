'use client';

import React, { useTransition } from 'react';
import { MessageCircle } from 'lucide-react';
import { recordContactTap } from '@/actions/listing.actions';
import { cn } from '@/lib/utils';

interface WhatsAppContactButtonProps {
  listingId: string;
  whatsappUrl: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WhatsAppContactButton({
  listingId,
  whatsappUrl,
  label = 'Chat on WhatsApp',
  className,
  size = 'md',
}: WhatsAppContactButtonProps) {
  const [, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      recordContactTap(listingId).catch(() => {});
    });
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3 gap-1.5 rounded-lg',
    md: 'text-xs py-2 px-3.5 gap-2 rounded-lg font-medium',
    lg: 'text-sm py-2.5 px-5 gap-2.5 rounded-xl font-medium shadow-xs',
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center font-medium text-white bg-[#128C7E] hover:bg-[#075E54] active:bg-[#064e46] transition-colors focus:outline-none focus:ring-2 focus:ring-[#128C7E]/20',
        sizeClasses[size],
        className
      )}
    >
      <MessageCircle className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} strokeWidth={1.75} />
      <span>{label}</span>
    </a>
  );
}
