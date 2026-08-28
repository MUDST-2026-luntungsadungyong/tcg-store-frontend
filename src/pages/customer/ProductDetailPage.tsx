import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, ChevronRight, Store, Star } from 'lucide-react';
import { productsApi } from '@/api/products';
import type { Product } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { useToastStore } from '@/components/common/Toast';
import { ContextualLoginModal } from '@/components/common/ContextualLoginModal';
import { useAuthStore } from '@/store/useAuthStore';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const addToast = useToastStore(state => state.addToast);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const data = await productsApi.getProductById(id);
        setProduct(data || null);
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    // We will connect this to a real Cart Store in Module 4.
    addToast({ message: 'Item added to cart', type: 'success' });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-8 w-full">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-32 w-full text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-4">Product Not Found</h2>
        <p className="text-gray-400 mb-8">The card you are looking for does not exist or has been removed.</p>
        <Link to="/browse">
          <Button variant="primary">Back to Browse</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8 pb-20 w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/browse" className="hover:text-white transition-colors">Cards</Link>
        <ChevronRight size={14} />
        <span className="text-brand-blue truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Image */}
        <div className="md:col-span-5 lg:col-span-5">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glass-card border border-white/10 p-2 bg-bg-surface/50 shadow-2xl">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col">
          
          <div className="mb-6">
            <div className="text-brand-gold font-bold tracking-widest uppercase text-sm mb-2">
              {product.game}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {product.condition && (
                <Badge variant="default" className="text-sm px-3 py-1">
                  {product.condition}
                </Badge>
              )}
              {product.set && (
                <span className="text-gray-400 text-sm">
                  Set: <span className="text-gray-200">{product.set}</span>
                </span>
              )}
              {product.rarity && (
                <span className="text-gray-400 text-sm">
                  Rarity: <span className="text-gray-200">{product.rarity}</span>
                </span>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-1">Price</div>
            <div className="text-4xl font-bold text-white flex items-baseline gap-2">
              {formatPrice(product.price)}
              <span className="text-base font-normal text-gray-400">THB</span>
            </div>
          </div>

          {/* QC Protection Callout */}
          {product.status === 'SHOW' && product.stock > 0 && (
            <div className="glass-card bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-5 mb-8 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0 mt-1">
                <ShieldCheck className="text-brand-blue w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Eligible for QC Protection</h4>
                <p className="text-sm text-gray-400">
                  This item can be shipped to our Hub Facility for expert verification before final delivery to you. 
                  Select this option during checkout for complete peace of mind.
                </p>
              </div>
            </div>
          )}

          {/* Seller Profile Card */}
          <div className="glass-card bg-bg-surface/80 border border-white/5 rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-bg-base border border-white/10 flex items-center justify-center">
                <Store className="text-gray-400 w-6 h-6" />
              </div>
              <div>
                <div className="text-white font-bold">Mythix Official Store</div>
                <div className="flex items-center gap-1 text-sm text-brand-gold mt-0.5">
                  <Star className="fill-current w-3.5 h-3.5" />
                  <Star className="fill-current w-3.5 h-3.5" />
                  <Star className="fill-current w-3.5 h-3.5" />
                  <Star className="fill-current w-3.5 h-3.5" />
                  <Star className="fill-current w-3.5 h-3.5" />
                  <span className="text-gray-400 ml-1">(128 reviews)</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:flex">View Store</Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-auto border-t border-white/10 pt-8">
            <Button 
              variant="secondary" 
              size="lg" 
              className="flex-1 text-lg h-14"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2" size={20} /> Add to Cart
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              className="flex-1 text-lg h-14 shadow-glow-blue"
              disabled={product.stock <= 0}
            >
              Buy It Now
            </Button>
          </div>
          
          {product.stock <= 0 && (
            <div className="text-center text-status-danger text-sm mt-4 font-semibold">
              Currently Out of Stock
            </div>
          )}

        </div>
      </div>

      <ContextualLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Log in to add items to your cart"
      />
    </div>
  );
}
