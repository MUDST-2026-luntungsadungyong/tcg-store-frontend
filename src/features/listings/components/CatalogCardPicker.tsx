import { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';

import {
  catalogApi,
  type CatalogCard,
} from '@/features/discovery/api/catalog';
import { Input } from '@/shared/components/Input';

type CatalogCardPickerProps = {
  card: CatalogCard | null;
  disabled?: boolean;
  error?: string;
  onSelect: (card: CatalogCard | null) => void;
};

export function CatalogCardImageFrame({
  card,
}: {
  card: CatalogCard | null;
}) {
  const image = card?.imageSmall || card?.imageLarge;

  return (
    <div className="flex aspect-[5/7] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-bg-input">
      {image ? (
        <img
          src={image}
          alt={card?.name ?? ''}
          decoding="async"
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="px-4 text-center text-sm text-gray-500">
          Select a card to preview its image
        </span>
      )}
    </div>
  );
}

export function CatalogCardDetails({ card }: { card: CatalogCard }) {
  const details = [
    ['Set', card.setName],
    ['Card number', card.cardNumber && `#${card.cardNumber}`],
    ['Rarity', card.rarity],
    ['Card type', card.supertype],
    ['Stage', card.subtypes],
    ['HP', card.hp && `HP ${card.hp}`],
    ['Energy type', card.types],
    ['Artist', card.artist],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]));

  return (
    <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
        Card details
      </p>
      <p className="mt-1 font-semibold text-white">{card.name}</p>
      {details.length > 0 && (
        <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="mt-0.5 text-gray-300">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {typeof card.marketPrice === 'number' && (
        <p className="mt-2 text-xs text-brand-gold">
          Database market price ฿{card.marketPrice.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export function CatalogCardPicker({
  card,
  disabled = false,
  error,
  onSelect,
}: CatalogCardPickerProps) {
  const [query, setQuery] = useState(card?.name ?? '');
  const [results, setResults] = useState<CatalogCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (resultsRef.current) resultsRef.current.scrollTop = 0;

    if (!isOpen || trimmedQuery.length < 2) return;

    let active = true;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setSearchError(null);
      void catalogApi
        .searchCards(trimmedQuery)
        .then((cards) => {
          if (active) setResults(cards);
        })
        .catch(() => {
          if (active) {
            setResults([]);
            setSearchError('Could not search the card database.');
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [isOpen, query]);

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeWhenOutside);
    return () => document.removeEventListener('mousedown', closeWhenOutside);
  }, []);

  const selectCard = (nextCard: CatalogCard) => {
    onSelect(nextCard);
    setQuery(nextCard.name);
    setIsOpen(false);
    setIsLoading(false);
    setSearchError(null);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-3">
      <Input
        id="seller-listing-card-search"
        label="Card"
        value={query}
        disabled={disabled}
        icon={Search}
        placeholder="Search card name, set, rarity, or number"
        aria-autocomplete="list"
        aria-controls="seller-card-search-results"
        aria-expanded={isOpen}
        onFocus={() => {
          setIsOpen(true);
          if (query.trim().length >= 2 && results.length === 0) {
            setIsLoading(true);
          }
        }}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setIsOpen(true);
          setResults([]);
          setSearchError(null);
          setIsLoading(nextQuery.trim().length >= 2);
          if (card) onSelect(null);
        }}
        error={error}
      />

      {isOpen && !disabled && query.trim().length >= 2 && (
        <div
          ref={resultsRef}
          id="seller-card-search-results"
          role="listbox"
          aria-label="Card search results"
          className="absolute z-20 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-bg-elevated p-1 shadow-xl"
        >
          {isLoading && <p className="px-3 py-3 text-sm text-gray-400">Searching cards…</p>}
          {!isLoading && searchError && <p className="px-3 py-3 text-sm text-status-danger">{searchError}</p>}
          {!isLoading && !searchError && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400">No cards found.</p>
          )}
          {!isLoading && results.map((result) => (
            <button
              key={result.id}
              type="button"
              role="option"
              aria-selected={card?.id === result.id}
              onClick={() => selectCard(result)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
            >
              <div className="h-11 w-8 shrink-0 overflow-hidden rounded bg-bg-input">
                {(result.imageSmall || result.imageLarge) && (
                  <img
                    src={result.imageSmall || result.imageLarge}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{result.name}</span>
                <span className="block truncate text-xs text-gray-400">
                  {[result.setName, result.cardNumber && `#${result.cardNumber}`, result.rarity]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              {card?.id === result.id && <Check size={16} className="text-brand-blue" />}
            </button>
          ))}
        </div>
      )}

      {!card && query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setResults([]);
            setIsLoading(false);
            setSearchError(null);
            onSelect(null);
          }}
          className="absolute right-3 top-9 text-gray-400 hover:text-white"
          aria-label="Clear card search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
