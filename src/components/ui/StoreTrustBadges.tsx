import React from 'react';
import { GraduationCap, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { STORE_STATUS_META } from '@/lib/constants';
import type { StoreOperatingStatus } from '@/types/database.types';

interface StoreStatusPillProps {
  status?: StoreOperatingStatus;
  note?: string | null;
  compact?: boolean;
}

export function StoreStatusPill({
  status = 'OPEN_NOW',
  note,
  compact = false,
}: StoreStatusPillProps) {
  const meta = STORE_STATUS_META[status] ?? STORE_STATUS_META.OPEN_NOW;

  const styles =
    status === 'OPEN_NOW'
      ? {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500 animate-pulse',
        }
      : status === 'PRE_ORDER'
        ? {
            badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
            dot: 'bg-amber-500',
          }
        : {
            badge: 'bg-neutral-100 text-neutral-600 border-neutral-200/80',
            dot: 'bg-neutral-400',
          };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${styles.badge} ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
      <span>{compact ? meta.shortLabel : meta.label}</span>
      {!compact && note && (
        <span className="font-normal opacity-80 truncate max-w-[180px] sm:max-w-[260px]">
          &middot; {note}
        </span>
      )}
    </span>
  );
}

interface UgVerifiedBadgeProps {
  ugStudentVerified?: boolean;
  hallApproved?: boolean;
  compact?: boolean;
}

export function UgVerifiedBadge({
  ugStudentVerified = false,
  hallApproved = true,
  compact = false,
}: UgVerifiedBadgeProps) {
  if (ugStudentVerified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium text-ug-navy bg-ug-navy/5 border border-ug-navy/15 ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        }`}
        title="Verified University of Ghana student email (@st.ug.edu.gh)"
      >
        <GraduationCap className={compact ? 'w-2.5 h-2.5 text-ug-navy' : 'w-3 h-3 text-ug-navy'} />
        <span>UG Student Verified</span>
      </span>
    );
  }

  if (hallApproved) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'
        }`}
      >
        <CheckCircle2 className={compact ? 'w-2.5 h-2.5 text-emerald-600' : 'w-3 h-3 text-emerald-600'} />
        <span>Hall Verified</span>
      </span>
    );
  }

  return null;
}

interface PickupSpotBadgeProps {
  pickupSpot?: string | null;
  className?: string;
}

export function PickupSpotBadge({ pickupSpot, className = '' }: PickupSpotBadgeProps) {
  if (!pickupSpot) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100/90 border border-neutral-200/70 px-2.5 py-0.5 rounded-full ${className}`}
    >
      <MapPin className="w-3 h-3 text-ug-navy shrink-0" />
      <span className="truncate">{pickupSpot}</span>
    </span>
  );
}

interface OperatingNoteInlineProps {
  note?: string | null;
}

export function OperatingNoteInline({ note }: OperatingNoteInlineProps) {
  if (!note) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-normal">
      <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
      <span>{note}</span>
    </span>
  );
}
