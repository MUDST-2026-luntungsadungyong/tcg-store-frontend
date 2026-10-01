import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CardListing } from '@/entities/card/model/types';
import { formatCondition } from '@/entities/card/model/condition';
import { collectionApi } from '@/features/collection';
import { ContextualLoginModal, useAuthStore } from '@/features/auth';
import { useReservationCartStore } from '@/features/reservation-cart';
import { Card3DViewer } from '@/features/discovery/components/Card3DViewer';
import { CardCollectPanel } from '@/features/discovery/components/CardCollectPanel';
import { SellerOffersSection } from '@/features/discovery/components/SellerOffersSection';
import { SimilarCardsSection } from '@/features/discovery/components/SimilarCardsSection';
import { catalogApi, type CatalogCard } from '@/features/discovery/api/catalog';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToastStore } from '@/shared/model/useToastStore';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup'; // CASE 7: success popup


export function CardDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<CardListing | null>(null);
  const [catalogCard, setCatalogCard] = useState<CatalogCard | null>(null);
  const [offers, setOffers] = useState<CardListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCollectSuccessPopup, setShowCollectSuccessPopup] = useState(false); // CASE 7

  const addToast = useToastStore(state => state.addToast);
  const addItem = useReservationCartStore(state => state.addItem);
  const token = useAuthStore(state => state.token);

  const fetchCard = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setCard(null);
    setCatalogCard(null);
    setOffers([]);
    try {
      const listingResult = await listingDiscoveryApi.getListings({ cardId: id, page: 0, size: 100, sortBy: 'price', sortDir: 'asc' });
      let foundOffers = listingResult.items.filter(offer => offer.cardId === id);
      let foundCard = foundOffers[0];

      if (!foundCard) {
        const directListing = await listingDiscoveryApi.getListingById(id).catch(() => undefined);
        if (directListing) {
          foundCard = directListing;
          const related = await listingDiscoveryApi.getListings({ cardId: directListing.cardId, search: directListing.cardId ? undefined : directListing.name, page: 0, size: 100, sortBy: 'price', sortDir: 'asc' }).catch(() => undefined);
          foundOffers = related?.items.filter(candidate => directListing.cardId
            ? candidate.cardId === directListing.cardId
            : candidate.name === directListing.name && candidate.set === directListing.set) ?? [directListing];
        }
      }

      if (!foundCard) {
        const catalogCard = await catalogApi.getCardById(id).catch(() => undefined);
        if (catalogCard) {
          foundCard = {
            id: catalogCard.id,
            cardId: catalogCard.id,
            sellerId: '',
            name: catalogCard.name,
            game: catalogCard.game || 'Pokemon',
            image: catalogCard.imageLarge || catalogCard.imageSmall || '',
            price: Number(catalogCard.marketPrice ?? 0),
            cost: 0,
            stock: 0,
            status: 'SHOW',
            rarity: catalogCard.rarity,
            set: catalogCard.setName,
            cardNumber: catalogCard.cardNumber,
            subtitle: catalogCard.supertype,
            stage: catalogCard.subtypes,
            cardText: [catalogCard.hp, catalogCard.types].filter(Boolean).join(' · '),
          };
        }
      }

      setCard(foundCard ?? null);
      setOffers(foundOffers.sort((a, b) => a.price - b.price));
      if (foundCard) {
        setCatalogCard({
          id: foundCard.cardId || foundCard.id,
          name: foundCard.name,
          game: foundCard.game,
          supertype: foundCard.subtitle,
          subtypes: foundCard.stage,
          rarity: foundCard.rarity,
          setName: foundCard.set,
          cardNumber: foundCard.cardNumber,
          imageLarge: foundCard.image,
          marketPrice: foundCard.marketPrice ?? foundCard.price,
        });
      }
    } catch (cause) {
      console.error('Failed to fetch card details', cause);
      setError('Unable to load card details from server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchCard(); }, [fetchCard]);

  const addOfferToCart = async (offer: CardListing, quantity: number) => {
    if (!token) { setShowLoginModal(true); return; }
    setLoadingOfferId(offer.id);
    try {
      const success = await addItem(offer, quantity);
      addToast(success
        ? { type: 'success', message: `Added ${quantity} × ${offer.name} to your reservation cart.` }
        : { type: 'error', message: 'Unable to add this listing to your cart. Please try again.' });
    } finally { setLoadingOfferId(null); }
  };

  const reserveOfferNow = async (offer: CardListing, quantity: number) => {
    if (!token) { setShowLoginModal(true); return; }
    setLoadingOfferId(offer.id);
    try {
      if (await addItem(offer, quantity)) navigate('/cart');
      else addToast({ type: 'error', message: 'Unable to add this listing to your cart. Please try again.' });
    } finally { setLoadingOfferId(null); }
  };

  const collectCard = async () => {
    if (!token) { setShowLoginModal(true); return; }
    if (!card) return;
    setIsCollecting(true);
    try {
      if (catalogCard) await collectionApi.addCatalogCardToCollection(catalogCard);
      else await collectionApi.addToCollection(card);
      setShowCollectSuccessPopup(true); // CASE 7: show success popup
    } catch { addToast({ type: 'error', message: 'Failed to add card to collection.' }); }
    finally { setIsCollecting(false); }
  };

  if (isLoading) return <main className="mx-auto max-w-[1440px] px-6 py-10 md:px-12"><Skeleton className="mb-8 h-5 w-48" /><div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><Skeleton className="aspect-[421/533] w-full rounded-2xl" /><div className="space-y-5"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-40 w-full" /><Skeleton className="h-24 w-full" /></div></div></main>;
  if (error) return <main className="mx-auto max-w-3xl px-8 py-32 text-center"><h1 className="text-2xl font-bold">Unable to load card details</h1><p className="mt-3 text-gray-400">{error}</p><button onClick={() => void fetchCard()} className="mt-6 rounded-lg bg-brand-blue px-6 py-2.5 font-bold text-bg-base">Retry</button></main>;
  if (!card) return <main className="mx-auto max-w-3xl px-8 py-32 text-center"><h1 className="text-3xl font-bold">Card not found</h1><p className="mt-4 text-gray-400">The card you are looking for does not exist or has been removed.</p><Link to="/cards" className="mt-6 inline-flex rounded-lg bg-[#2B53A9] px-6 py-2.5 font-bold">Back to cards</Link></main>;

  // Card specification details
  const cardDetails = [
    {
      label: 'Card Number / Rarity:',
      value:
        card.cardNumber && card.rarity && !card.cardNumber.includes(card.rarity)
          ? `${card.cardNumber} / ${card.rarity}`
          : card.cardNumber || card.rarity || 'No. 3 / Promotional Trophy Card',
      isBold: false,
    },
    {
      label: 'Card Text:',
      value:
        card.cardText ||
        'ポケモンカードゲーム公式トーナメントの3位入賞者であることをここに認定し、その栄誉をたたえる。このカードを所持する者は、第1回ポケモンカードゲーム日本一決定戦への参加権があることを証明する。',
      isBold: true,
    },
    {
      label: 'Grading Company:',
      value: card.gradingCompany || 'PSA (Professional Sports Authenticator)',
      isBold: true,
    },
    {
      label: 'Grade:',
      value: card.grade || (card.condition ? formatCondition(card.condition) : 'NM-MT 8 (Near Mint-Mint 8)'),
      isBold: true,
    },
    {
      label: 'Year:',
      value: card.year ? String(card.year) : '1998',
      isBold: true,
    },
    {
      label: 'Card Set:',
      value: card.set || 'P.M. JAPANESE PROMO',
      isBold: true,
    },
    {
      label: 'Tournament:',
      value: card.tournament || 'Bronze 3rd-2nd Tournament',
      isBold: true,
    },
    {
      label: 'Certification Number:',
      value: card.certNumber || '79170302',
      isBold: true,
    },
  ];

  return (
    <main className="w-full bg-[#1B2336] text-white">
      <div className="mx-auto max-w-[1440px] px-6 py-8 pb-20 md:px-12">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm"><Link to="/cards" className="text-[#8FB3E2] hover:underline">Cards</Link><span aria-hidden="true" className="text-gray-500">/</span><span className="truncate">{card.name}</span></nav>
        <h1 className="mb-8 text-3xl font-bold md:text-[32px]">{card.name}</h1>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
          <div className="flex justify-center lg:col-span-5"><Card3DViewer imageSrc={card.image || '/assets/expensive_card_1.png'} cardName={card.name} /></div>
          <div className="flex flex-col gap-7 lg:col-span-7">
            <section aria-labelledby="card-details-heading">
              <h2 id="card-details-heading" className="mb-4 text-base font-bold text-[#A1A1A1]">Card details</h2>
              <div className="flex flex-col gap-2.5 text-sm">
                {cardDetails.map((detail, idx) => (
                  <div key={idx} className="flex flex-wrap items-baseline gap-2 leading-relaxed">
                    <span className="text-[#CFCFCF] font-normal whitespace-nowrap">
                      {detail.label}
                    </span>
                    <span className={`text-white ${detail.isBold ? 'font-bold' : 'font-semibold'}`}>
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <CardCollectPanel card={card} isLoading={isCollecting} onCollect={() => void collectCard()} />
          </div>
        </div>

        <SellerOffersSection offers={offers} loadingOfferId={loadingOfferId} onAddToCart={addOfferToCart} onReserveNow={reserveOfferNow} />
        <SimilarCardsSection card={card} />
      </div>
      <ContextualLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} message="Log in to collect or reserve cards" />
      {/* CASE 7: Collect success popup — Figma: Card Detail → Collect success */}
      <FeedbackPopup
        isOpen={showCollectSuccessPopup}
        tone="success"
        title="Added to your collection"
        message={`${card?.name ?? 'This card'} is now saved to My Collection.`}
        meta={[card?.set, card?.condition ? formatCondition(card.condition) : undefined].filter(Boolean).join(' · ') || undefined}
        primaryAction={{ label: "View collection", onClick: () => { setShowCollectSuccessPopup(false); void navigate('/collection'); } }}
        secondaryAction={{ label: "Keep browsing", onClick: () => setShowCollectSuccessPopup(false) }}
      />
    </main>
  );
}
