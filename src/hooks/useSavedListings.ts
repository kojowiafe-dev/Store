'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'campus-store:saved-ids';
const SYNC_EVENT = 'campus-store:saved-updated';

function readSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function useSavedListings() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSavedIds(readSavedIds());
    setHydrated(true);

    const handleSync = () => {
      setSavedIds(readSavedIds());
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const toggleSaved = useCallback((listingId: string) => {
    const current = readSavedIds();
    const exists = current.includes(listingId);
    const next = exists ? current.filter((id) => id !== listingId) : [listingId, ...current];

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch {
      // Ignore storage quota errors
    }
    setSavedIds(next);
  }, []);

  const isSaved = useCallback(
    (listingId: string) => hydrated && savedIds.includes(listingId),
    [hydrated, savedIds]
  );

  return {
    savedIds,
    savedCount: hydrated ? savedIds.length : 0,
    isSaved,
    toggleSaved,
    hydrated,
  };
}

