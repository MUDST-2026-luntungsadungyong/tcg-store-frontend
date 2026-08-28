import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  ImagePlus,
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
  toSellerProductError,
  type SellerProduct,
  type SellerProductInput,
} from '@/api/sellerProducts';
import { useSellerInventoryStore } from '@/store/useSellerInventoryStore';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { useToastStore } from '@/components/common/Toast';
import type { ProductStatus } from '@/types';

const GAME_OPTIONS = [
  { value: '', label: 'Select game' },
  { value: 'Pokemon', label: 'Pokemon' },
  { value: 'YGO', label: 'Yu-Gi-Oh!' },
  { value: 'MTG', label: 'Magic: The Gathering' },
  { value: 'One Piece', label: 'One Piece' },
];

const CONDITION_OPTIONS = [
  { value: '', label: 'Select condition' },
  { value: 'Gem Mint', label: 'Gem Mint' },
  { value: 'Mint', label: 'Mint' },
  { value: 'Near Mint', label: 'Near Mint' },
  { value: 'Lightly Played', label: 'Lightly Played' },
  { value: 'Moderately Played', label: 'Moderately Played' },
  { value: 'Heavily Played', label: 'Heavily Played' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'SHOW', label: 'Show' },
  { value: 'HIDE', label: 'Hide' },
];

const GAME_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All games' },
  ...GAME_OPTIONS.slice(1),
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ProductForm = {
  name: string;
  game: string;
  image: string;
  price: string;
  cost: string;
  stock: string;
  status: ProductStatus;
  condition: string;
  set: string;
  rarity: string;
};

type ProductFormErrors = Partial<Record<keyof ProductForm, string>>;

const emptyForm = (): ProductForm => ({
  name: '',
  game: '',
  image: '',
  price: '',
  cost: '',
  stock: '',
  status: 'SHOW',
  condition: '',
  set: '',
  rarity: '',
});

