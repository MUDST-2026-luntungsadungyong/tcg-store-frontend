import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { CollectionEntry } from '@/entities/card/model/types';

interface CollectionCardProps {
  entry: CollectionEntry;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function CollectionCard({ entry, onDelete, isDeleting }: CollectionCardProps) {
  const card = entry.listing;

  return (
    <div className="group bg-white rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex flex-row items-center gap-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      {/* Left: Card Art (Clickable) */}
      <Link
        to={`/cards/${card.id}`}
        className="relative w-28 h-36 bg-[#0B141F] rounded-xl border border-gray-200/60 p-2 flex items-center justify-center shrink-0 shadow-inner overflow-hidden cursor-pointer"
        title={`View details of ${card.name}`}
      >
        <img
          src={card.image || '/assets/expensive_card_1.png'}
          alt={card.name}
          className="w-full h-full object-contain filter drop-shadow transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 bg-[#1B2B48] text-[#90B7EC] text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
          OWNED {entry.quantity > 1 ? `×${entry.quantity}` : ''}
        </span>
      </Link>

      {/* Right: Info (Clickable) and Delete Action */}
      <div className="flex-1 flex flex-col justify-between h-full min-w-0 py-1">
        <Link
          to={`/cards/${card.id}`}
          className="block group/link cursor-pointer"
          title={`View details of ${card.name}`}
        >
          <h3 className="text-base font-bold text-gray-900 group-hover/link:text-brand-blue line-clamp-1 transition-colors">
            {card.name}
          </h3>

          <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">
            {card.set || card.game || 'Promo Set'}
          </p>

          <p className="text-xs text-gray-400 mt-2 line-clamp-1">
            {card.tournament || card.condition || 'Mint Condition'}
          </p>
        </Link>

        {onDelete && (
          <div className="pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              disabled={isDeleting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-status-danger/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete from Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
