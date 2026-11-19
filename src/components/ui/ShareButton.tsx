'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'subtle';
}

export function ShareButton({
  title,
  text,
  url,
  label = 'Share Store',
  className = '',
  variant = 'secondary',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const getShareUrl = () => {
    if (url) {
      if (url.startsWith('http')) return url;
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
      }
    }
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to menu
      }
    }
    setShowMenu(!showMenu);
  };

  const handleCopy = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const shareUrl = getShareUrl();
    const message = `${text} ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  };

  const variantStyles = {
    primary:
      'bg-ug-navy hover:bg-ug-navy-light text-white border-transparent shadow-xs',
    secondary:
      'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200/90 shadow-2xs',
    subtle:
      'bg-transparent hover:bg-neutral-100 text-neutral-600 border-transparent',
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={handleNativeShare}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-medium border transition-all active:scale-[0.98] select-none cursor-pointer ${variantStyles[variant]} ${className}`}
      >
        <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>{label}</span>
      </button>

      {/* Fallback Share Popover for Desktop or browsers without native share */}
      {showMenu && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-neutral-200/90 shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors text-left"
          >
            <MessageCircle className="w-4 h-4 text-[#128C7E]" />
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-neutral-500" />
              <span>Copy Link</span>
            </div>
            {copied && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-normal">
                <Check className="w-3 h-3" />
                Copied
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