const productToForm = (product: SellerProduct): ProductForm => ({
  name: product.name,
  game: product.game,
  image: product.image,
  price: String(product.price),
  cost: String(product.cost),
  stock: String(product.stock),
  status: product.status,
  condition: product.condition ?? '',
  set: product.set ?? '',
  rarity: product.rarity ?? '',
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
  form: ProductForm,
  imageFile: File | null,
): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const price = Number(form.price);
  const cost = Number(form.cost);
  const stock = Number(form.stock);

  if (!form.name.trim()) errors.name = 'Product name is required.';
  if (!form.game) errors.game = 'Game is required.';
  if (!form.image.trim() && !imageFile) {
    errors.image = 'Add an image URL or upload an image.';
  }
  if (!form.price.trim() || Number.isNaN(price) || price < 0) {
    errors.price = 'Enter a valid sell price.';
  }
  if (!form.cost.trim() || Number.isNaN(cost) || cost < 0) {
    errors.cost = 'Enter a valid cost.';
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

export function ProductManagementPage() {
  const addToast = useToastStore((state) => state.addToast);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorDialogRef = useRef<HTMLDivElement>(null);

  const {
    products,
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
    fetchProducts,
    saveProduct,
    setProductStatus,
    deleteProduct,
    clearError,
    setSearchQuery,
    setGameFilter,
    setStatusFilter,
    setViewMode,
    setCurrentPage,
  } = useSellerInventoryStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(
    null,
  );
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null);

  useEffect(() => {
    void fetchProducts().catch(() => undefined);
  }, [fetchProducts]);

  // Keep the Add/Edit Product dialog local to this page so changing its
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          product.name,
          product.game,
          product.condition,
          product.set,
          product.rarity,
          product.id,
          String(product.price),
          String(product.cost),
          String(product.stock),
          String(product.price - product.cost),
          product.status,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      const matchesStatus =
        statusFilter === 'ALL' || product.status === statusFilter;
      const matchesGame = gameFilter === 'ALL' || product.game === gameFilter;

      return matchesSearch && matchesStatus && matchesGame;
    });
  }, [gameFilter, products, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const visibleProducts = filteredProducts.slice(
    (visiblePage - 1) * pageSize,
    visiblePage * pageSize,
  );

  const updateForm = <K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const openAddModal = () => {
    clearError();
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setEditingProduct(null);
    setForm(emptyForm());
    setFormErrors({});
    setImageFile(null);
    setImagePreview('');
    setEditorOpen(true);
  };

  const openEditModal = (product: SellerProduct) => {
    clearError();
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setEditingProduct(product);
    setForm(productToForm(product));
    setFormErrors({});
    setImageFile(null);
    setImagePreview(product.image);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setEditorOpen(false);
    setEditingProduct(null);
    setFormErrors({});
    setImageFile(null);
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
  };

  const selectImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        image: 'Use a JPG, PNG, or WebP image.',
      }));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormErrors((current) => ({
        ...current,
        image: 'Image must be 5 MB or smaller.',
      }));
      return;
    }

    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormErrors((current) => ({ ...current, image: undefined }));
  };

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) selectImageFile(file);
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) selectImageFile(file);
  };

  const removeImage = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    updateForm('image', '');
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors = validateForm(form, imageFile);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: SellerProductInput = {
      name: form.name.trim(),
      game: form.game,
      image: form.image.trim(),
      price: Number(form.price),
      cost: Number(form.cost),
      stock: Number(form.stock),
      status: form.status,
      condition: form.condition || undefined,
      set: form.set.trim() || undefined,
      rarity: form.rarity.trim() || undefined,
    };

    try {
      const saved = await saveProduct(
        payload,
        editingProduct?.id,
        imageFile,
      );

      addToast({
        type: 'success',
        title: editingProduct ? 'Product updated' : 'Product added',
        message: editingProduct
          ? `${saved.name} was updated successfully.`
          : `${saved.name} was added to your inventory.`,
      });

      setEditorOpen(false);
      setEditingProduct(null);
      setImageFile(null);
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    } catch (saveError) {
      const failure = toSellerProductError(saveError);
      addToast({
        type: 'error',
        title: 'Save failed',
        message: failure.message,
      });
    }
  };

  const toggleStatus = async (product: SellerProduct) => {
    if (pendingIds.includes(product.id)) return;

    const nextStatus: ProductStatus =
      product.status === 'SHOW' ? 'HIDE' : 'SHOW';

    try {
      await setProductStatus(product.id, nextStatus);
      addToast({
        type: 'success',
        title: nextStatus === 'SHOW' ? 'Product visible' : 'Product hidden',
        message:
          nextStatus === 'SHOW'
            ? `${product.name} is visible to customers.`
            : `${product.name} is hidden from the marketplace.`,
      });
    } catch (statusError) {
      addToast({
        type: 'error',
        title: 'Status update failed',
        message: toSellerProductError(statusError).message,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || pendingIds.includes(deleteTarget.id)) return;

    try {
      await deleteProduct(deleteTarget.id);
      addToast({
        type: 'success',
        title: 'Product deleted',
        message: `${deleteTarget.name} was removed from your inventory.`,
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      const failure = toSellerProductError(deleteError);
      addToast({
        type: 'error',
        title:
          failure.code === 'ACTIVE_ORDER'
            ? 'Cannot delete product'
            : 'Delete failed',
        message: failure.message,
      });
      setDeleteTarget(null);
    }
  };

  const requestDelete = (product: SellerProduct) => {
    if (product.status !== 'HIDE') {
      addToast({
        type: 'error',
        title: 'Hide product first',
        message: `${product.name} must be hidden before it can be deleted.`,
      });
      return;
    }
    setDeleteTarget(product);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
            Seller Inventory
          </p>
          <h1 className="text-3xl font-bold text-white">Product Management</h1>
          <p className="mt-2 text-sm text-gray-400">
            Add, edit, hide, restock, and remove your card listings.
          </p>
        </div>

        <Button type="button" className="gap-2 self-start" onClick={openAddModal}>
          <Plus size={18} />
          Add Product
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
            onClick={() => void fetchProducts().catch(() => undefined)}
          >
            Retry
          </Button>
        </div>
      )}

      <section className="glass-card rounded-2xl border border-white/10 p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto_auto]">
          <Input
            aria-label="Search products"
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
              setStatusFilter(event.target.value as 'ALL' | ProductStatus)
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
            onClick={() => void fetchProducts().catch(() => undefined)}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-bg-surface">
        {isLoading && products.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center text-gray-400">
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Package className="mb-4 text-gray-500" size={42} />
            <h2 className="text-lg font-semibold text-white">
              {products.length === 0
                ? 'No products yet'
                : 'No matching products'}
            </h2>
            <p className="mt-2 max-w-md text-sm text-gray-400">
              {products.length === 0
                ? 'Add your first listing to start managing seller inventory.'
                : 'Try another search term or show all statuses.'}
            </p>
            {products.length === 0 && (
              <Button className="mt-5 gap-2" onClick={openAddModal}>
                <Plus size={16} /> Add Product
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleProducts.map((product) => {
              const profit = product.price - product.cost;
              const margin = profitMargin(product.price, product.cost);
              const busy = pendingIds.includes(product.id);

              return (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-bg-card"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-bg-input">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
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
                        <h2 className="font-semibold text-white">{product.name}</h2>
                        <Badge
                          variant={
                            product.status === 'SHOW' ? 'success' : 'default'
                          }
                        >
                          {product.status === 'SHOW' ? 'Show' : 'Hide'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.game}
                        {product.condition ? ` • ${product.condition}` : ''}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-gray-500">Sell price</dt>
                        <dd className="mt-1 font-semibold text-white">
                          {formatBaht(product.price)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Cost</dt>
                        <dd className="mt-1 text-gray-300">
                          {formatBaht(product.cost)}
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
                            product.stock === 0
                              ? 'text-status-danger'
                              : 'text-gray-300'
                          }`}
                        >
                          {product.stock}
                        </dd>
                      </div>
                    </dl>

                    {(product.activeOrderCount ?? 0) > 0 && (
                      <p className="text-xs text-status-warning">
                        {product.activeOrderCount} active order(s)
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={product.status === 'SHOW'}
                          aria-label={`${product.name} visibility`}
                          disabled={busy}
                          onClick={() => void toggleStatus(product)}
                          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                            product.status === 'SHOW'
                              ? 'bg-brand-blue'
                              : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                              product.status === 'SHOW' ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs text-gray-400">
                          {product.status === 'SHOW' ? 'Visible' : 'Hidden'}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Edit ${product.name}`}
                          disabled={busy}
                          onClick={() => openEditModal(product)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete ${product.name}`}
                          title={
                            product.status === 'SHOW'
                              ? 'Hide this product before deleting it'
                              : 'Delete product'
                          }
                          className="text-status-danger hover:text-status-danger"
                          disabled={busy}
                          onClick={() => requestDelete(product)}
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
                  <th className="px-5 py-4 font-semibold">Product</th>
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
                {visibleProducts.map((product) => {
                  const profit = product.price - product.cost;
                  const margin = profitMargin(product.price, product.cost);
                  const busy = pendingIds.includes(product.id);

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-input">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
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
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {product.condition || 'No condition'}
                              {product.set ? ` • ${product.set}` : ''}
                            </p>
                            {(product.activeOrderCount ?? 0) > 0 && (
                              <p className="mt-1 text-xs text-status-warning">
                                {product.activeOrderCount} active order(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-300">{product.game}</td>
                      <td className="px-5 py-4 text-right font-medium text-white">
                        {formatBaht(product.price)}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-400">
                        {formatBaht(product.cost)}
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
                            product.stock === 0
                              ? 'text-status-danger'
                              : 'text-gray-300'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={product.status === 'SHOW'}
                            aria-label={`${product.name} visibility`}
                            disabled={busy}
                            onClick={() => void toggleStatus(product)}
                            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                              product.status === 'SHOW'
                                ? 'bg-brand-blue'
                                : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                                product.status === 'SHOW' ? 'left-6' : 'left-1'
                              }`}
                            />
                          </button>
                          <Badge
                            variant={
                              product.status === 'SHOW' ? 'success' : 'default'
                            }
                          >
                            {product.status === 'SHOW' ? 'Show' : 'Hide'}
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
                            onClick={() => openEditModal(product)}
                          >
                            <Pencil size={15} /> Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-status-danger hover:text-status-danger"
                            disabled={busy}
                            title={
                              product.status === 'SHOW'
                                ? 'Hide this product before deleting it'
                                : 'Delete product'
                            }
                            onClick={() => requestDelete(product)}
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
          {filteredProducts.length === 0
            ? 0
            : (visiblePage - 1) * pageSize + 1}
          –{Math.min(visiblePage * pageSize, filteredProducts.length)} of{' '}
          {filteredProducts.length} matching products ({products.length} total).
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
            aria-labelledby="product-editor-title"
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !isSaving) closeEditor();
            }}
            className="glass-elevated flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
              <h2
                id="product-editor-title"
                className="text-lg font-semibold text-white"
              >
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>

              <button
                type="button"
                aria-label="Close product editor"
                disabled={isSaving}
                onClick={closeEditor}
                className="text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <form className="space-y-5" onSubmit={handleSave} noValidate>
          <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload product image"
                className="aspect-square cursor-pointer overflow-hidden rounded-xl border border-dashed border-white/20 bg-bg-input transition-colors hover:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                onClick={() => imageInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleImageDrop}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-gray-500">
                    <ImagePlus size={30} />
                    <span className="text-xs">Drop JPG, PNG, or WebP here</span>
                  </div>
                )}
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageFile}
              />
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="flex-1 gap-2"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus size={15} /> Upload
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Remove product image"
                    className="text-status-danger hover:text-status-danger"
                    onClick={removeImage}
                  >
                    <X size={15} />
                  </Button>
                )}
              </div>
              {imageFile && (
                <p className="mt-2 truncate text-xs text-gray-400">
                  {imageFile.name}
                </p>
              )}
              {formErrors.image && (
                <p className="mt-2 text-xs text-status-danger">
                  {formErrors.image}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Input
                id="seller-product-name"
                label="Product name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                error={formErrors.name}
                placeholder="Charizard Base Set"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  id="seller-product-game"
                  label="Game"
                  value={form.game}
                  options={GAME_OPTIONS}
                  onChange={(event) => updateForm('game', event.target.value)}
                  error={formErrors.game}
                />
                <Select
                  id="seller-product-condition"
                  label="Condition / Grade"
                  value={form.condition}
                  options={CONDITION_OPTIONS}
                  onChange={(event) =>
                    updateForm('condition', event.target.value)
                  }
                />
              </div>

              <Input
                id="seller-product-image-url"
                label="Image URL"
                value={form.image}
                onChange={(event) => {
                  if (imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(imagePreview);
                  }
                  setImageFile(null);
                  updateForm('image', event.target.value);
                  setImagePreview(event.target.value);
                }}
                error={formErrors.image}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="seller-product-price"
              type="number"
              min="0"
              step="0.01"
              label="Sell price (฿)"
              value={form.price}
              onChange={(event) => updateForm('price', event.target.value)}
              error={formErrors.price}
            />
            <Input
              id="seller-product-cost"
              type="number"
              min="0"
              step="0.01"
              label="Cost (฿)"
              value={form.cost}
              onChange={(event) => updateForm('cost', event.target.value)}
              error={formErrors.cost}
            />
            <Input
              id="seller-product-stock"
              type="number"
              min="0"
              step="1"
              label="Stock"
              value={form.stock}
              onChange={(event) => updateForm('stock', event.target.value)}
              error={formErrors.stock}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="seller-product-set"
              label="Set"
              value={form.set}
              onChange={(event) => updateForm('set', event.target.value)}
              placeholder="Base Set"
            />
            <Input
              id="seller-product-rarity"
              label="Rarity"
              value={form.rarity}
              onChange={(event) => updateForm('rarity', event.target.value)}
              placeholder="Holo Rare"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="font-medium text-white">Visible to customers</p>
              <p className="mt-1 text-xs text-gray-400">
                Hidden products stay in inventory but are removed from the marketplace.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Product visibility"
              aria-checked={form.status === 'SHOW'}
              onClick={() =>
                updateForm(
                  'status',
                  form.status === 'SHOW' ? 'HIDE' : 'SHOW',
                )
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.status === 'SHOW' ? 'bg-brand-blue' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  form.status === 'SHOW' ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {form.price && form.cost && (
            <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Estimated profit / unit
              </p>
              <p
                className={`mt-1 text-xl font-bold ${
                  Number(form.price) - Number(form.cost) >= 0
                    ? 'text-status-success'
                    : 'text-status-danger'
                }`}
              >
                {formatBaht(Number(form.price) - Number(form.cost))}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {profitMargin(Number(form.price), Number(form.cost)) === null
                  ? 'Margin unavailable when sell price is zero.'
                  : `${profitMargin(Number(form.price), Number(form.cost))?.toFixed(1)}% margin`}
              </p>
            </div>
          )}

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
              {editingProduct ? 'Save Changes' : 'Add Product'}
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
        title="Delete product?"
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
              Delete Product
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
              The API will block deletion when this product belongs to an active
              order.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProductManagementPage;
