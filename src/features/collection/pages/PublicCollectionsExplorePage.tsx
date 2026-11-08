import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Library,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { collectionApi, type PublicCollectionSummary } from '../api/collection';
import { PublicCollectionSummaryCard } from '../components/PublicCollectionSummaryCard';
import { PageHeader } from '@/shared/components/PageLayout';
import { SearchField } from '@/shared/components/SearchField';
import { Skeleton } from '@/shared/components/Skeleton';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

const PAGE_SIZE = 9;

export function PublicCollectionsExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const [collections, setCollections] = useState<PublicCollectionSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [appliedSearch, setAppliedSearch] = useState(urlSearch);
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');
  const [selectedSort, setSelectedSort] = useState<'RARE_DESC' | 'TOTAL_DESC' | 'NAME_ASC'>('RARE_DESC');

  const currentUser = useAuthStore((s) => s.user);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await collectionApi.getPublicCollections({
        search: appliedSearch,
        role: selectedRole,
        sort: selectedSort,
        page,
        size: PAGE_SIZE,
      });

      setCollections(response.items);
      setTotalElements(response.page.totalElements);
      setTotalPages(Math.max(1, response.page.totalPages));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load public collections.');
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, selectedRole, selectedSort, page]);

  useEffect(() => {
    void fetchCollections();
  }, [fetchCollections]);

  // Sync search query from URL parameter
  useEffect(() => {
    setSearchInput(urlSearch);
    setAppliedSearch(urlSearch);
    setPage(0);
  }, [urlSearch]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = searchInput.trim();
    setAppliedSearch(clean);
    setPage(0);
    const nextParams = new URLSearchParams(searchParams);
    if (clean) nextParams.set('search', clean);
    else nextParams.delete('search');
    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(0);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setSelectedRole('ALL');
    setSelectedSort('RARE_DESC');
    setPage(0);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams);
  };

  // Quick stats computed across loaded collections
  const totalRareCardsLoaded = useMemo(() => {
    return collections.reduce((acc, curr) => acc + (curr.rareCardCount || 0), 0);
  }, [collections]);

  return (
    <div className="w-full flex flex-col items-center min-h-[calc(100vh-64px)] bg-bg-base text-white font-['IBM_Plex_Sans_Thai',sans-serif] pb-16">
      
      {/* Title & Page Header */}
      <div className="mt-8 mb-6 text-left w-full max-w-[1440px] px-4 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Collector Showcases"
            description="Explore authentic public card collections from trainers and collectors across the community"
          />

          {/* Quick CTA to My Collection */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {currentUser && (
              <Link
                to="/collection"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20"
              >
                <Library size={16} />
                My Collection
              </Link>
            )}
            <button
              type="button"
              onClick={() => void fetchCollections()}
              disabled={isLoading}
              title="Refresh Collections"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-surface px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-bg-elevated hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Community Stats Bar */}
      <div className="w-full max-w-[1440px] px-4 md:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-bg-surface p-4">
          <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-blue">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Public Collectors</p>
              <p className="text-base font-bold text-white">{totalElements}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Rare Cards in Page</p>
              <p className="text-base font-bold text-brand-gold">{totalRareCardsLoaded.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 ml-auto">
            <span className="size-2 rounded-full bg-status-success animate-pulse" />
            <span>Real-time Community Showcases</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls Bar */}
      <div className="w-full max-w-[1440px] px-4 md:px-8 mb-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Search Field */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <SearchField
              data-testid="collections-search-input"
              aria-label="Search collectors or cards"
              placeholder="Search by collector name or card in collection..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-10"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400 hidden sm:block" />
              <label htmlFor="role-filter" className="sr-only">Filter by Role</label>
              <select
                id="role-filter"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as 'ALL' | 'SELLER' | 'BUYER');
                  setPage(0);
                }}
                className="rounded-xl border border-white/10 bg-bg-card px-3 py-2 text-xs font-semibold text-gray-300 focus:border-brand-blue focus:outline-none"
              >
                <option value="ALL">All Collectors</option>
                <option value="SELLER">Verified Sellers</option>
                <option value="BUYER">Card Trainers / Buyers</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-filter" className="sr-only">Sort Collections</label>
              <select
                id="sort-filter"
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value as 'RARE_DESC' | 'TOTAL_DESC' | 'NAME_ASC');
                  setPage(0);
                }}
                className="rounded-xl border border-white/10 bg-bg-card px-3 py-2 text-xs font-semibold text-gray-300 focus:border-brand-blue focus:outline-none"
              >
                <option value="RARE_DESC">Most Rare Cards</option>
                <option value="TOTAL_DESC">Most Total Cards</option>
                <option value="NAME_ASC">Name (A-Z)</option>
              </select>
            </div>

            {(appliedSearch || selectedRole !== 'ALL' || selectedSort !== 'RARE_DESC') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <main className="w-full max-w-[1440px] px-4 md:px-8">
        
        {/* Error Notice */}
        {error && (
          <div className="mb-8 flex items-center justify-between rounded-2xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void fetchCollections()}
              className="rounded-lg bg-status-danger/20 px-3 py-1 font-semibold hover:bg-status-danger/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-bg-surface p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/3 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-14 rounded-xl" />
                  <Skeleton className="h-14 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((__, cIdx) => (
                    <Skeleton key={cIdx} className="h-20 w-14 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Collections Grid */}
        {!isLoading && !error && collections.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((summary) => (
              <PublicCollectionSummaryCard key={summary.userId} summary={summary} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && collections.length === 0 && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-bg-surface text-gray-500 border border-white/10">
              <Layers size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No public collections found</h3>
            <p className="max-w-md text-sm text-gray-400 mb-6">
              {appliedSearch
                ? `No collector or card matched "${appliedSearch}". Try searching with different keywords.`
                : 'There are currently no public collections available matching the selected filters.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && !error && totalPages > 1 && (
          <nav aria-label="Collections pagination" className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-bg-surface px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-bg-elevated hover:text-white disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-xs text-gray-400 font-medium">
              Page <span className="font-bold text-white">{page + 1}</span> of <span className="font-bold text-white">{totalPages}</span>
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-bg-surface px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-bg-elevated hover:text-white disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
