import type { CardListing } from '@/entities/card/model/types';

/** Compatibility covers and seller-created catalog art are not official art. */
export function officialCardImage(card: Pick<CardListing, 'id' | 'cardId' | 'imageSmall' | 'imageLarge'>): string {
  if ((card.cardId || card.id).startsWith('seller-listing-')) return '';
  return card.imageLarge || card.imageSmall || '';
}
