import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card3DViewer } from '@/features/discovery/components/Card3DViewer';
import { ShoppingCart, Minus, Plus, Bookmark, Store } from 'lucide-react';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { catalogApi, type CatalogCard } from '@/features/discovery/api/catalog';
import { collectionApi } from '@/features/collection';
import type { CardListing } from '@/entities/card/model/types';
import { formatCondition } from '@/entities/card/model/condition';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToastStore } from '@/shared/model/useToastStore';
import { ContextualLoginModal, useAuthStore } from '@/features/auth';
import { useReservationCartStore } from '@/features/reservation-cart';

function toCatalogListing(card: CatalogCard): CardListing {
  return {
    id: card.id,
    sellerId: '',
    name: card.name,
    game: 'Pokemon',
    image: card.imageLarge || card.imageSmall || '',
    price: Number(card.marketPrice ?? 0),
    cost: 0,
    stock: 0,
    status: 'SHOW',
    rarity: card.rarity,
    set: card.setName,
    cardNumber: card.cardNumber,
    subtitle: card.supertype,
    cardText: [card.hp, card.types].filter(Boolean).join(' · '),
    year: undefined,
    tournament: undefined,
  };
}

export function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<CardListing | null>(null);
  const [offers, setOffers] = useState<CardListing[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<CardListing | null>(null);
  const [catalogOnly, setCatalogOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const addToast = useToastStore(state => state.addToast);
  const addItem = useReservationCartStore(state => state.addItem);
  const token = useAuthStore(state => state.token);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setCatalogOnly(false);
    setOffers([]);
    setSelectedOffer(null);
    try {
      const isCatalogId = id.includes('-');
      let data: CardListing | undefined;

      try {
        data = await listingDiscoveryApi.getListingById(id);
      } catch (err) {
        if (!isCatalogId) throw err;
      }

      if (data) {
        setProduct(data);
        try {
          const result = await listingDiscoveryApi.getListings({
            cardId: data.cardId,
            search: data.cardId ? undefined : data.name,
            page: 0,
            size: 100,
            sortBy: 'price',
            sortDir: 'asc',
          });
          const matchingOffers = result.items.filter(candidate =>
            data.cardId ? candidate.cardId === data.cardId : candidate.name === data.name,
          );
          const availableOffers = matchingOffers.length > 0 ? matchingOffers : [data];
          setOffers(availableOffers);
          setSelectedOffer(availableOffers.find(candidate => candidate.id === data.id) ?? availableOffers[0]);
        } catch {
          setOffers([data]);
          setSelectedOffer(data);
        }
        return;
      }

      if (isCatalogId) {
        const catalogCard = await catalogApi.getCardById(id);
        if (catalogCard) {
          const catalogListing = toCatalogListing(catalogCard);
          setProduct(catalogListing);
          try {
            const result = await listingDiscoveryApi.getListings({
              cardId: catalogCard.id,
              page: 0,
              size: 100,
              sortBy: 'price',
              sortDir: 'asc',
            });
            setOffers(result.items);
            setSelectedOffer(result.items[0] ?? null);
            setCatalogOnly(result.items.length === 0);
          } catch {
            setCatalogOnly(true);
          }
          return;
        }
      }

      setProduct(null);
    } catch (err) {
      console.error('Failed to fetch product', err);
      setError('Unable to load card details from server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  const activeListing = selectedOffer ?? (catalogOnly ? null : product);

  const handleIncrement = () => {
    if (activeListing && quantity < activeListing.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToReservationCart = async () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!activeListing) return;
    const success = await addItem(activeListing, quantity);
    if (success) {
      addToast({ 
        message: `Added ${quantity} × ${activeListing.name} to your reservation cart.`,
        type: 'success' 
      });
    } else {
      addToast({
        message: 'Unable to add this listing to your cart. Please try again.',
        type: 'error',
      });
    }
  };

  const handleReserveNow = async () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!activeListing) return;
    const success = await addItem(activeListing, quantity);
    if (success) {
      navigate('/cart');
    } else {
      addToast({
        message: 'Unable to add this listing to your cart. Please try again.',
        type: 'error',
      });
    }
  };

  const handleSaveToCollection = async () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!product) return;
    try {
      await collectionApi.addToCollection(activeListing ?? product);
      addToast({
        type: 'success',
        message: `Saved "${product.name}" to your collection!`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to add card to collection.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 w-full">
        <div className="flex gap-2 mb-8">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-4" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Skeleton className="w-full aspect-[421/533] rounded-[15px]" />
          </div>
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-44 w-full max-w-[500px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-32 w-full text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-2">Unable to load card details</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => void fetchProduct()}
            className="bg-brand-blue text-bg-base px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-blue/90 transition-colors"
          >
            Retry
          </button>
          <Link 
            to="/cards"
            className="bg-[#242938] border border-[#40475C] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#2e3549] transition-colors"
          >
            Back to cards
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-32 w-full text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-4">Card listing not found</h2>
        <p className="text-gray-400 mb-8">The card you are looking for does not exist or has been removed.</p>
        <Link 
          to="/cards"
          className="bg-[#2B53A9] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#244691] transition-colors"
        >
          Back to cards
        </Link>
      </div>
    );
  }

  // Card specification details
  const cardDetails = [
    {
      label: 'Card Number / Rarity:',
      value: product.cardNumber || product.rarity || 'No. 3 / Promotional Trophy Card',
      isBold: false,
    },
    {
      label: 'Card Text:',
      value: product.cardText || 'ポケモンカードゲーム公式トーナメントの3位入賞者であることをここに認定し、その栄誉をたたえる。このカードを所持する者は、第1回ポケモンカードゲーム日本一決定戦への参加権があることを証明する。',
      isBold: true,
    },
    {
      label: 'Grading Company:',
      value: product.gradingCompany || 'PSA (Professional Sports Authenticator)',
      isBold: true,
    },
    {
      label: 'Grade:',
      value: product.grade || (product.condition ? formatCondition(product.condition) : 'NM-MT 8 (Near Mint-Mint 8)'),
      isBold: true,
    },
    {
      label: 'Year:',
      value: product.year || '1998',
      isBold: true,
    },
    {
      label: 'Card Set:',
      value: product.set || 'P.M. JAPANESE PROMO',
      isBold: true,
    },
    {
      label: 'Tournament:',
      value: product.tournament || 'Bronze 3rd-2nd Tournament',
      isBold: true,
    },
    {
      label: 'Certification Number:',
      value: product.certNumber || '79170302',
      isBold: true,
    },
  ];

  return (
    <div className="w-full bg-[#1B2336] min-h-[calc(100vh-64px)] text-white font-['IBM_Plex_Sans_Thai',sans-serif]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8 pb-24">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xl mb-4">
          <Link to="/cards" className="text-[#8FB3E2] hover:underline">
            TCG
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-white truncate">
            {product.name}
          </span>
        </nav>

        {/* Product Title */}
        <h1 className="text-3xl md:text-[32px] font-bold text-white mb-8">
          {product.name}
        </h1>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left Column: Interactive 3D Slab Card */}
          <div className="lg:col-span-5 flex justify-center">
            <Card3DViewer 
              imageSrc={product.image || '/assets/expensive_card_1.png'} 
              cardName={product.name} 
            />
          </div>

          {/* Right Column: Details & Purchase Panel */}
          <div className="lg:col-span-7 flex flex-col">
            
            {/* Product Details Header */}
            <h2 className="text-[#A1A1A1] text-base font-bold mb-4">
              Card details
            </h2>

            {/* Product Details Table / List */}
            <div className="flex flex-col gap-2.5 text-sm mb-8">
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

            {/* Reservation action box */}
            <div className="w-full max-w-[500px] bg-[#31487A] rounded-[5px] p-6 flex flex-col shadow-lg">
              
              {/* Condition / Grade */}
              <div className="text-[#C9C9C9] text-sm font-bold mb-1">
                {activeListing
                  ? (activeListing.condition ? formatCondition(activeListing.condition) : (activeListing.grade || 'Near Mint-Mint 8'))
                  : 'Catalog card'}
              </div>

              {/* Price */}
              {activeListing && (
                <div className="text-white text-[26px] font-bold leading-tight mb-1">
                  ฿{activeListing.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}

              {/* Stock info */}
              <div className="text-[#A6ADC7] text-xs font-['Inter',sans-serif] mb-4">
                {!activeListing ? 'Not currently listed for reservation' : activeListing.stock > 0 ? `${activeListing.stock} in stock` : 'Out of stock'}
              </div>

              {/* Stepper + Action Buttons */}
              {!activeListing ? (
                <p className="text-sm leading-relaxed text-[#DBE3F3]">
                  This card is shown from the public collection catalog. Browse Cards to find an active listing.
                </p>
              ) : (
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                
                {/* Quantity Selector */}
                <div className="flex items-center bg-[#D9E1F1] border border-[#31487A] rounded h-[40px] overflow-hidden select-none">
                  <button 
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || activeListing.stock <= 0}
                    className="w-10 h-full flex items-center justify-center text-[#8E8E8E] hover:text-[#31487A] disabled:opacity-40 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  
                  <div className="w-16 h-full flex items-center justify-center text-[#31487A] text-lg font-normal border-x border-[#31487A]/20">
                    {quantity}
                  </div>

                  <button 
                    type="button"
                    aria-label="Increase quantity"
                    onClick={handleIncrement}
                    disabled={quantity >= activeListing.stock || activeListing.stock <= 0}
                    className="w-10 h-full flex items-center justify-center text-[#31487A] hover:opacity-80 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to reservation cart */}
                <button
                  type="button"
                  onClick={() => void handleAddToReservationCart()}
                  disabled={activeListing.stock <= 0}
                  className="h-[40px] px-4 bg-[rgba(31,53,101,0.5)] hover:bg-[#1F3565] border border-[#6889D0] rounded-[5px] text-white text-[11px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={14} className="text-white" />
                  <span>Add to reservation cart</span>
                </button>

                {/* Reserve now */}
                <button
                  type="button"
                  onClick={() => void handleReserveNow()}
                  disabled={activeListing.stock <= 0}
                  className="h-[40px] px-5 bg-[#2B53A9] hover:bg-[#244691] rounded-[5px] text-white text-[11px] font-bold flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reserve now
                </button>

                {/* Save to Collection Button (US-10-2) */}
                <button
                  type="button"
                  onClick={handleSaveToCollection}
                  className="h-[40px] px-3.5 bg-bg-surface hover:bg-bg-elevated border border-white/20 rounded-[5px] text-gray-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                  title="Save to Personal Collection"
                >
                  <Bookmark size={13} className="text-brand-blue" />
                  <span>Collect</span>
                </button>
              </div>
              )}

            </div>

            <section className="mt-8 w-full" aria-labelledby="seller-offers-heading">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FB3E2]">Compare listings</p>
                  <h2 id="seller-offers-heading" className="mt-1 text-xl font-bold">Seller offers</h2>
                </div>
                <span className="text-sm text-gray-400">{offers.length} available</span>
              </div>

              {offers.length > 0 ? (
                <div className="space-y-3">
                  {offers.map(offer => {
                    const isSelected = activeListing?.id === offer.id;
                    return (
                      <div
                        key={offer.id}
                        className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                          isSelected ? 'border-[#6889D0] bg-[#31487A]/45' : 'border-white/10 bg-white/[.03]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Store size={15} className="shrink-0 text-[#8FB3E2]" />
                            <Link
                              to={`/stores/${offer.sellerId}`}
                              className="truncate font-semibold text-white hover:text-[#8FB3E2] hover:underline"
                            >
                              {offer.sellerName || `Seller ${offer.sellerId}`}
                            </Link>
                          </div>
                          <p className="mt-1 text-sm text-gray-400">
                            {[offer.condition ? formatCondition(offer.condition) : undefined, offer.language, `${offer.stock} in stock`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <span className="text-lg font-bold">
                            ฿{offer.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setQuantity(1);
                            }}
                            aria-pressed={isSelected}
                            className={`min-w-20 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                              isSelected ? 'bg-[#2B53A9] text-white' : 'bg-white/10 text-gray-200 hover:bg-white/15'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-400">
                  No seller has this card listed right now.
                </div>
              )}
            </section>

          </div>

        </div>

      </div>

      <ContextualLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Log in to reserve card listings"
      />
    </div>
  );
}
