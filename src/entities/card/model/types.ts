export type ListingVisibility = 'SHOW' | 'HIDE';

export interface CardListing {
  id: string;
  sellerId: string;
  name: string;
  game: string;
  image: string;
  price: number;
  cost: number;
  stock: number;
  status: ListingVisibility;
  condition?: string;
  set?: string;
  rarity?: string;
  stage?: string;
  marketPrice?: number;
  subtitle?: string;
  cardNumber?: string;
  cardText?: string;
  gradingCompany?: string;
  grade?: string;
  year?: string | number;
  tournament?: string;
  certNumber?: string;
}

export interface CollectionEntry {
  id: string;
  ownerId: string;
  listing: CardListing;
  quantity: number;
  sourceOrderId: string;
  acquiredAt: string;
}
