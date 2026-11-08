import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers3, ArrowUpRight } from 'lucide-react';
import { collectionApi } from '@/features/collection/api/collection';
import type { CollectionEntry } from '@/entities/card/model/types';
import { Button } from '@/shared/components/Button';

export function ProfileCollectionPreview() {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [items, setItems] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    collectionApi.getMyCollection().then((entries) => {
      if (active) setItems(entries);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  return (
    <section aria-labelledby="profile-collection-heading" className="mt-7 rounded-[28px] border border-border-default bg-bg-surface p-5 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="profile-collection-heading" className="flex items-center gap-3 text-xl font-semibold text-text-primary"><Layers3 size={22} className="text-brand-blue" aria-hidden="true" />My collection</h2>
          <p className="mt-2 text-sm text-text-secondary">Hover or tap a card to see its details.</p>
        </div>
        <Link to="/collection" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-default px-4 text-sm font-medium text-text-primary transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue">View collection<ArrowUpRight size={17} aria-hidden="true" /></Link>
      </header>
      {loading ? (
        <div role="status" aria-label="Loading collection" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[3/4] rounded-xl bg-bg-elevated motion-safe:animate-pulse" />)}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl bg-bg-base/40 p-6 text-center">
          <p className="mb-4 text-sm text-text-secondary">Unable to load your collection. Please try again.</p>
          <Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Try again</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-default px-5 py-10 text-center">
          <Layers3 size={32} className="mx-auto mb-4 text-brand-blue" aria-hidden="true" />
          <h3 className="font-semibold text-text-primary">Your collection starts here</h3>
          <p className="mt-2 text-sm text-text-secondary">Add your first card in My collection and it will appear here.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.slice(0, 6).map((entry) => (
            <li key={entry.id} className="min-w-0">
              <button type="button" aria-label={`Show details for ${entry.listing.name}`} aria-pressed={revealedId === entry.id} onClick={() => setRevealedId((current) => current === entry.id ? null : entry.id)} className="group relative block aspect-[2.5/3.5] w-full overflow-hidden rounded-2xl border border-border-default bg-bg-base p-1.5 text-left transition-colors hover:border-brand-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">
                {entry.listing.image ? <img src={entry.listing.image} alt={entry.listing.name} loading="lazy" className="size-full object-contain transition-transform duration-200 motion-safe:group-hover:scale-[1.03]" /> : <Layers3 size={36} className="mx-auto text-text-muted" aria-label="Card image unavailable" />}
                <span className={`pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/55 to-transparent p-3 transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100 ${revealedId === entry.id ? 'opacity-100' : 'opacity-0'}`}>
                  <span className="mb-2 w-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-black" aria-label={`${entry.quantity} owned`}>×{entry.quantity} owned</span>
                  <span className="line-clamp-2 text-sm font-semibold leading-5 text-white">{entry.listing.name}</span>
                  <span className="mt-1 line-clamp-2 text-xs leading-5 text-gray-200">{entry.listing.set || entry.listing.game}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

