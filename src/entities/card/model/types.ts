export type ListingVisibility = 'SHOW' | 'HIDE';

export interface CardListing {
  id: string;
  cardId?: string;
  sellerId: string;
  sellerName?: string;
  name: string;
  game: string;
  image: string;
  price: number;
  cost: number;
  stock: number;
  status: ListingVisibility;
  condition?: string;
  language?: string;
  set?: string;
  rarity?: string;
  supertype?: string;
  subtypes?: string;
  stage?: string;
  hp?: string;
  types?: string;
  artist?: string;
  imageSmall?: string;
  imageLarge?: string;
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
