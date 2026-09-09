import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card3DViewer } from '@/features/discovery/components/Card3DViewer';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import type { CardListing } from '@/entities/card/model/types';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToastStore } from '@/shared/model/useToastStore';
import { ContextualLoginModal, useAuthStore } from '@/features/auth';
import { useReservationCartStore } from '@/features/reservation-cart';

export function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<CardListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const addToast = useToastStore(state => state.addToast);
  const addItem = useReservationCartStore(state => state.addItem);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const data = await listingDiscoveryApi.getListingById(id);
        setProduct(data || null);
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleIncrement = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToReservationCart = () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!product) return;
    const success = addItem(product, quantity);
    if (success) {
      addToast({ 
        message: `Added ${quantity} × ${product.name} to your reservation cart.`, 
        type: 'success' 
      });
    }
  };

  const handleReserveNow = () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!product) return;
    addItem(product, quantity);
    navigate('/cart');
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
      value: product.grade || product.condition || 'NM-MT 8 (Near Mint-Mint 8)',
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
                {product.condition || product.grade || 'Near Mint-Mint 8'}
              </div>

              {/* Price */}
              <div className="text-white text-[26px] font-bold leading-tight mb-1">
                ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* Stock info */}
              <div className="text-[#A6ADC7] text-xs font-['Inter',sans-serif] mb-4">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>

              {/* Stepper + Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                
                {/* Quantity Selector */}
                <div className="flex items-center bg-[#D9E1F1] border border-[#31487A] rounded h-[40px] overflow-hidden select-none">
                  <button 
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || product.stock <= 0}
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
                    disabled={quantity >= product.stock || product.stock <= 0}
                    className="w-10 h-full flex items-center justify-center text-[#31487A] hover:opacity-80 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to reservation cart */}
                <button
                  type="button"
                  onClick={handleAddToReservationCart}
                  disabled={product.stock <= 0}
                  className="h-[40px] px-4 bg-[rgba(31,53,101,0.5)] hover:bg-[#1F3565] border border-[#6889D0] rounded-[5px] text-white text-[11px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={14} className="text-white" />
                  <span>Add to reservation cart</span>
                </button>

                {/* Reserve now */}
                <button
                  type="button"
                  onClick={handleReserveNow}
                  disabled={product.stock <= 0}
                  className="h-[40px] px-5 bg-[#2B53A9] hover:bg-[#244691] rounded-[5px] text-white text-[11px] font-bold flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reserve now
                </button>
              </div>

            </div>

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
