import type { CardListing } from '@/entities/card/model/types';

/**
 * Filters and returns the top most expensive cards currently on sale.
 *
 * Requirements:
 * - Ready to sell only: status === 'SHOW' and stock > 0
 * - Sorted by price descending (highest first)
 * - Limited to top N (default: 10)
 */
export function getMostExpensiveOnSaleCards(
  listings: CardListing[],
  limit = 10
): CardListing[] {
  return (listings || [])
    .filter((card) => card.status === 'SHOW' && (card.stock ?? 0) > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, limit);
}
