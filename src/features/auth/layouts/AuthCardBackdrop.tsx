import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import type { ListingPageResult } from '@/features/discovery/api/listings';
import './AuthCardBackdrop.css';

export function useSaleCardImages(enabled: boolean) {
  const [images, setImages] = useState<string[]>([]);
  const request = useRef<Promise<ListingPageResult> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    // Reuse the request during StrictMode's effect replay, and across auth route changes.
    request.current ??= listingDiscoveryApi.getListings({ page: 0, size: 48 });
    void request.current.then(({ items }) => {
      const seen = new Set<string>();
      const next = items.filter((item) => item.status === 'SHOW' && item.stock > 0)
        .map((item) => (item.imageLarge || item.image || item.imageSmall || '').trim())
        .filter((src) => {
          if (!src || seen.has(src)) return false;
          seen.add(src);
          return true;
        }).slice(0, 12);
      if (active) setImages(next);
    }).catch(() => { /* Decorative content must never block authentication. */ });
    return () => { active = false; };
  }, [enabled]);

  return images;
}

export function AuthCardBackdrop({ images, mobile = false }: { images: string[]; mobile?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const usable = images.filter((src) => !failed.has(src));
  const cards = usable.length ? Array.from({ length: Math.max(8, usable.length) }, (_, index) => usable[index % usable.length]) : [];

  return (
    <div aria-hidden="true" data-testid="auth-card-backdrop" className={`auth-card-backdrop ${mobile ? 'auth-card-backdrop--mobile md:hidden' : 'hidden md:block'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_25%,rgba(114,168,255,0.15),transparent_55%),radial-gradient(ellipse_at_85%_80%,rgba(191,166,89,0.12),transparent_50%)]" />
      {cards.length ? (mobile ? [0] : [0, 1]).map((row) => (
        <div key={row} className={`auth-sale-row auth-sale-row--${row}`}>
          <div className="auth-sale-track" data-testid="auth-sale-track" style={reducedMotion ? { animation: 'none', willChange: 'auto' } : undefined}>
            {[0, 1].map((copy) => (
              <div className="auth-sale-group" key={copy}>
                {cards.map((src, index) => (
                  <img key={`${src}-${index}`} src={src} alt="" width={144} height={200} loading="lazy" decoding="async"
                    onError={() => setFailed((current) => new Set(current).add(src))} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )) : (
        <div data-testid="auth-card-fallback">
          {[0, 1].map((index) => <div key={index} className={`auth-card-back auth-card-back--${index}`}>
            <img src="/assets/mythix_logo_white_v3.png" alt="" width={144} height={200} />
          </div>)}
        </div>
      )}
      <div className="auth-sale-scrim" />
    </div>
  );
}
