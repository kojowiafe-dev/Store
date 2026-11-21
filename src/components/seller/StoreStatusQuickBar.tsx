'use client';

import React, { useState, useTransition } from 'react';
import { MapPin, Clock, Check, Radio } from 'lucide-react';
import { updateStoreOperatingStatus } from '@/actions/seller.actions';
import { PRESET_PICKUP_SPOTS, STORE_STATUS_META } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';
import type { StoreOperatingStatus } from '@/types/database.types';

interface StoreStatusQuickBarProps {
  initialStatus: StoreOperatingStatus;
  initialNote: string;
  initialPickupSpot: string;
}

const STATUS_OPTIONS: StoreOperatingStatus[] = ['OPEN_NOW', 'PRE_ORDER', 'CLOSED'];

export function StoreStatusQuickBar({
  initialStatus,
  initialNote,
  initialPickupSpot,
}: StoreStatusQuickBarProps) {
  const toast = useToast();
  const [status, setStatus] = useState<StoreOperatingStatus>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [pickupSpot, setPickupSpot] = useState(initialPickupSpot);
  const [isPending, startTransition] = useTransition();
  const [savedNotice, setSavedNotice] = useState(false);

  const persist = (
    nextStatus: StoreOperatingStatus,
    nextNote: string,
    nextPickup: string,
    silentStatusLabel?: string
  ) => {
    startTransition(async () => {
      const res = await updateStoreOperatingStatus({
        store_status: nextStatus,
        operating_hours_note: nextNote.trim() || null,
        primary_pickup_spot: nextPickup.trim() || null,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
      toast.success(
        silentStatusLabel
          ? `Store status set to ${silentStatusLabel}.`
          : 'Live status & pickup spot updated.'
      );
    });
  };

  const handleStatusTap = (nextStatus: StoreOperatingStatus) => {
    setStatus(nextStatus);
    persist(nextStatus, note, pickupSpot, STORE_STATUS_META[nextStatus].label);
  };

  const handleDetailsSave = (e: React.FormEvent) => {
    e.preventDefault();
    persist(status, note, pickupSpot);
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-ug-navy shrink-0" />
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-neutral-900">
              Live Store Status &amp; Pickup Spot
            </h2>
            <p className="text-[11px] text-neutral-400 font-normal">
              Let students know if you&apos;re active right now and where to collect orders.
            </p>
          </div>
        </div>

        {/* 1-Tap Segmented Status Toggle */}
        <div
          className="inline-flex items-center p-1 bg-neutral-100/90 border border-neutral-200/70 rounded-xl self-start sm:self-auto"
          role="group"
          aria-label="Store operating status"
        >
          {STATUS_OPTIONS.map((option) => {
            const active = status === option;
            const activeClasses =
              option === 'OPEN_NOW'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : option === 'PRE_ORDER'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-neutral-800 text-white shadow-2xs';

            return (
              <button
                key={option}
                type="button"
                disabled={isPending}
                onClick={() => handleStatusTap(option)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer disabled:opacity-60 ${
                  active
                    ? activeClasses
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {STORE_STATUS_META[option].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pickup Spot + Operating Note Row */}
      <form
        onSubmit={handleDetailsSave}
        className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 border-t border-neutral-100"
      >
        <div className="sm:col-span-5">
          <label className="flex items-center gap-1 text-[11px] font-medium text-neutral-600 mb-1">
            <MapPin className="w-3 h-3 text-ug-navy" />
            <span>Campus Pickup Spot</span>
          </label>
          <select
            value={pickupSpot}
            onChange={(e) => setPickupSpot(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200/90 bg-white focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all"
          >
            <option value="">Select pickup spot (optional)</option>
            {PRESET_PICKUP_SPOTS.map((spot) => (
              <option key={spot} value={spot}>
                {spot}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-5">
          <label className="flex items-center gap-1 text-[11px] font-medium text-neutral-600 mb-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>Live Note (optional)</span>
          </label>
          <input
            type="text"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              status === 'PRE_ORDER'
                ? 'e.g. Next batch ready at 1:00 PM'
                : status === 'CLOSED'
                  ? 'e.g. Back tomorrow at 9:00 AM'
                  : 'e.g. Cooking & available until 10:30 PM'
            }
            className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all placeholder:text-neutral-400"
          />
        </div>

        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-ug-navy hover:bg-ug-navy-light text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <span>{isPending ? 'Saving...' : 'Update'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
