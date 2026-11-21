'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle2, AlertCircle, MapPin, Clock } from 'lucide-react';
import { updateSellerProfile } from '@/actions/seller.actions';
import { PRESET_PICKUP_SPOTS, STORE_STATUS_META } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';
import type { StoreOperatingStatus } from '@/types/database.types';

interface SellerProfileFormProps {
  initialDescription: string;
  initialStatus?: StoreOperatingStatus;
  initialOperatingNote?: string;
  initialPickupSpot?: string;
}

const STATUS_OPTIONS: StoreOperatingStatus[] = ['OPEN_NOW', 'PRE_ORDER', 'CLOSED'];

export function SellerProfileForm({
  initialDescription,
  initialStatus = 'OPEN_NOW',
  initialOperatingNote = '',
  initialPickupSpot = '',
}: SellerProfileFormProps) {
  const toast = useToast();
  const [description, setDescription] = useState(initialDescription);
  const [storeStatus, setStoreStatus] = useState<StoreOperatingStatus>(initialStatus);
  const [operatingNote, setOperatingNote] = useState(initialOperatingNote);
  const [pickupSpot, setPickupSpot] = useState(initialPickupSpot);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateSellerProfile({
        store_description: description.trim() || undefined,
        store_status: storeStatus,
        operating_hours_note: operatingNote.trim() || null,
        primary_pickup_spot: pickupSpot.trim() || null,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      setSuccess(true);
      toast.success('Storefront profile updated!');
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Storefront profile updated successfully!</span>
        </div>
      )}

      {/* Operating Status Selector */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Store Operating Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = storeStatus === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setStoreStatus(option)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  active
                    ? 'bg-ug-navy text-white border-ug-navy shadow-2xs'
                    : 'bg-white text-neutral-600 border-neutral-200/90 hover:border-neutral-300'
                }`}
              >
                {STORE_STATUS_META[option].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pickup Spot + Operating Hours Note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-neutral-700 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-ug-navy" />
            <span>Primary Campus Pickup Spot</span>
          </label>
          <select
            value={pickupSpot}
            onChange={(e) => setPickupSpot(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-neutral-200/90 bg-white focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs"
          >
            <option value="">Select pickup spot (optional)</option>
            {PRESET_PICKUP_SPOTS.map((spot) => (
              <option key={spot} value={spot}>
                {spot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-neutral-700 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Operating Hours / Batch Note</span>
          </label>
          <input
            type="text"
            maxLength={120}
            value={operatingNote}
            onChange={(e) => setOperatingNote(e.target.value)}
            placeholder="e.g. Cooking & available until 10:30 PM"
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs font-normal placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          Store Bio / Description
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your offerings, pickup spots in Jean Nelson AKA Hall, or general hours..."
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200/90 focus:outline-none focus:border-ug-navy focus:ring-1 focus:ring-ug-navy/15 transition-all shadow-2xs resize-none font-normal placeholder:text-neutral-400"
        />
        <div className="flex justify-end text-[11px] text-neutral-400 mt-1 font-normal">
          {description.length} / 500
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-ug-navy hover:bg-ug-navy-light transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
