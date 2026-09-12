import type { User } from '@/entities/account/model/types';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import type { Notification } from '@/entities/notification/model/types';
import type { ReservationOrder } from '@/entities/reservation/model/types';

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Ash Ketchum',
    email: 'ash@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0811112222',
  },
  {
    id: 'usr-2',
    name: 'Admin Demo',
    email: 'admin@mythix.com',
    role: 'ADMIN',
    isSeller: false,
    phone: '0898765432',
  },
  {
    id: 'usr-3',
    name: 'Brock Pewter',
    email: 'seller@mythix.com',
    role: 'USER',
    isSeller: true,
    phone: '0899998888',
  },
  {
    id: 'usr-red',
    name: 'Red Champion',
    email: 'red@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0822223333',
  },
  {
    id: 'usr-cynthia',
    name: 'Cynthia Shirona',
    email: 'cynthia@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0833334444',
  },
  {
    id: 'usr-steven',
    name: 'Steven Stone',
    email: 'steven@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0844445555',
  },
  {
    id: 'usr-lance',
    name: 'Lance Dragon',
    email: 'lance@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0866667777',
  },
  {
    id: 'usr-gary',
    name: 'Gary Oak',
    email: 'gary@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0855556666',
  },
];

const mockListingRecords: Array<Omit<CardListing, 'sellerId'>> = [
  {
    id: 'prd-1',
    name: 'Trophy Pikachu - #3',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2000,
    cost: 1500,
    stock: 3,
    status: 'SHOW',
    set: 'P.M. JAPANESE PROMO',
    condition: 'Near Mint-Mint 8',
    marketPrice: 199,
    rarity: 'Promotional Trophy Card',
    stage: 'Basic',
    cardNumber: 'No. 3 / Promotional Trophy Card',
    cardText: 'ポケモンカードゲーム公式トーナメントの3位入賞者であることをここに認定し、その栄誉をたたえる。このカードを所持する者は、第1回ポケモンカードゲーム日本一決定戦への参加権があることを証明する。',
    gradingCompany: 'PSA (Professional Sports Authenticator)',
    grade: 'NM-MT 8 (Near Mint-Mint 8)',
    year: 1998,
    tournament: 'Bronze 3rd-2nd Tournament',
    certNumber: '79170302',
  },
  {
    id: 'prd-2',
    name: 'Pokemon Illustrator',
    game: 'Pokemon',
    image: '/assets/expensive_card_2.png',
    price: 20,
    cost: 15,
    stock: 3,
    status: 'SHOW',
    set: '1998 P.M. Japanese',
    condition: 'Illustration Contest',
    marketPrice: 5,
    rarity: 'Promo',
    stage: 'Basic',
  },
  {
    id: 'prd-3',
    name: 'P.M. SM BLACK STAR',
    game: 'Pokemon',
    image: '/assets/expensive_card_3.png',
    price: 5,
    cost: 3,
    stock: 12,
    status: 'SHOW',
    set: 'TSUNEKAZU ISHIHARA',
    condition: 'ISHIHARA GX-PROMO',
    marketPrice: 100,
    rarity: 'Promo',
    stage: 'Basic',
  },
  {
    id: 'prd-4',
    name: 'KANGASKHAN-HOLO',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2,
    cost: 1,
    stock: 8,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'FAMILY EVENT TROPHY CARD',
    marketPrice: 1000,
    rarity: 'Holo',
    stage: 'Stage 1',
  },
  {
    id: 'prd-5',
    name: 'KANGASKHAN-HOLO',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2,
    cost: 1,
    stock: 4,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'FAMILY EVENT TROPHY CARD',
    marketPrice: 1000,
    rarity: 'Holo',
    stage: 'Stage 1',
  },
  {
    id: 'prd-6',
    name: 'KANGASKHAN-HOLO',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2,
    cost: 1,
    stock: 2,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'FAMILY EVENT TROPHY CARD',
    marketPrice: 1000,
    rarity: 'Holo',
    stage: 'Stage 1',
  },
  {
    id: 'prd-7',
    name: 'Trophy Pikachu - #3',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2000,
    cost: 1500,
    stock: 5,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'Bronze 3rd-2nd Tournament',
    marketPrice: 199,
    rarity: 'Promo',
    stage: 'Basic',
  },
  {
    id: 'prd-8',
    name: 'Pokemon Illustrator',
    game: 'Pokemon',
    image: '/assets/expensive_card_2.png',
    price: 20,
    cost: 15,
    stock: 3,
    status: 'SHOW',
    set: '1998 P.M. Japanese',
    condition: 'Illustration Contest',
    marketPrice: 5,
    rarity: 'Promo',
    stage: 'Basic',
  },
  {
    id: 'prd-9',
    name: 'P.M. SM BLACK STAR',
    game: 'Pokemon',
    image: '/assets/expensive_card_3.png',
    price: 5,
    cost: 3,
    stock: 12,
    status: 'SHOW',
    set: 'TSUNEKAZU ISHIHARA',
    condition: 'ISHIHARA GX-PROMO',
    marketPrice: 100,
    rarity: 'Promo',
    stage: 'Basic',
  },
  {
    id: 'prd-10',
    name: 'KANGASKHAN-HOLO',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2,
    cost: 1,
    stock: 8,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'FAMILY EVENT TROPHY CARD',
    marketPrice: 1000,
    rarity: 'Holo',
    stage: 'Stage 1',
  },
  {
    id: 'prd-11',
    name: 'KANGASKHAN-HOLO',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2,
    cost: 1,
    stock: 4,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'FAMILY EVENT TROPHY CARD',
    marketPrice: 1000,
    rarity: 'Holo',
    stage: 'Stage 1',
  },
  {
    id: 'prd-12',
    name: 'KANGASKHAN-HOLO',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2,
    cost: 1,
    stock: 2,
    status: 'SHOW',
    set: '1998 P.M. Japanese Promo',
    condition: 'FAMILY EVENT TROPHY CARD',
    marketPrice: 1000,
    rarity: 'Holo',
    stage: 'Stage 1',
  },
  {
    id: 'prd-13',
    name: 'P.M. SM BLACK STAR',
    game: 'Pokemon',
    image: '/assets/expensive_card_3.png',
    price: 5,
    cost: 3,
    stock: 0,
    status: 'SHOW',
    set: 'TSUNEKAZU ISHIHARA',
    condition: 'ISHIHARA GX-PROMO',
    marketPrice: 100,
    rarity: 'Promo',
    stage: 'Basic',
  },
  {
    id: 'prd-14',
    name: 'Charizard VMAX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/swsh45/SV107.png',
    price: 3200,
    cost: 2000,
    stock: 2,
    status: 'SHOW',
    set: 'Shining Fates',
    condition: 'Near Mint',
    marketPrice: 3500,
    rarity: 'Secret Rare',
    stage: 'VMAX',
  },
  {
    id: 'prd-15',
    name: 'Mewtwo & Mew-GX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/sm11/71.png',
    price: 1800,
    cost: 1100,
    stock: 3,
    status: 'SHOW',
    set: 'Unified Minds',
    condition: 'Mint',
    marketPrice: 2000,
    rarity: 'Rare Holo GX',
    stage: 'Basic, Tag Team GX',
  },
  {
    id: 'prd-16',
    name: 'Rayquaza VMAX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/swsh7/218.png',
    price: 4500,
    cost: 3000,
    stock: 1,
    status: 'SHOW',
    set: 'Evolving Skies',
    condition: 'Mint',
    marketPrice: 5000,
    rarity: 'Ultra Rare',
    stage: 'VMAX',
  },
  {
    id: 'prd-17',
    name: 'Arceus & Dialga & Palkia-GX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/sm12/156.png',
    price: 2600,
    cost: 1700,
    stock: 4,
    status: 'SHOW',
    set: 'Cosmic Eclipse',
    condition: 'Near Mint',
    marketPrice: 2800,
    rarity: 'Rare Holo GX',
    stage: 'Basic, Tag Team GX',
  },
  {
    id: 'prd-18',
    name: 'Lugia-GX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/sm8/159.png',
    price: 2100,
    cost: 1400,
    stock: 2,
    status: 'SHOW',
    set: 'Lost Thunder',
    condition: 'Mint',
    marketPrice: 2300,
    rarity: 'Rare Holo GX',
    stage: 'Stage 1, GX',
  },
  {
    id: 'prd-19',
    name: 'Umbreon VMAX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/swsh7/215.png',
    price: 8900,
    cost: 6500,
    stock: 1,
    status: 'SHOW',
    set: 'Evolving Skies',
    condition: 'Mint',
    marketPrice: 9500,
    rarity: 'Secret Rare',
    stage: 'VMAX',
  },
  {
    id: 'prd-20',
    name: 'Caterpie',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/sm9/6.png',
    price: 15,
    cost: 5,
    stock: 50,
    status: 'SHOW',
    set: 'Team Up',
    condition: 'Lightly Played',
    marketPrice: 15,
    rarity: 'Common',
    stage: 'Basic',
  },
  {
    id: 'prd-21',
    name: 'Dark Blastoise',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/base5/3.png',
    price: 450,
    cost: 250,
    stock: 5,
    status: 'SHOW',
    set: 'Team Rocket',
    condition: 'Near Mint',
    marketPrice: 480,
    rarity: 'Rare Holo',
    stage: 'Stage 2',
  },
  {
    id: 'prd-22',
    name: 'Mew',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/pop4/4.png',
    price: 320,
    cost: 180,
    stock: 8,
    status: 'SHOW',
    set: 'POP Series 4',
    condition: 'Mint',
    marketPrice: 350,
    rarity: 'Rare',
    stage: 'Basic',
  },
];

