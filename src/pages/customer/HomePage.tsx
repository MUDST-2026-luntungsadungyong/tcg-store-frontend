import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { productsApi } from '@/api/products';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/common/Skeleton';

// Horizontal card for "The Pokémon Cards Collection"
function HorizontalProductCard({ product }: { product: Product }) {
  return (
    <Link 
      to={`/products/${product.id}`}
      className="flex bg-white rounded-[16px] overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 group h-[120px]"
    >
      <div className="w-[100px] h-full bg-[#F8F9FA] p-3 flex items-center justify-center shrink-0">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col justify-center flex-1">
        <h3 className="text-[12px] font-semibold text-[#374151] line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        <div className="text-[10px] text-gray-500 mb-2">Graded PSA 10</div>
        <div className="text-[18px] font-bold text-[#111827] mb-1">
          ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center">
          <span className="text-[10px] font-bold text-[#16A34A]">
            + $5.00 (+2.50%)
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const data = await productsApi.getProducts();
        setTrending(data);
      } catch (error) {
        console.error('Failed to fetch trending products', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col pb-20 w-full overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="w-full relative bg-[#151B2B]">
        <img 
          src="/assets/component_232_864.png" 
          alt="Mythic Market Hero" 
          className="w-full h-auto object-cover"
        />
      </section>

      <div className="max-w-[1440px] mx-auto px-8 w-full">
        {/* 2. The 10 Most Expensive Pokémon Cards of 2025 */}
        <section className="py-20 flex flex-col md:flex-row items-center gap-12 border-b border-white/5">
          <div className="flex-1 flex justify-end">
            <img 
              src="/assets/component_293_629.png" 
              alt="Expensive Card" 
              className="w-full max-w-[400px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-[40px] md:text-[56px] font-bold text-[#EAB308] leading-tight max-w-[500px]">
              The 10 Most Expensive Pokémon Cards of 2025
            </h2>
          </div>
        </section>

        {/* 3. What's new! */}
        <section className="py-16">
          <h2 className="text-[28px] font-bold text-white mb-8">What's new!</h2>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
            {/* Banner 1 */}
            <div className="min-w-[600px] h-[280px] bg-white rounded-3xl overflow-hidden flex snap-center shrink-0">
              <div className="flex-1 p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-black mb-4 leading-tight">Pokémon TCG: 30th Celebration</h3>
                <p className="text-gray-600 text-sm mb-8">Mew adorable celebrates the many sides of the Mouse Pokémon.</p>
                <div>
                  <button className="bg-[#FF8A8A] hover:bg-[#FF7575] text-white font-bold py-2 px-8 rounded-full transition-colors text-sm">
                    More
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=400&auto=format&fit=crop" alt="Pokemon" className="w-[120%] h-auto object-cover transform rotate-12 scale-110 opacity-90 mix-blend-multiply" />
              </div>
            </div>
            
            {/* Banner 2 (Placeholder) */}
            <div className="min-w-[600px] h-[280px] bg-white rounded-3xl overflow-hidden flex snap-center shrink-0">
              <div className="flex-1 p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-black mb-4 leading-tight">New Arrivals: One Piece OP-06</h3>
                <p className="text-gray-600 text-sm mb-8">Discover the latest cards from the newest expansion.</p>
                <div>
                  <button className="bg-[#FF8A8A] hover:bg-[#FF7575] text-white font-bold py-2 px-8 rounded-full transition-colors text-sm">
                    More
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=400&auto=format&fit=crop" alt="One Piece" className="w-[120%] h-auto object-cover transform rotate-12 scale-110 opacity-90 mix-blend-multiply" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. The 10 Most Expensive Cards */}
        <section className="py-12">
          <h2 className="text-[28px] font-bold text-white mb-8">The 10 Most Expensive Cards</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-[20px] flex flex-col gap-4">
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : (
              trending.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>

        {/* 5. The Pokémon Cards Collection */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[28px] font-bold text-white">The Pokémon Cards Collection</h2>
            <Link to="/browse" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
              Reset filters <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-[16px] flex gap-4 h-[120px]">
                  <Skeleton className="w-[100px] h-full rounded-lg" />
                  <div className="flex flex-col justify-center flex-1 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              trending.slice(0, 8).map((product) => (
                <HorizontalProductCard key={`horiz-${product.id}`} product={product} />
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
