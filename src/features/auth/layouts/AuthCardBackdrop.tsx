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
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const usable = images.filter((src) => !failed.has(src));
  // Stable slots keep the track width and animation clock unchanged when data arrives.
  const cards = Array.from({ length: 12 }, (_, index) => usable.length ? usable[index % usable.length] : null);

  return (
    <div aria-hidden="true" data-testid="auth-card-backdrop" className={`auth-card-backdrop ${mobile ? 'auth-card-backdrop--mobile md:hidden' : 'hidden md:block'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_25%,rgba(114,168,255,0.15),transparent_55%),radial-gradient(ellipse_at_85%_80%,rgba(191,166,89,0.12),transparent_50%)]" />
      <div data-testid={usable.length ? undefined : 'auth-card-fallback'}>
      {(mobile ? [0] : [0, 1]).map((row) => (
        <div key={row} className={`auth-sale-row auth-sale-row--${row}`}>
          <div className="auth-sale-track" data-testid="auth-sale-track" style={reducedMotion ? { animation: 'none', willChange: 'auto' } : undefined}>
            {[0, 1].map((copy) => (
              <div className="auth-sale-group" key={copy}>
                {cards.map((src, index) => (
                  <div className="auth-sale-card" key={index}>
                    <span className="auth-sale-placeholder">
                      <img src="/assets/mythix_logo_white_v3.png" alt="" width={96} height={96} />
                    </span>
                    {src && <img key={src} className={`auth-sale-image${loaded.has(src) ? ' is-loaded' : ''}`} src={src} alt="" width={144} height={200} loading="lazy" decoding="async"
                      style={reducedMotion ? { transition: 'none' } : undefined}
                      onLoad={() => setLoaded((current) => current.has(src) ? current : new Set(current).add(src))}
                      onError={() => setFailed((current) => current.has(src) ? current : new Set(current).add(src))} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>
      <div className="auth-sale-scrim" />
    </div>
  );
}
