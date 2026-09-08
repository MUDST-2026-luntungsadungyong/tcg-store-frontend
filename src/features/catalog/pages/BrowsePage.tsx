import { useEffect, useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { productsApi } from '@/features/catalog/api/products';
import type { Product } from '@/shared/types';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { useFilterStore } from '@/features/catalog/model/useFilterStore';
import { FilterDropdown } from '@/shared/components/FilterDropdown';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Holo', 'Ultra Rare', 'Secret Rare'];
const STAGES = ['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR'];

export function BrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    rarity, toggleRarity,
    stage, toggleStage,
    priceRange, setPriceRange,
    resetFilters
  } = useFilterStore();

  const [localMin, setLocalMin] = useState(priceRange[0] === 0 ? '' : priceRange[0].toString());
  const [localMax, setLocalMax] = useState(priceRange[1] === 9999999 ? '' : priceRange[1].toString());

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await productsApi.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handlePriceApply = () => {
    const min = parseInt(localMin) || 0;
    const max = parseInt(localMax) || 9999999;
    setPriceRange(min, max);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (rarity.length > 0 && (!p.rarity || !rarity.includes(p.rarity))) return false;
      if (stage.length > 0 && (!p.stage || !stage.includes(p.stage))) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });
  }, [products, rarity, stage, priceRange]);

  const activeFiltersCount = rarity.length + stage.length + (priceRange[0] > 0 || priceRange[1] < 9999999 ? 1 : 0);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Title */}
      <div className="mt-16 mb-12 text-center w-full max-w-[1440px] px-8">
        <h1 className="text-4xl md:text-[48px] font-bold text-[#DBE3F3] tracking-tight text-left md:text-center">
          The Pokémon Cards Collection
        </h1>
      </div>

      {/* Filter Bar */}
      <div className="w-full max-w-[1440px] px-8 mb-6 flex flex-wrap justify-start md:justify-center items-center gap-4">
        <FilterDropdown 
          label="Rarity" 
          options={RARITIES} 
          selectedValues={rarity} 
          onToggle={toggleRarity} 
        />
        
        {/* Price Min/Max */}
        <div className="flex items-center gap-2 bg-[#242938] border border-[#40475C] rounded-lg px-3 py-1.5 h-[42px]">
          <input 
            type="text"
            inputMode="numeric"
            placeholder="Min THB" 
            value={localMin}
            onChange={e => setLocalMin(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-24 md:w-28 bg-transparent text-sm text-white focus:outline-none placeholder:text-[#A6ADC7]"
          />
          <span className="text-[#A6ADC7] text-sm font-medium">–</span>
          <input 
            type="text"
            inputMode="numeric"
            placeholder="Max THB" 
            value={localMax}
            onChange={e => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-24 md:w-28 bg-transparent text-sm text-white focus:outline-none placeholder:text-[#A6ADC7]"
          />
        </div>

        <FilterDropdown 
          label="Stage" 
          options={STAGES} 
          selectedValues={stage} 
          onToggle={toggleStage} 
        />

        <button 
          onClick={handlePriceApply}
          className="bg-[#D9DEF2] text-[#1A1A26] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors h-[42px]"
        >
          Apply Filters
        </button>

        {activeFiltersCount > 0 && (
          <button 
            onClick={() => {
              resetFilters();
              setLocalMin('');
              setLocalMax('');
            }}
            className="text-[#A6ADC7] text-sm px-3 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Row */}
      <div className="w-full max-w-[1440px] px-8 mb-8 flex flex-wrap justify-start md:justify-center items-center gap-3">
        <span className="text-sm text-[#A6ADC7] mr-2">
          {filteredProducts.length} results
        </span>
        
        {rarity.map(r => (
          <div key={`r-${r}`} className="flex items-center gap-2 bg-[#2E364D] rounded-full px-3 py-1.5">
            <span className="text-xs text-[#EDF0F7]">Rarity: {r}</span>
            <button onClick={() => toggleRarity(r)} className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        ))}

        {stage.map(s => (
          <div key={`s-${s}`} className="flex items-center gap-2 bg-[#2E364D] rounded-full px-3 py-1.5">
            <span className="text-xs text-[#EDF0F7]">Stage: {s}</span>
            <button onClick={() => toggleStage(s)} className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        ))}

        {(priceRange[0] > 0 || priceRange[1] < 9999999) && (
          <div className="flex items-center gap-2 bg-[#2E364D] rounded-full px-3 py-1.5">
            <span className="text-xs text-[#EDF0F7]">
              Price: ฿{priceRange[0]}–{priceRange[1] === 9999999 ? 'Max' : `฿${priceRange[1]}`}
            </span>
            <button onClick={() => {
              setPriceRange(0, 9999999);
              setLocalMin('');
              setLocalMax('');
            }} className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        )}

        {activeFiltersCount > 0 && (
          <button 
            onClick={() => {
              resetFilters();
              setLocalMin('');
              setLocalMax('');
            }}
            className="text-xs text-[#A6ADC7] hover:text-white ml-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="w-full max-w-[1440px] px-8 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 justify-items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 justify-items-center">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Search className="w-16 h-16 text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No cards found</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We couldn't find any cards matching your current filters. Try adjusting your search criteria or resetting filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
