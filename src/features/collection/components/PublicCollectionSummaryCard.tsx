import { Avatar } from '@/shared/components/Avatar';
import { Link } from 'react-router-dom';
import { ExternalLink, Layers, Sparkles, Store } from 'lucide-react';
import type { PublicCollectionSummary } from '../api/collection';

interface PublicCollectionSummaryCardProps {
  summary: PublicCollectionSummary;
}

export function PublicCollectionSummaryCard({ summary }: PublicCollectionSummaryCardProps) {
  const remainingCount = Math.max(0, summary.totalCardsCount - summary.highlights.length);

  return (
    <article
      data-testid={`collection-card-${summary.userId}`}
      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-blue/40 hover:bg-bg-elevated hover:shadow-xl hover:shadow-brand-blue/5 font-['IBM_Plex_Sans_Thai',sans-serif]"
    >
      <div>
        {/* Collector Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={summary.displayName} src={summary.avatarUrl} className="size-12 rounded-full border border-white/10 text-lg" />
            <div className="min-w-0">
              <Link
                to={`/collections/${summary.userId}`}
                className="block truncate text-base font-bold text-white hover:text-brand-blue transition-colors"
                title={summary.displayName}
              >
                {summary.displayName}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                {summary.isSeller ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-brand-blue/30 bg-brand-blue/15 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
                    <Store size={12} />
                    Seller
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-gray-300">
                    Collector
                  </span>
                )}
                {summary.sellerStatus === 'APPROVED' && (
                  <span className="text-[10px] font-semibold text-status-success">Verified</span>
                )}
              </div>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-status-success/30 bg-status-success/10 px-2.5 py-0.5 text-[11px] font-medium text-status-success">
            <span className="size-1.5 rounded-full bg-status-success animate-pulse" />
            Public
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-bg-card p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Rare Cards</p>
              <p className="text-sm font-bold text-white truncate">{summary.rareCardCount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-bg-card p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-blue/15 text-brand-blue">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Total Cards</p>
              <p className="text-sm font-bold text-white truncate">{summary.totalCardsCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Card Preview Strip */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Featured Cards
          </p>

          {summary.highlights.length > 0 ? (
            <div className="flex items-center gap-2 overflow-hidden">
              {summary.highlights.map((card, idx) => (
                <div
                  key={`${card.cardId}-${idx}`}
                  className="group/thumb relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-base transition-transform hover:scale-105"
                  title={`${card.name} (${card.rarity || 'Card'})`}
                >
                  <img
                    src={card.imageUrl || '/assets/expensive_card_1.png'}
                    alt={card.name}
                    className="size-full object-contain p-0.5"
                    loading="lazy"
                  />
                  {card.quantity > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] font-bold text-white">
                      ×{card.quantity}
                    </span>
                  )}
                </div>
              ))}

              {remainingCount > 0 && (
                <Link
                  to={`/collections/${summary.userId}`}
                  className="flex h-20 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-bg-card text-center text-xs text-gray-400 transition-colors hover:border-brand-blue hover:text-white"
                  title={`View all ${summary.totalCardsCount} cards`}
                >
                  <span className="font-bold text-sm text-brand-blue">+{remainingCount}</span>
                  <span className="text-[10px]">more</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-white/10 bg-bg-card text-xs text-gray-500">
              No rare preview cards
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <Link
          to={`/collections/${summary.userId}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue/10 py-2.5 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue hover:text-bg-base"
        >
          <ExternalLink size={14} />
          View Collection Showcase
        </Link>

        {summary.isSeller && (
          <Link
            to={`/stores/${summary.userId}`}
            className="inline-flex w-full items-center justify-center gap-1.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <Store size={12} />
            Visit Seller's Store
          </Link>
        )}
      </div>
    </article>
  );
}