export const mockListings: CardListing[] = mockListingRecords.map(
  (listing) => ({ ...listing, sellerId: 'usr-3' }),
);

export const mockReservations: ReservationOrder[] = [
  {
    id: 'ord-1001',
    buyerId: 'usr-1',
    sellerId: 'usr-3',
    items: [
      { listing: mockListings[3], quantity: 2 },
    ],
    totalAmount: 4,
    status: 'RESERVED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ord-1002',
    buyerId: 'usr-1',
    sellerId: 'usr-3',
    items: [
      { listing: mockListings[1], quantity: 1 },
    ],
    totalAmount: 20,
    status: 'FULFILLED',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    paymentConfirmedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockCollection: CollectionEntry[] = [
  // Red Champion (Rank #1: 175 pts)
  {
    id: 'col-red-1',
    ownerId: 'usr-red',
    listing: mockListings[0], // Trophy Pikachu - #3 (Promo: 30 pts)
    quantity: 2, // 60 pts
    sourceOrderId: 'ord-seed-1',
    acquiredAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'col-red-2',
    ownerId: 'usr-red',
    listing: mockListings[13], // Charizard VMAX (Secret Rare: 25 pts)
    quantity: 2, // 50 pts
    sourceOrderId: 'ord-seed-2',
    acquiredAt: '2026-08-05T12:00:00.000Z',
  },
  {
    id: 'col-red-3',
    ownerId: 'usr-red',
    listing: mockListings[14], // Mewtwo & Mew-GX (GX: 20 pts)
    quantity: 2, // 40 pts
    sourceOrderId: 'ord-seed-3',
    acquiredAt: '2026-08-10T14:00:00.000Z',
  },
  {
    id: 'col-red-4',
    ownerId: 'usr-red',
    listing: mockListings[18], // Umbreon VMAX (Secret Rare: 25 pts)
    quantity: 1, // 25 pts
    sourceOrderId: 'ord-seed-4',
    acquiredAt: '2026-08-15T09:00:00.000Z',
  },
  {
    id: 'col-red-5',
    ownerId: 'usr-red',
    listing: mockListings[19], // Caterpie (Common: 0 pts) - FILTERED OUT
    quantity: 10,
    sourceOrderId: 'ord-seed-5',
    acquiredAt: '2026-08-20T11:00:00.000Z',
  },

  // Cynthia Shirona (Rank #2: 160 pts)
  {
    id: 'col-cyn-1',
    ownerId: 'usr-cynthia',
    listing: mockListings[1], // Pokemon Illustrator (Promo: 30 pts)
    quantity: 2, // 60 pts
    sourceOrderId: 'ord-seed-6',
    acquiredAt: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'col-cyn-2',
    ownerId: 'usr-cynthia',
    listing: mockListings[2], // P.M. SM BLACK STAR (Promo: 30 pts)
    quantity: 1, // 30 pts
    sourceOrderId: 'ord-seed-7',
    acquiredAt: '2026-08-06T12:00:00.000Z',
  },
  {
    id: 'col-cyn-3',
    ownerId: 'usr-cynthia',
    listing: mockListings[14], // Mewtwo & Mew-GX (GX: 20 pts)
    quantity: 2, // 40 pts
    sourceOrderId: 'ord-seed-8',
    acquiredAt: '2026-08-11T15:00:00.000Z',
  },
  {
    id: 'col-cyn-4',
    ownerId: 'usr-cynthia',
    listing: mockListings[15], // Rayquaza VMAX (Ultra Rare: 15 pts)
    quantity: 2, // 30 pts
    sourceOrderId: 'ord-seed-9',
    acquiredAt: '2026-08-16T16:00:00.000Z',
  },
  {
    id: 'col-cyn-5',
    ownerId: 'usr-cynthia',
    listing: mockListings[20], // Dark Blastoise (Rare Holo: 0 pts) - FILTERED OUT
    quantity: 4,
    sourceOrderId: 'ord-seed-10',
    acquiredAt: '2026-08-22T08:00:00.000Z',
  },

  // Steven Stone (Rank #3: 130 pts)
  {
    id: 'col-stv-1',
    ownerId: 'usr-steven',
    listing: mockListings[16], // Arceus & Dialga & Palkia-GX (GX: 20 pts)
    quantity: 3, // 60 pts
    sourceOrderId: 'ord-seed-11',
    acquiredAt: '2026-08-03T09:00:00.000Z',
  },
  {
    id: 'col-stv-2',
    ownerId: 'usr-steven',
    listing: mockListings[18], // Umbreon VMAX (Secret Rare: 25 pts)
    quantity: 2, // 50 pts
    sourceOrderId: 'ord-seed-12',
    acquiredAt: '2026-08-07T11:00:00.000Z',
  },
  {
    id: 'col-stv-3',
    ownerId: 'usr-steven',
    listing: mockListings[17], // Lugia-GX (GX: 20 pts)
    quantity: 1, // 20 pts
    sourceOrderId: 'ord-seed-13',
    acquiredAt: '2026-08-12T13:00:00.000Z',
  },
  {
    id: 'col-stv-4',
    ownerId: 'usr-steven',
    listing: mockListings[21], // Mew (Rare: 0 pts) - FILTERED OUT
    quantity: 6,
    sourceOrderId: 'ord-seed-14',
    acquiredAt: '2026-08-23T14:00:00.000Z',
  },

  // Lance Dragon (Rank #4: 90 pts)
  {
    id: 'col-lnc-1',
    ownerId: 'usr-lance',
    listing: mockListings[13], // Charizard VMAX (Secret Rare: 25 pts)
    quantity: 2, // 50 pts
    sourceOrderId: 'ord-seed-15',
    acquiredAt: '2026-08-04T11:00:00.000Z',
  },
  {
    id: 'col-lnc-2',
    ownerId: 'usr-lance',
    listing: mockListings[17], // Lugia-GX (GX: 20 pts)
    quantity: 2, // 40 pts
    sourceOrderId: 'ord-seed-16',
    acquiredAt: '2026-08-08T13:00:00.000Z',
  },
  {
    id: 'col-lnc-3',
    ownerId: 'usr-lance',
    listing: mockListings[20], // Dark Blastoise (Rare Holo: 0 pts) - FILTERED OUT
    quantity: 3,
    sourceOrderId: 'ord-seed-17',
    acquiredAt: '2026-08-24T10:00:00.000Z',
  },

  // Ash Ketchum (Rank #5: 70 pts)
  {
    id: 'col-ash-1',
    ownerId: 'usr-1',
    listing: mockListings[2], // P.M. SM BLACK STAR (Promo: 30 pts)
    quantity: 1, // 30 pts
    sourceOrderId: 'ord-seed-18',
    acquiredAt: '2026-08-05T15:00:00.000Z',
  },
  {
    id: 'col-ash-2',
    ownerId: 'usr-1',
    listing: mockListings[14], // Mewtwo & Mew-GX (GX: 20 pts)
    quantity: 2, // 40 pts
    sourceOrderId: 'ord-seed-19',
    acquiredAt: '2026-08-09T16:00:00.000Z',
  },
  {
    id: 'col-ash-3',
    ownerId: 'usr-1',
    listing: mockListings[19], // Caterpie (Common: 0 pts) - FILTERED OUT
    quantity: 15,
    sourceOrderId: 'ord-seed-20',
    acquiredAt: '2026-08-25T11:00:00.000Z',
  },

  // Gary Oak (Rank #6: 35 pts - will be excluded from top 5)
  {
    id: 'col-gry-1',
    ownerId: 'usr-gary',
    listing: mockListings[15], // Rayquaza VMAX (Ultra Rare: 15 pts)
    quantity: 1, // 15 pts
    sourceOrderId: 'ord-seed-21',
    acquiredAt: '2026-08-06T17:00:00.000Z',
  },
  {
    id: 'col-gry-2',
    ownerId: 'usr-gary',
    listing: mockListings[17], // Lugia-GX (GX: 20 pts)
    quantity: 1, // 20 pts
    sourceOrderId: 'ord-seed-22',
    acquiredAt: '2026-08-10T18:00:00.000Z',
  },
  {
    id: 'col-gry-3',
    ownerId: 'usr-gary',
    listing: mockListings[19], // Caterpie (Common: 0 pts) - FILTERED OUT
    quantity: 8,
    sourceOrderId: 'ord-seed-23',
    acquiredAt: '2026-08-26T12:00:00.000Z',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'ntf-1001',
    recipientId: 'usr-3',
    type: 'ORDER_RESERVED',
    title: 'New card reservation',
    message: 'A buyer reserved cards from your listings.',
    orderId: 'ord-1001',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
