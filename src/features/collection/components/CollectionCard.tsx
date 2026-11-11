import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Trash2, Trophy } from 'lucide-react';
import type { CollectionEntry } from '@/entities/card/model/types';
import { ConditionLabel } from '@/shared/components/ConditionLabel';

interface CollectionCardProps {
  entry: CollectionEntry;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  visitorOwnedQuantity?: number | null;
}

export function CollectionCard({
  entry,
  onDelete,
  isDeleting,
  visitorOwnedQuantity,
}: CollectionCardProps) {
  const card = entry.listing;
  const showComparison = typeof visitorOwnedQuantity === 'number';
  const visitorOwnsCard = showComparison && visitorOwnedQuantity > 0;

  return (
    <article className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-white/10 bg-bg-card p-2 shadow-[0_16px_34px_rgba(0,0,0,0.16)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-brand-blue/45 hover:shadow-[0_20px_42px_rgba(0,0,0,0.26)] sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-4">
      <Link
        to={`/cards/${card.id}`}
        className="relative flex aspect-[2.5/3.5] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-bg-base p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card sm:h-36 sm:w-28 sm:aspect-auto sm:rounded-xl sm:p-2"
        title={`View details of ${card.name}`}
      >
        <img
          src={card.image || '/assets/expensive_card_1.png'}
          alt={card.name}
          className="h-full w-full object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.38)] transition-transform duration-300 group-hover:scale-[1.035]"
        />
      </Link>

      <div className="flex min-w-0 w-full flex-1 items-start justify-between gap-3 py-1 pb-8 sm:w-auto sm:self-stretch sm:pb-1 sm:pr-12">
        <Link
          to={`/cards/${card.id}`}
          className="min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
          title={`View details of ${card.name}`}
        >
          <h3 className="truncate pr-7 text-sm font-semibold text-gray-100 transition-colors group-hover:text-brand-blue sm:pr-0 sm:text-xl">
            {card.name}
          </h3>
          <p className="mt-1 truncate text-xs text-gray-400 sm:text-sm">
            {card.set || card.game || 'Promo Set'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-gray-400 sm:text-xs">Condition:</span>
            <ConditionLabel condition={card.condition} fallback="Not specified" size="xs" />
            {entry.auctionWon && <span className="inline-flex items-center gap-1 text-brand-gold" title={entry.provenance}>
              <Trophy size={13} aria-hidden="true" /> Auction won
              {entry.gradingCompany && entry.grade && ` · ${entry.gradingCompany} ${entry.grade}`}
            </span>}
            {card.tournament && (
              <span className="truncate text-[11px] text-gray-400 sm:text-xs">· {card.tournament}</span>
            )}
          </div>

          {showComparison && (
            <div className="mt-2.5">
              <span
                data-testid="card-comparison-badge"
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  visitorOwnsCard
                    ? 'border-status-success/40 bg-status-success/15 text-status-success'
                    : 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
                }`}
              >
                {visitorOwnsCard ? (
                  <>
                    <CheckCircle2 size={12} aria-hidden="true" />
                    {`คุณครอบครองการ์ดใบนี้แล้ว ${visitorOwnedQuantity} ใบ`}
                  </>
                ) : (
                  <>
                    <CircleDashed size={12} aria-hidden="true" />
                    คุณยังไม่มีการ์ดใบนี้
                  </>
                )}
              </span>
            </div>
          )}
        </Link>

        {onDelete && (
          <button
            type="button"
            aria-label={`Remove ${card.name} from collection`}
            title="Remove from collection"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
            }}
            disabled={isDeleting}
            className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full border border-white/10 bg-bg-elevated/95 text-gray-400 transition-colors hover:border-status-danger/50 hover:bg-status-danger/10 hover:text-status-danger focus:outline-none focus:ring-2 focus:ring-status-danger focus:ring-offset-2 focus:ring-offset-bg-card disabled:cursor-not-allowed disabled:opacity-50 sm:static sm:size-10 sm:shrink-0"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <span
        aria-label={`${entry.quantity} ${entry.quantity === 1 ? 'card' : 'cards'} owned`}
        title={`${entry.quantity} owned`}
        className="pointer-events-none absolute bottom-2 right-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-blue px-2 text-xs font-bold tabular-nums text-bg-base shadow-md sm:bottom-4 sm:right-4 sm:h-9 sm:min-w-9 sm:px-2.5 sm:text-sm"
      >
        × {entry.quantity}
      </span>
    </article>
  );
}
