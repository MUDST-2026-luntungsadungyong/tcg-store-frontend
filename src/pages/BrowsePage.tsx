import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { productsApi } from '@/api/products';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useFilterStore } from '@/store/useFilterStore';

const GAMES = ['Pokemon', 'YGO', 'MTG', 'One Piece'];
const CONDITIONS = ['Gem Mint', 'Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];

export function BrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const { 
    searchQuery, setSearchQuery,
    game, toggleGame,
    condition, toggleCondition,
    priceRange, setPriceRange,
    qcOnly, toggleQcOnly,
    resetFilters
  } = useFilterStore();

  const [localMin, setLocalMin] = useState(priceRange[0].toString());
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
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (game.length > 0 && !game.includes(p.game)) return false;
      if (condition.length > 0 && (!p.condition || !condition.includes(p.condition))) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (qcOnly && !(p.status === 'SHOW' && p.stock > 0)) return false;
      return true;
    });
  }, [products, searchQuery, game, condition, priceRange, qcOnly]);

  return (
    <div className="py-8 flex flex-col md:flex-row gap-8">
      
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex gap-4">
        <Input 
          icon={Search} 
          placeholder="Search cards..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="secondary" onClick={() => setShowMobileFilters(!showMobileFilters)}>
          <Filter size={20} />
        </Button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-64 flex-shrink-0 flex flex-col gap-8 ${showMobileFilters ? 'block' : 'hidden md:flex'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-brand-blue" /> Filters
          </h2>
          <button onClick={resetFilters} className="text-sm text-gray-400 hover:text-white">
            Reset
          </button>
        </div>

        {/* Game Filter */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Game</h3>
          <div className="flex flex-col gap-2">
            {GAMES.map(g => (
              <label key={g} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="hidden" checked={game.includes(g)} onChange={() => toggleGame(g)} />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${game.includes(g) ? 'bg-brand-blue border-brand-blue' : 'border-gray-600 group-hover:border-brand-blue'}`}>
                  {game.includes(g) && <div className="w-2.5 h-2.5 bg-bg-base rounded-sm" />}
                </div>
                <span className={`text-sm ${game.includes(g) ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{g === 'YGO' ? 'Yu-Gi-Oh!' : g}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Condition Filter */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Condition</h3>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {CONDITIONS.map(c => (
              <label key={c} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="hidden" checked={condition.includes(c)} onChange={() => toggleCondition(c)} />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${condition.includes(c) ? 'bg-brand-blue border-brand-blue' : 'border-gray-600 group-hover:border-brand-blue'}`}>
                  {condition.includes(c) && <div className="w-2.5 h-2.5 bg-bg-base rounded-sm" />}
                </div>
                <span className={`text-sm ${condition.includes(c) ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Price (THB)</h3>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              value={localMin}
              onChange={e => setLocalMin(e.target.value)}
              className="w-full bg-bg-input border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue"
            />
            <span className="text-gray-500">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={localMax}
              onChange={e => setLocalMax(e.target.value)}
              className="w-full bg-bg-input border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue"
            />
          </div>
          <Button variant="secondary" size="sm" className="w-full mt-3" onClick={handlePriceApply}>
            Apply Price
          </Button>
        </div>

        {/* QC Only Filter */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl bg-brand-blue/5 border border-brand-blue/20 hover:bg-brand-blue/10 transition-colors">
            <input type="checkbox" className="hidden" checked={qcOnly} onChange={toggleQcOnly} />
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${qcOnly ? 'bg-brand-blue border-brand-blue' : 'border-brand-blue/50 group-hover:border-brand-blue'}`}>
              {qcOnly && <div className="w-2.5 h-2.5 bg-bg-base rounded-sm" />}
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${qcOnly ? 'text-brand-blue' : 'text-white'}`}>QC Protected Only</span>
              <span className="text-xs text-gray-400">Cards verified by Hub</span>
            </div>
          </label>
        </div>

      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top Bar */}
        <div className="hidden md:flex items-center gap-4">
          <Input 
            icon={Search} 
            placeholder="Search by card name, set, or character..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-bg-surface"
          />
          <div className="text-sm text-gray-400 whitespace-nowrap">
            {filteredProducts.length} Results
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center glass-card bg-bg-surface/30 border border-white/5 rounded-3xl">
            <Search className="w-16 h-16 text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No cards found</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We couldn't find any cards matching your current filters. Try adjusting your search criteria or resetting filters.
            </p>
            <Button variant="primary" onClick={resetFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
