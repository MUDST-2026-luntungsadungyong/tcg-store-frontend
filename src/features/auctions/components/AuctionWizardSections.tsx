import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { formatCondition, CONDITION_CODE_MAP, normalizeConditionToCode } from '@/entities/card/model/condition';
import type { CatalogCard } from '@/features/discovery/api/catalog';
import { CatalogCardPicker } from '@/features/listings/components/CatalogCardPicker';
import { IMAGE_TYPES, imageFileError } from '@/features/listings/model/imagePolicy';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Panel } from '@/shared/components/PageLayout';
import { SearchField } from '@/shared/components/SearchField';
import { Select } from '@/shared/components/Select';
import { cn } from '@/shared/lib';
import type { AuctionInventory } from '../api/auctions';
import { type DraftFields, type DraftErrors, type DraftPhotos, type DraftPhotoUrls, type PhotoSide, PHOTO_SIDES } from '../model/auctionDraft';
import { AUCTION_TIMEZONE, auctionDate, bangkokStart, DURATIONS, durationLabel, matchesAuctionSearch, money } from '../model/auctionFormat';
import { AuctionCardSummary, DetailRows, Notice, PrivateImage } from './AuctionUI';

type UpdateField = <K extends keyof DraftFields>(field: K, value: DraftFields[K]) => void;
type FieldsProps = { fields: DraftFields; errors: DraftErrors; update: UpdateField };

function toCatalogCard(item: AuctionInventory): CatalogCard {
  return { id: item.cardId, name: item.cardName, setName: item.setName, rarity: item.rarity ?? undefined,
    cardNumber: item.cardNumber ?? undefined, imageSmall: item.imageUrl ?? undefined };
}

