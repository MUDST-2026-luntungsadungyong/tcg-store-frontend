import { useEffect, useState } from 'react';
import { listingsApi } from '../api/listings';
import { evaluateImageRules, type ListingImageRules } from './imagePolicy';

export interface ListingRulesInput {
  cardId: string;
  price: number;
  condition: string;
  gradingCompany?: string;
  rarity?: string;
  game?: string;
}

export function useListingImageRules(input: ListingRulesInput, enabled: boolean) {
  const key = JSON.stringify(input);
  const [result, setResult] = useState<{ key: string; rules?: ListingImageRules; failed?: boolean }>();
  useEffect(() => {
    const snapshot: ListingRulesInput = JSON.parse(key);
    if (!enabled || !snapshot.cardId || !Number.isFinite(snapshot.price) || snapshot.price <= 0) return;
    let active = true;
    const timer = setTimeout(() => {
      void listingsApi.validateListingRules(snapshot).then(rules => {
        if (active) setResult({ key, rules });
      }).catch(() => { if (active) setResult({ key, failed: true }); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [enabled, key]);
  const current = result?.key === key ? result : undefined;
  return {
    rules: current?.rules ?? evaluateImageRules({ ...input, rarity: input.cardId.startsWith('seller-listing-') ? undefined : input.rarity }),
    pending: enabled && Boolean(input.cardId) && !current,
    failed: Boolean(current?.failed),
  };
}
