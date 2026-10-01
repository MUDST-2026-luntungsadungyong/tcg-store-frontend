import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import {
  toListingError,
  type ManagedListing,
  type ManagedListingInput,
} from '@/features/listings/api/listings';
import { useListingStore } from '@/features/listings/model/useListingStore';
import {
  CatalogCardDetails,
  CatalogCardImageFrame,
  CatalogCardPicker,
} from '@/features/listings/components/CatalogCardPicker';
import type { CatalogCard } from '@/features/discovery/api/catalog';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { Select } from '@/shared/components/Select';
import { useToastStore } from '@/shared/model/useToastStore';
import type { ListingVisibility } from '@/entities/card/model/types';

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'SHOW', label: 'Show' },
  { value: 'HIDE', label: 'Hide' },
];

const GAME_FILTER_OPTIONS = [
  { value: 'Pokemon', label: 'Pokemon' },
];

type ListingForm = {
  price: string;
  stock: string;
};

type ListingFormErrors = Partial<Record<keyof ListingForm | 'card', string>>;

const emptyForm = (): ListingForm => ({
  price: '',
  stock: '1',
});

const listingToForm = (listing: ManagedListing): ListingForm => ({
  price: String(listing.price),
  stock: String(listing.stock),
});

const listingToCatalogCard = (listing: ManagedListing): CatalogCard => ({
  id: listing.cardId ?? listing.id,
  name: listing.name,
  game: listing.game,
  rarity: listing.rarity,
  setName: listing.set,
  cardNumber: listing.cardNumber,
  imageSmall: listing.imageSmall,
  imageLarge: listing.imageLarge ?? listing.image,
  marketPrice: listing.marketPrice ?? listing.price,
  supertype: listing.supertype,
  subtypes: listing.subtypes ?? listing.stage,
  hp: listing.hp,
  types: listing.types,
  artist: listing.artist,
});