export function InventoryPicker({ inventory, selected, initialCatalogCard, onCatalogChange, fields, errors, update }: FieldsProps & {
  inventory: AuctionInventory[];
  selected?: AuctionInventory;
  initialCatalogCard?: CatalogCard | null;
  onCatalogChange: (card: CatalogCard | null) => void;
}) {
  const [source, setSource] = useState<'catalog' | 'collection'>('catalog');
  const [catalogCard, setCatalogCard] = useState<CatalogCard | null>(() => selected ? toCatalogCard(selected) : initialCatalogCard ?? null);
  const [query, setQuery] = useState('');
  const catalogStock = catalogCard ? inventory.filter(item => item.cardId === catalogCard.id) : [];
  const collectionStock = inventory.filter(item => item.collectionMatch
    && matchesAuctionSearch(query, item.cardName, item.setName, item.productId, item.cardNumber, item.rarity));
  const select = (item?: AuctionInventory) => {
    update('productId', item ? String(item.productId) : '');
    if (item) update('cardId', '');
    if (item) update('condition', normalizeConditionToCode(item.condition));
  };
  return <Panel className="space-y-4">
    <h2 className="text-lg font-semibold">{source === 'catalog' ? 'Find your card' : 'My Collection'}</h2>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Card source">
      <Button type="button" size="sm" variant={source === 'catalog' ? 'primary' : 'secondary'} aria-pressed={source === 'catalog'} onClick={() => {
        if (selected) setCatalogCard(toCatalogCard(selected));
        setSource('catalog');
      }}>Global Catalog</Button>
      <Button type="button" size="sm" variant={source === 'collection' ? 'primary' : 'secondary'} aria-pressed={source === 'collection'} onClick={() => setSource('collection')}>My Collection</Button>
    </div>
    {source === 'catalog' ? <>
      <CatalogCardPicker card={catalogCard} onSelect={card => { setCatalogCard(card); onCatalogChange(card); select(undefined); update('cardId', card?.id ?? ''); }} />
      {catalogCard && <>
        <AuctionCardSummary name={catalogCard.name} imageUrl={catalogCard.imageSmall || catalogCard.imageLarge} setName={catalogCard.setName} />
        <Select label="Your inventory item" value={catalogStock.some(item => String(item.productId) === fields.productId) ? fields.productId : ''}
          onChange={event => { const item = catalogStock.find(item => String(item.productId) === event.target.value); select(item); if (!item) update('cardId', catalogCard.id); }}
          options={[
            { value: '', label: 'Use catalog card directly' },
            ...catalogStock.filter(item => item.availableQuantity > 0 || item.productId === selected?.productId).map(item => ({
              value: String(item.productId),
              label: `Inventory #${item.productId} · ${formatCondition(item.condition)} · ${item.language ?? 'EN'} · ${item.availableQuantity} available`,
            })),
          ]} error={errors.productId}
        />
        <p className="text-xs text-text-secondary">{catalogStock.length
          ? 'Availability is checked again at confirmation.'
          : 'You can auction this catalog card directly.'}</p>
      </>}
      {!catalogCard && errors.productId && <p role="alert" className="text-sm text-status-danger">{errors.productId}</p>}
    </> : <>
      <SearchField label="Search collection" aria-label="Search collection" value={query} onChange={event => setQuery(event.target.value)} />
      <p className="text-xs text-text-secondary">{collectionStock.filter(item => item.availableQuantity > 0).length} available inventory items</p>
      {collectionStock.length === 0 && <p className="rounded-xl bg-bg-surface p-4 text-sm text-text-secondary">No matching seller inventory. You can choose a card from Global Catalog to auction it directly.</p>}
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {collectionStock.map(item => <li key={item.productId}>
          <button type="button" aria-pressed={item.productId === selected?.productId} disabled={item.availableQuantity < 1}
            className={cn('flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-bg-surface p-3 text-left focus-visible:outline-2 focus-visible:outline-brand-blue disabled:opacity-60',
              item.productId === selected?.productId && 'border-brand-blue/40 bg-bg-elevated')}
            onClick={() => select(item)}
          >
            <AuctionCardSummary name={item.cardName} setName={item.setName} condition={item.condition} imageUrl={item.imageUrl} inventoryId={item.productId} />
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              {item.availableQuantity > 0 ? `${item.availableQuantity} available` : 'Unavailable'}
              {item.productId === selected?.productId ? <Check size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
            </span>
          </button>
        </li>)}
      </ul>
      {errors.productId && <p role="alert" className="text-sm text-status-danger">{errors.productId}</p>}
    </>}
  </Panel>;
}

export function ConditionAndGrading({ fields, errors, update, inventoryCondition, inventoryLanguage }: FieldsProps & {
  inventoryCondition?: string;
  inventoryLanguage?: string;
}) {
  return <Panel className="space-y-4">
    <h2 className="text-lg font-semibold">Condition & grading</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Number of copies" type="number" min={1} max={2_147_483_647} step={1} value={fields.quantity} onChange={event => update('quantity', event.target.value)} error={errors.quantity} />
      <Select label="Card language" value={inventoryLanguage ?? fields.language} disabled={Boolean(inventoryCondition)}
        onChange={event => update('language', event.target.value)}
        options={[{ value: 'EN', label: 'English' }, { value: 'JP', label: 'Japanese' }, { value: 'TH', label: 'Thai' }]} />
    </div>
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Card condition *</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(CONDITION_CODE_MAP).map(([code, label]) => <Button key={code} type="button" size="sm"
          aria-pressed={fields.condition === code} disabled={Boolean(inventoryCondition && inventoryCondition !== code)}
          title={label} variant={fields.condition === code ? 'primary' : 'secondary'}
          onClick={() => update('condition', code)}>{code}</Button>)}
      </div>
      {inventoryCondition && <p className="mt-2 text-sm text-text-secondary">The condition must match the selected seller inventory.</p>}
      {errors.condition && <p role="alert" className="mt-2 text-sm text-status-danger">{errors.condition}</p>}
    </fieldset>
    <p className="text-sm text-text-secondary">Multiple-copy lots must be ungraded; a certificate identifies one card.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <Select label="Grading company (optional)" value={fields.gradingCompany} onChange={event => update('gradingCompany', event.target.value)}
        options={[{ value: '', label: 'Ungraded' }, ...['PSA', 'BGS', 'CGC'].map(value => ({ value, label: value }))]} />
      {errors.gradingCompany && <p role="alert" className="text-sm text-status-danger">{errors.gradingCompany}</p>}
      <Input label="Grade" value={fields.grade} disabled={!fields.gradingCompany} maxLength={30}
        onChange={event => update('grade', event.target.value)} error={errors.grade} />
      <Input label="Certificate number" value={fields.certNumber} disabled={!fields.gradingCompany} maxLength={100}
        onChange={event => update('certNumber', event.target.value)} error={errors.certNumber} />
    </div>
  </Panel>;
}

export function AuctionPhotos({ photos = {}, urls, errors = {}, onChoose, actions }: {
  photos?: DraftPhotos;
  urls: DraftPhotoUrls;
  errors?: DraftErrors;
  onChoose?: (side: PhotoSide, file: File) => void;
  actions?: React.ReactNode;
}) {
  const [fileError, setFileError] = useState<Partial<Record<PhotoSide, string>>>({});
  return <Panel className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">Actual card photos</h2>
      {actions}
    </div>
    {onChoose && <p className="text-sm text-text-secondary">Upload actual front and back photos; each photo must show all copies in the lot. Use JPG, PNG or WebP, up to 5 MiB each.</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      {PHOTO_SIDES.map(side => {
        const label = side === 'front' ? 'Front photo' : 'Back photo';
        const error = fileError[side] || errors[side];
        return <div key={side} className="min-w-0 space-y-2">
          <p className="text-sm font-medium">{label}</p>
          <PrivateImage file={photos[side]} url={urls[side]} label={label} />
          {photos[side] && <p className="break-all text-xs text-text-secondary">{photos[side].name}</p>}
          {onChoose && <input
            type="file" aria-label={label} accept={IMAGE_TYPES.join(',')} aria-invalid={!!error}
            aria-describedby={error ? `auction-${side}-error` : undefined}
            className="block w-full min-w-0 text-sm text-text-secondary file:mr-2 file:rounded-lg file:border-0 file:bg-bg-elevated file:px-3 file:py-2 file:text-text-primary"
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              const issue = imageFileError(file);
              setFileError(previous => ({ ...previous, [side]: issue }));
              if (!issue) onChoose(side, file);
            }}
          />}
          {error && <p id={`auction-${side}-error`} role="alert" className="text-sm text-status-danger">{error}</p>}
        </div>;
      })}
    </div>
  </Panel>;
}

