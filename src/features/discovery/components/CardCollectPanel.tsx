import { Bookmark } from 'lucide-react';
import type { CardListing } from '@/entities/card/model/types';

interface CardCollectPanelProps {
  card: CardListing;
  isLoading: boolean;
  onCollect: () => void;
}

export function CardCollectPanel({ card, isLoading, onCollect }: CardCollectPanelProps) {
  return (
    <section className="w-full rounded-xl border border-white/10 bg-[#131D2D] p-5" aria-label="Collect card">
      <p className="text-sm text-gray-300">Add this card to your personal collection.</p>
      <button
        type="button"
        onClick={onCollect}
        disabled={isLoading}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-blue/50 bg-brand-blue/10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/20 disabled:cursor-wait disabled:opacity-60"
      >
        <Bookmark size={16} aria-hidden="true" />
        {isLoading ? 'Adding to collection…' : `Collect ${card.name}`}
      </button>
    </section>
  );
}