const formatBaht = (amount: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(amount);

const profitMargin = (price: number, cost: number) =>
  price > 0 ? ((price - cost) / price) * 100 : null;

function validateForm(
  form: ListingForm,
  selectedCard: CatalogCard | null,
  isEditing: boolean,
): ListingFormErrors {
  const errors: ListingFormErrors = {};
  const price = Number(form.price);
  const stock = Number(form.stock);

  if (!isEditing && !selectedCard) errors.card = 'Select a card from the database.';
  if (!form.price.trim() || Number.isNaN(price) || price < 0) {
    errors.price = 'Enter a valid listing price.';
  }
  if (
    !form.stock.trim() ||
    Number.isNaN(stock) ||
    stock < 0 ||
    !Number.isInteger(stock)
  ) {
    errors.stock = 'Stock must be a whole number of 0 or more.';
  }

  return errors;
}

export function ListingManagementPage() {
  const addToast = useToastStore((state) => state.addToast);
  const editorDialogRef = useRef<HTMLDivElement>(null);

  const {
    listings,
    isLoading,
    isSaving,
    pendingIds,
    error,
    searchQuery,
    gameFilter,
    statusFilter,
    viewMode,
    currentPage,
    pageSize,
    fetchListings,
    saveListing,
    setListingVisibility,
    deleteListing,
    clearError,
    setSearchQuery,
    setGameFilter,
    setVisibilityFilter,
    setViewMode,
    setCurrentPage,
  } = useListingStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ManagedListing | null>(
    null,
  );
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<ListingFormErrors>({});
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedListing | null>(null);

  useEffect(() => {
    void fetchListings().catch(() => undefined);
  }, [fetchListings]);

  // Keep the Add/Edit Listing dialog local to this page so changing its
  // position does not affect shared Modal usage elsewhere.
  useEffect(() => {
    if (!editorOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    editorDialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [editorOpen]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          listing.name,
          listing.game,
          listing.condition,
          listing.set,
          listing.rarity,
          listing.id,
          String(listing.price),
          String(listing.cost),
          String(listing.stock),
          String(listing.price - listing.cost),
          listing.status,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      const matchesStatus =
        statusFilter === 'ALL' || listing.status === statusFilter;
      const matchesGame = gameFilter === 'ALL' || listing.game === gameFilter;

      return matchesSearch && matchesStatus && matchesGame;
    });
  }, [gameFilter, listings, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const visibleListings = filteredListings.slice(
    (visiblePage - 1) * pageSize,
    visiblePage * pageSize,
  );

  const updateForm = <K extends keyof ListingForm>(
    field: K,
    value: ListingForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const openAddModal = () => {
    clearError();
    setEditingListing(null);
    setForm(emptyForm());
    setFormErrors({});
    setSelectedCard(null);
    setEditorOpen(true);
  };

  const openEditModal = (listing: ManagedListing) => {
    clearError();
    setEditingListing(listing);
    setForm(listingToForm(listing));
    setFormErrors({});
    setSelectedCard(listingToCatalogCard(listing));
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setEditorOpen(false);
    setEditingListing(null);
    setFormErrors({});
    setSelectedCard(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors = validateForm(form, selectedCard, Boolean(editingListing));
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const card = selectedCard;
    if (!card && !editingListing) return;

    const payload: ManagedListingInput = {
      cardId: editingListing?.cardId ?? card!.id,
      name: editingListing?.name ?? card!.name,
      game: editingListing?.game ?? card!.game ?? 'Pokemon',
      image:
        editingListing?.image ?? card!.imageSmall ?? card!.imageLarge ?? '',
      price: Number(form.price),
      cost: editingListing?.cost ?? 0,
      stock: Number(form.stock),
      status: editingListing?.status ?? 'SHOW',
      condition: editingListing?.condition,
      set: editingListing?.set ?? card!.setName,
      rarity: editingListing?.rarity ?? card!.rarity,
    };

    try {
      const saved = await saveListing(payload, editingListing?.id);

      addToast({
        type: 'success',
        title: editingListing ? 'Listing updated' : 'Listing added',
        message: editingListing
          ? `${saved.name} was updated successfully.`
          : `${saved.name} was added to your inventory.`,
      });

      setEditorOpen(false);
      setEditingListing(null);
      setSelectedCard(null);
    } catch (saveError) {
      const failure = toListingError(saveError);
      addToast({
        type: 'error',
        title: 'Save failed',
        message: failure.message,
      });
    }
  };

  const toggleStatus = async (listing: ManagedListing) => {
    if (pendingIds.includes(listing.id)) return;

    const nextStatus: ListingVisibility =
      listing.status === 'SHOW' ? 'HIDE' : 'SHOW';

    try {
      await setListingVisibility(listing.id, nextStatus);
      addToast({
        type: 'success',
        title: nextStatus === 'SHOW' ? 'Listing visible' : 'Listing hidden',
        message:
          nextStatus === 'SHOW'
            ? `${listing.name} is visible to customers.`
            : `${listing.name} is hidden from card discovery.`,
      });
    } catch (statusError) {
      addToast({
        type: 'error',
        title: 'Status update failed',
        message: toListingError(statusError).message,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || pendingIds.includes(deleteTarget.id)) return;

    try {
      await deleteListing(deleteTarget.id);
      addToast({
        type: 'success',
        title: 'Listing deleted',
        message: `${deleteTarget.name} was removed from your inventory.`,
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      const failure = toListingError(deleteError);
      addToast({
        type: 'error',
        title:
          failure.code === 'ACTIVE_RESERVATION'
            ? 'Cannot delete listing'
            : 'Delete failed',
        message: failure.message,
      });
      setDeleteTarget(null);
    }
  };

  const requestDelete = (listing: ManagedListing) => {
    setDeleteTarget(listing);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
            Seller Inventory
          </p>
          <h1 className="text-3xl font-bold text-white">Listing Management</h1>
          <p className="mt-2 text-sm text-gray-400">
            Add, edit, hide, restock, and remove your card listings.
          </p>
        </div>

        <Button type="button" className="gap-2 self-start" onClick={openAddModal}>
          <Plus size={18} />
          Add Listing
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-gray-200">
          <AlertTriangle className="text-status-danger" size={19} />
          <span className="flex-1">{error}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isLoading}
            onClick={() => void fetchListings().catch(() => undefined)}
          >
            Retry
          </Button>
        </div>
      )}

      <section className="glass-card rounded-2xl border border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto_auto]">
          <Input
            aria-label="Search listings"
            icon={Search}
            placeholder="Search name, game, set, price, stock..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <Select
            aria-label="Filter by game"
            value={gameFilter}
            options={GAME_FILTER_OPTIONS}
            onChange={(event) => setGameFilter(event.target.value)}
          />

          <Select
            aria-label="Filter by status"
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={(event) =>
              setVisibilityFilter(event.target.value as 'ALL' | ListingVisibility)
            }
          />

          <div
            className="flex rounded-full border border-white/10 bg-bg-input p-1"
            role="group"
            aria-label="Inventory view"
          >
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`rounded-full p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid2X2 size={17} />
            </button>
            <button
              type="button"
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              className={`rounded-full p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List size={17} />
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={isLoading}
            onClick={() => void fetchListings().catch(() => undefined)}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-bg-surface">
        {isLoading && listings.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center text-gray-400">
            Loading inventory...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Package className="mb-4 text-gray-500" size={42} />
            <h2 className="text-lg font-semibold text-white">
              {listings.length === 0
                ? 'No listings yet'
                : 'No matching listings'}
            </h2>
            <p className="mt-2 max-w-md text-sm text-gray-400">
              {listings.length === 0
                ? 'Add your first listing to start managing seller inventory.'
                : 'Try another search term or show all statuses.'}
            </p>
            {listings.length === 0 && (
              <Button className="mt-5 gap-2" onClick={openAddModal}>
                <Plus size={16} /> Add Listing
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleListings.map((listing) => {
              const profit = listing.price - listing.cost;
              const margin = profitMargin(listing.price, listing.cost);
              const busy = pendingIds.includes(listing.id);

              return (
                <article
                  key={listing.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-bg-card"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-bg-input">
                    {listing.image ? (
                      <img
                        src={listing.image}
                        alt={listing.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-600">
                        <Package size={36} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold text-white">{listing.name}</h2>
                        <Badge
                          variant={
                            listing.status === 'SHOW' ? 'success' : 'default'
                          }
                        >
                          {listing.status === 'SHOW' ? 'Show' : 'Hide'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {listing.game}
                        {listing.condition ? ` • ${listing.condition}` : ''}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-gray-500">Sell price</dt>
                        <dd className="mt-1 font-semibold text-white">
                          {formatBaht(listing.price)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Cost</dt>
                        <dd className="mt-1 text-gray-300">
                          {formatBaht(listing.cost)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Profit / margin</dt>
                        <dd
                          className={`mt-1 font-medium ${
                            profit >= 0
                              ? 'text-status-success'
                              : 'text-status-danger'
                          }`}
                        >
                          {formatBaht(profit)}
                          {margin === null ? '' : ` · ${margin.toFixed(1)}%`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Stock</dt>
                        <dd
                          className={`mt-1 font-medium ${
                            listing.stock === 0
                              ? 'text-status-danger'
                              : 'text-gray-300'
                          }`}
                        >
                          {listing.stock}
                        </dd>
                      </div>
                    </dl>

                    {(listing.activeReservationCount ?? 0) > 0 && (
                      <p className="text-xs text-status-warning">
                        {listing.activeReservationCount} active reservation(s)
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={listing.status === 'SHOW'}
                          aria-label={`${listing.name} visibility`}
                          disabled={busy}
                          onClick={() => void toggleStatus(listing)}
                          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                            listing.status === 'SHOW'
                              ? 'bg-brand-blue'
                              : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                              listing.status === 'SHOW' ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs text-gray-400">
                          {listing.status === 'SHOW' ? 'Visible' : 'Hidden'}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Edit ${listing.name}`}
                          disabled={busy}
                          onClick={() => openEditModal(listing)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete ${listing.name}`}
                          title="Delete listing"
                          className="text-status-danger hover:text-status-danger"
                          disabled={busy}
                          onClick={() => requestDelete(listing)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Listing</th>
                  <th className="px-5 py-4 font-semibold">Game</th>
                  <th className="px-5 py-4 text-right font-semibold">Price</th>
                  <th className="px-5 py-4 text-right font-semibold">Cost</th>
                  <th className="px-5 py-4 text-right font-semibold">Profit</th>
                  <th className="px-5 py-4 text-right font-semibold">Stock</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {visibleListings.map((listing) => {
                  const profit = listing.price - listing.cost;
                  const margin = profitMargin(listing.price, listing.cost);
                  const busy = pendingIds.includes(listing.id);

                  return (
                    <tr key={listing.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-input">
                            {listing.image ? (
                              <img
                                src={listing.image}
                                alt={listing.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-600">
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-semibold text-white">
                              {listing.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {listing.condition || 'No condition'}
                              {listing.set ? ` • ${listing.set}` : ''}
                            </p>
                            {(listing.activeReservationCount ?? 0) > 0 && (
                              <p className="mt-1 text-xs text-status-warning">
                                {listing.activeReservationCount} active reservation(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-300">{listing.game}</td>
                      <td className="px-5 py-4 text-right font-medium text-white">
                        {formatBaht(listing.price)}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-400">
                        {formatBaht(listing.cost)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-medium ${
                          profit >= 0
                            ? 'text-status-success'
                            : 'text-status-danger'
                        }`}
                      >
                        <span className="block">{formatBaht(profit)}</span>
                        {margin !== null && (
                          <span className="block text-xs">{margin.toFixed(1)}%</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={
                            listing.stock === 0
                              ? 'text-status-danger'
                              : 'text-gray-300'
                          }
                        >
                          {listing.stock}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={listing.status === 'SHOW'}
                            aria-label={`${listing.name} visibility`}
                            disabled={busy}
                            onClick={() => void toggleStatus(listing)}
                            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                              listing.status === 'SHOW'
                                ? 'bg-brand-blue'
                                : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                                listing.status === 'SHOW' ? 'left-6' : 'left-1'
                              }`}
                            />
                          </button>
                          <Badge
                            variant={
                              listing.status === 'SHOW' ? 'success' : 'default'
                            }
                          >
                            {listing.status === 'SHOW' ? 'Show' : 'Hide'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            disabled={busy}
                            onClick={() => openEditModal(listing)}
                          >
                            <Pencil size={15} /> Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-status-danger hover:text-status-danger"
                            disabled={busy}
                            title="Delete listing"
                            onClick={() => requestDelete(listing)}
                          >
                            <Trash2 size={15} /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing{' '}
          {filteredListings.length === 0
            ? 0
            : (visiblePage - 1) * pageSize + 1}
          –{Math.min(visiblePage * pageSize, filteredListings.length)} of{' '}
          {filteredListings.length} matching listings ({listings.length} total).
        </p>

        {totalPages > 1 && (
          <nav aria-label="Inventory pagination" className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label="Previous inventory page"
              disabled={visiblePage === 1}
              onClick={() => setCurrentPage(visiblePage - 1)}
            >
              <ChevronLeft size={15} />
            </Button>
            <span className="px-2 text-gray-300">
              Page {visiblePage} of {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label="Next inventory page"
              disabled={visiblePage === totalPages}
              onClick={() => setCurrentPage(visiblePage + 1)}
            >
              <ChevronRight size={15} />
            </Button>
          </nav>
        )}
      </div>

      {editorOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) {
                closeEditor();
              }
            }}
          >
          <div
            ref={editorDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-editor-title"
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !isSaving) closeEditor();
            }}
            className="glass-elevated flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
              <h2
                id="listing-editor-title"
                className="text-lg font-semibold text-white"
              >
                {editingListing ? 'Edit Listing' : 'Add Listing'}
              </h2>

              <button
                type="button"
                aria-label="Close listing editor"
                disabled={isSaving}
                onClick={closeEditor}
                className="text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <form className="space-y-5" onSubmit={handleSave} noValidate>
          <div className="grid gap-5 md:grid-cols-[320px_minmax(0,1fr)]">
            <CatalogCardImageFrame card={selectedCard} />

            <div className="space-y-4">
              <CatalogCardPicker
                card={selectedCard}
                disabled={Boolean(editingListing)}
                error={formErrors.card}
                onSelect={(card) => {
                  setSelectedCard(card);
                  setForm((current) => ({
                    ...current,
                    price:
                      card && typeof card.marketPrice === 'number'
                        ? String(card.marketPrice)
                        : current.price,
                  }));
                  setFormErrors((current) => ({
                    ...current,
                    card: undefined,
                    price: undefined,
                  }));
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="seller-listing-price"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Listing price (฿)"
                  value={form.price}
                  onChange={(event) => updateForm('price', event.target.value)}
                  error={formErrors.price}
                />
                <Input
                  id="seller-listing-stock"
                  type="number"
                  min="0"
                  step="1"
                  label="Quantity to sell"
                  value={form.stock}
                  onChange={(event) => updateForm('stock', event.target.value)}
                  error={formErrors.stock}
                />
              </div>

              {selectedCard && <CatalogCardDetails card={selectedCard} />}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={closeEditor}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingListing ? 'Save Changes' : 'Add Listing'}
            </Button>
          </div>
        </form>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteTarget || !pendingIds.includes(deleteTarget.id)) {
            setDeleteTarget(null);
          }
        }}
        title="Delete listing?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={Boolean(
                deleteTarget && pendingIds.includes(deleteTarget.id),
              )}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={Boolean(
                deleteTarget && pendingIds.includes(deleteTarget.id),
              )}
              onClick={() => void confirmDelete()}
            >
              Delete Listing
            </Button>
          </>
        }
      >
        <div className="flex gap-3 text-gray-300">
          <AlertTriangle
            className="mt-0.5 shrink-0 text-status-warning"
            size={22}
          />
          <div>
            <p>
              Delete{' '}
              <strong className="text-white">{deleteTarget?.name}</strong> from
              your inventory?
            </p>
            <p className="mt-2 text-sm text-gray-400">
              The API will block deletion when this listing belongs to an active
              order.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ListingManagementPage;
