import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import type { CardListing } from '@/entities/card/model/types';
import { CardListingCard } from '@/features/discovery/components/CardListingCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { useFilterStore } from '@/features/discovery/model/useFilterStore';
import { FilterDropdown } from '@/shared/components/FilterDropdown';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Holo', 'Rare Holo', 'Ultra Rare', 'Secret Rare'];
const STAGES = ['Basic', 'Stage 1', 'Stage 2', 'V', 'VMAX', 'VSTAR'];
const CONDITIONS = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];

export function CardDiscoveryPage() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [products, setProducts] = useState<CardListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Local filter controls
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [condition, setCondition] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const { 
    rarity, toggleRarity,
    stage, toggleStage,
    priceRange, setPriceRange,
    resetFilters
  } = useFilterStore();

  const [localMin, setLocalMin] = useState(priceRange[0] === 0 ? '' : priceRange[0].toString());
  const [localMax, setLocalMax] = useState(priceRange[1] === 9999999 ? '' : priceRange[1].toString());
  const [priceError, setPriceError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const minP = priceRange[0] > 0 ? priceRange[0] : undefined;
      const maxP = priceRange[1] < 9999999 ? priceRange[1] : undefined;
      const data = await listingDiscoveryApi.getListings({
        search: searchInput.trim() || undefined,
        rarity: rarity.length === 1 ? rarity[0] : undefined,
        stage: stage.length === 1 ? stage[0] : undefined,
        condition: condition.length === 1 ? condition[0] : undefined,
        minPrice: minP,
        maxPrice: maxP,
        page,
        size: pageSize,
      });
      setProducts(data.items);
      setTotalPages(Math.max(1, data.totalPages));
      setTotalElements(data.totalElements);
    } catch (err: unknown) {
      console.error('Failed to fetch products', err);
      setError('Unable to load cards from the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, rarity, stage, condition, priceRange, page]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Accept searches submitted from the global Navbar when arriving on /cards.
  useEffect(() => {
    setSearchInput(urlSearch);
    setPage(0);
  }, [urlSearch]);

  // Handle price input changes with validation
  const handleMinChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setLocalMin(clean);
    validatePriceRange(clean, localMax);
  };

  const handleMaxChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setLocalMax(clean);
    validatePriceRange(localMin, clean);
  };

  const validatePriceRange = (minVal: string, maxVal: string): boolean => {
    if (minVal !== '' && maxVal !== '') {
      const minNum = parseInt(minVal, 10);
      const maxNum = parseInt(maxVal, 10);
      if (minNum > maxNum) {
        setPriceError('Min price cannot be greater than Max price');
        return false;
      }
    }
    setPriceError(null);
    return true;
  };

  const handlePriceApply = () => {
    const isValid = validatePriceRange(localMin, localMax);
    if (!isValid) return;

    const min = localMin ? parseInt(localMin, 10) : 0;
    const max = localMax ? parseInt(localMax, 10) : 9999999;
    setPriceRange(min, max);
    setPage(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const handleReset = () => {
    resetFilters();
    setSearchInput('');
    setCondition([]);
    setInStockOnly(false);
    setLocalMin('');
    setLocalMax('');
    setPriceError(null);
    setPage(0);
  };

  const toggleConditionOption = (cond: string) => {
    setCondition(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
    setPage(0);
  };

  // Client-side additional filtering for multi-select values or in-stock toggle
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Must be SHOW
      if (p.status !== 'SHOW') return false;

      // In-stock toggle
      if (inStockOnly && p.stock <= 0) return false;

      // Search match
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }

      // Multi-select rarity match if more than 1 selected
      if (rarity.length > 0 && (!p.rarity || !rarity.includes(p.rarity))) {
        return false;
      }

      // Multi-select stage match
      if (stage.length > 0 && (!p.stage || !stage.some(s => p.stage?.toLowerCase().includes(s.toLowerCase())))) {
        return false;
      }

      // Multi-select condition match
      if (condition.length > 0 && (!p.condition || !condition.includes(p.condition))) {
        return false;
      }

      // Price range
      if (p.price < priceRange[0] || p.price > priceRange[1]) {
        return false;
      }

      return true;
    });
  }, [products, inStockOnly, searchInput, rarity, stage, condition, priceRange]);

  const activeFiltersCount = 
    (searchInput.trim() ? 1 : 0) +
    rarity.length + 
    stage.length + 
    condition.length + 
    (inStockOnly ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 9999999 ? 1 : 0);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Title */}
      <div className="mt-14 mb-8 text-center w-full max-w-[1440px] px-8">
        <h1 className="text-4xl md:text-[48px] font-bold text-[#DBE3F3] tracking-tight text-left md:text-center">
          The Pokémon Cards Collection
        </h1>
        <p className="text-sm md:text-base text-[#A6ADC7] mt-2 text-left md:text-center">
          Explore authentic Pokémon cards available for direct reservation
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="w-full max-w-[1440px] px-8 mb-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[600px] mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6ADC7] w-5 h-5 pointer-events-none" />
          <input
            type="text"
            data-testid="search-input"
            placeholder="Search cards by name..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            className="w-full bg-[#242938] border border-[#40475C] focus:border-brand-blue rounded-xl pl-12 pr-10 py-3 text-sm text-white placeholder:text-[#A6ADC7] focus:outline-none transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setPage(0);
              }}
              aria-label="Clear search input"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A6ADC7] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Filter Bar */}
      <div className="w-full max-w-[1440px] px-8 mb-4 flex flex-wrap justify-start md:justify-center items-center gap-3">
        <FilterDropdown 
          label="Rarity" 
          options={RARITIES} 
          selectedValues={rarity} 
          onToggle={toggleRarity} 
        />

        <FilterDropdown 
          label="Stage" 
          options={STAGES} 
          selectedValues={stage} 
          onToggle={toggleStage} 
        />

        <FilterDropdown 
          label="Condition" 
          options={CONDITIONS} 
          selectedValues={condition} 
          onToggle={toggleConditionOption} 
        />
        
        {/* Price Min/Max Input with validation error styling */}
        <div className="flex flex-col">
          <div className={`flex items-center gap-2 bg-[#242938] border rounded-lg px-3 py-1.5 h-[42px] transition-colors ${
            priceError ? 'border-[#EF4444]' : 'border-[#40475C]'
          }`}>
            <input 
              type="text"
              inputMode="numeric"
              data-testid="min-price-input"
              placeholder="Min THB" 
              value={localMin}
              onChange={e => handleMinChange(e.target.value)}
              className="w-20 md:w-24 bg-transparent text-sm text-white focus:outline-none placeholder:text-[#A6ADC7]"
            />
            <span className="text-[#A6ADC7] text-sm font-medium">–</span>
            <input 
              type="text"
              inputMode="numeric"
              data-testid="max-price-input"
              placeholder="Max THB" 
              value={localMax}
              onChange={e => handleMaxChange(e.target.value)}
              className="w-20 md:w-24 bg-transparent text-sm text-white focus:outline-none placeholder:text-[#A6ADC7]"
            />
          </div>
          {priceError && (
            <p role="alert" data-testid="price-error-msg" className="text-[#EF4444] text-xs font-medium mt-1 pl-1">
              {priceError}
            </p>
          )}
        </div>

        <button 
          onClick={handlePriceApply}
          disabled={Boolean(priceError)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors h-[42px] ${
            priceError 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-[#D9DEF2] text-[#1A1A26] hover:bg-white cursor-pointer'
          }`}
        >
          Apply Filters
        </button>

        {/* In-Stock Only Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-[#242938] border border-[#40475C] px-3.5 rounded-lg h-[42px] text-sm text-[#EDF0F7] hover:border-brand-blue/50 transition-colors">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)}
            className="rounded border-[#40475C] text-brand-blue focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>In Stock Only</span>
        </label>

        {activeFiltersCount > 0 && (
          <button 
            onClick={handleReset}
            className="text-[#A6ADC7] text-sm px-3 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      <div className="w-full max-w-[1440px] px-8 mb-6 flex flex-wrap justify-start md:justify-center items-center gap-2">
        <span className="text-sm text-[#A6ADC7] mr-2">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
        </span>
        
        {searchInput.trim() && (
          <div className="flex items-center gap-1.5 bg-[#2E364D] rounded-full px-3 py-1">
            <span className="text-xs text-[#EDF0F7]">Search: "{searchInput.trim()}"</span>
            <button onClick={() => setSearchInput('')} aria-label="Remove search filter" className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        )}

        {rarity.map(r => (
          <div key={`r-${r}`} className="flex items-center gap-1.5 bg-[#2E364D] rounded-full px-3 py-1">
            <span className="text-xs text-[#EDF0F7]">Rarity: {r}</span>
            <button onClick={() => toggleRarity(r)} aria-label={`Remove ${r} rarity filter`} className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        ))}

        {stage.map(s => (
          <div key={`s-${s}`} className="flex items-center gap-1.5 bg-[#2E364D] rounded-full px-3 py-1">
            <span className="text-xs text-[#EDF0F7]">Stage: {s}</span>
            <button onClick={() => toggleStage(s)} aria-label={`Remove ${s} stage filter`} className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        ))}

        {condition.map(c => (
          <div key={`c-${c}`} className="flex items-center gap-1.5 bg-[#2E364D] rounded-full px-3 py-1">
            <span className="text-xs text-[#EDF0F7]">Condition: {c}</span>
            <button onClick={() => toggleConditionOption(c)} aria-label={`Remove ${c} condition filter`} className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        ))}

        {inStockOnly && (
          <div className="flex items-center gap-1.5 bg-[#2E364D] rounded-full px-3 py-1">
            <span className="text-xs text-[#EDF0F7]">In Stock Only</span>
            <button onClick={() => setInStockOnly(false)} aria-label="Remove in stock filter" className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        )}

        {(priceRange[0] > 0 || priceRange[1] < 9999999) && (
          <div className="flex items-center gap-1.5 bg-[#2E364D] rounded-full px-3 py-1">
            <span className="text-xs text-[#EDF0F7]">
              Price: ฿{priceRange[0]}–{priceRange[1] === 9999999 ? 'Max' : `฿${priceRange[1]}`}
            </span>
            <button onClick={() => {
              setPriceRange(0, 9999999);
              setLocalMin('');
              setLocalMax('');
              setPriceError(null);
            }} aria-label="Remove price filter" className="text-[#A6ADC7] hover:text-white"><X size={12} /></button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1440px] px-8 pb-20">
        {/* Loading State */}
        {isLoading ? (
          <div data-testid="loading-state" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full flex flex-col gap-3 p-4 bg-[#1e2538] rounded-2xl">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div data-testid="error-state" className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444] mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Cards</h3>
            <p className="text-sm text-[#A6ADC7] mb-6">{error}</p>
            <button
              onClick={() => void fetchProducts()}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-bg-base font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          /* Product Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {filteredProducts.map(product => (
                <CardListingCard key={product.id} listing={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#242938] border border-[#40475C] text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-brand-blue transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="text-sm text-[#A6ADC7]">
                  Page <span className="font-semibold text-white">{page + 1}</span> of{' '}
                  <span className="font-semibold text-white">{totalPages}</span>
                  {totalElements > 0 && ` (${totalElements} total)`}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#242938] border border-[#40475C] text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-brand-blue transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div data-testid="empty-state" className="flex flex-col items-center justify-center py-28 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#242938] flex items-center justify-center text-[#A6ADC7] mb-4">
              <Search size={30} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No cards found</h3>
            <p className="text-sm text-[#A6ADC7] mb-6">
              We couldn't find any cards matching your current search or filters. Try adjusting your criteria or clearing filters.
            </p>
            <button
              onClick={handleReset}
              className="bg-[#2E364D] hover:bg-[#3B4563] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