export function PricingRows({ fields }: { fields: Pick<DraftFields, 'startPrice' | 'reservePrice' | 'buyItNowPrice' | 'reserveEnabled' | 'buyItNowEnabled'> }) {
  return <DetailRows items={[
    ['Starting price', money(fields.startPrice)],
    ['Hidden reserve · Seller only', fields.reserveEnabled ? money(fields.reservePrice) : 'Not set'],
    ['Buy-It-Now', fields.buyItNowEnabled ? money(fields.buyItNowPrice) : 'Not set'],
  ]} />;
}

export function PricingFields({ fields, errors, update }: FieldsProps) {
  return <Panel className="space-y-5">
    <h2 className="text-lg font-semibold">Set your prices</h2>
    <p className="text-sm text-text-secondary">All prices are for the whole lot.</p>
    <DetailRows items={[[ 'Start price · From Card Details', money(fields.startPrice) ]]} />
    <label className="flex min-h-9 items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={fields.reserveEnabled} onChange={event => update('reserveEnabled', event.target.checked)} className="size-4 accent-brand-blue" />
      Enable hidden reserve price
    </label>
    {fields.reserveEnabled && <Input label="Reserve price (THB)" value={fields.reservePrice} inputMode="decimal" onChange={event => update('reservePrice', event.target.value)} error={errors.reservePrice} />}
    <Notice title="Only you can see the reserve amount">Buyer-facing auction information only shows whether the reserve has been met.</Notice>
    <label className="flex min-h-9 items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={fields.buyItNowEnabled} onChange={event => update('buyItNowEnabled', event.target.checked)} className="size-4 accent-brand-blue" />
      Enable Buy-It-Now
    </label>
    {fields.buyItNowEnabled && <Input label="Buy-It-Now price (THB)" value={fields.buyItNowPrice} inputMode="decimal" onChange={event => update('buyItNowPrice', event.target.value)} error={errors.buyItNowPrice} />}
  </Panel>;
}

function scheduleTimes(fields: DraftFields, now: number) {
  const start = fields.startMode === 'NOW' ? now : bangkokStart(fields.date, fields.time);
  const end = start == null ? null : new Date(start).getTime() + Number(fields.durationHours) * 3_600_000;
  return { start, end };
}

export function ScheduleFields({ fields, errors, update, now }: FieldsProps & { now: number }) {
  const { end } = scheduleTimes(fields, now);
  return <Panel className="space-y-5">
    <h2 className="text-lg font-semibold">When should bidding begin?</h2>
    <div role="group" aria-label="Start type" className="flex flex-wrap gap-2">
      <Button type="button" variant={fields.startMode === 'NOW' ? 'primary' : 'secondary'} aria-pressed={fields.startMode === 'NOW'} onClick={() => update('startMode', 'NOW')}>Start Now</Button>
      <Button type="button" variant={fields.startMode === 'SCHEDULED' ? 'primary' : 'secondary'} aria-pressed={fields.startMode === 'SCHEDULED'} onClick={() => update('startMode', 'SCHEDULED')}>Schedule for Later</Button>
    </div>
    {fields.startMode === 'SCHEDULED' && <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start date" type="date" value={fields.date} onChange={event => update('date', event.target.value)} error={errors.date} />
        <Input label="Start time" type="time" step={1} value={fields.time} onChange={event => update('time', event.target.value)} error={errors.time} />
      </div>
      <p className="text-sm text-brand-blue">Timezone · {AUCTION_TIMEZONE} (UTC+07:00)</p>
      <Notice title="At least 15 minutes after server time">Estimated earliest start: {auctionDate(now + 15 * 60_000)}. The server checks the time at confirmation.</Notice>
    </>}
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Auction duration *</legend>
      <div className="flex flex-wrap gap-2">
        {DURATIONS.map(({ value, label }) => <Button key={value} type="button" size="sm" variant={fields.durationHours === value ? 'primary' : 'secondary'}
          aria-pressed={fields.durationHours === value} onClick={() => update('durationHours', value)}>{label}</Button>)}
      </div>
      {errors.durationHours && <p className="mt-2 text-sm text-status-danger">{errors.durationHours}</p>}
    </fieldset>
    {end != null && <p className="text-sm text-status-success">{fields.startMode === 'NOW' ? 'Estimated' : 'Calculated'} end · {auctionDate(end)} {AUCTION_TIMEZONE}</p>}
  </Panel>;
}

export function ScheduleRows({ fields, now }: { fields: DraftFields; now: number }) {
  const { start, end } = scheduleTimes(fields, now);
  return <DetailRows items={[
    ['Start type', fields.startMode === 'NOW' ? 'Start Now' : 'Schedule for Later'],
    [`Start · ${AUCTION_TIMEZONE}`, auctionDate(start)],
    ['Duration', durationLabel(fields.durationHours)],
    [`End · ${AUCTION_TIMEZONE}`, auctionDate(end)],
  ]} />;
}
