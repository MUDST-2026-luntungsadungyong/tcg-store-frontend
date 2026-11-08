import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { formatCondition, normalizeConditionToCode } from '@/entities/card/model/condition';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup';
import { Input } from '@/shared/components/Input';
import { PageHeader, Panel } from '@/shared/components/PageLayout';
import { cn } from '@/shared/lib';
import { auctionApi, auctionError, type Auction, type AuctionInventory } from '../api/auctions';
import { AuctionCardSummary, AuctionLoading, AuctionPage, DetailRows, Notice } from '../components/AuctionUI';
import {
  AuctionPhotos, ConditionAndGrading, InventoryPicker, PricingFields, PricingRows, ScheduleFields, ScheduleRows,
} from '../components/AuctionWizardSections';
import { draftFields, draftMultipart, validateDraftStep, type DraftErrors, type DraftFields, type DraftPhotos, type PhotoSide } from '../model/auctionDraft';
import { AUCTIONS_PATH, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

const STEPS = ['Card details', 'Pricing', 'Scheduling'];
const TITLES = ['Create Auction', 'Auction Pricing', 'Auction Scheduling', 'Review Auction'];
const DESCRIPTIONS = [
  'Step 1 of 3 · Choose the card and describe its condition.',
  'Step 2 of 3 · Set an optional hidden reserve and Buy-It-Now price.',
  'Step 3 of 3 · Choose when your auction starts and how long it runs.',
  'Make sure every detail is correct before creating the auction.',
];
const NEXT = ['Next: Pricing', 'Next: Scheduling', 'Review Auction', 'Confirm & Create Auction'];

export function AuctionWizardPage() {
  const { auctionId } = useParams();
  return <AuctionWizardLoader key={auctionId || 'new'} auctionId={auctionId ? Number(auctionId) : undefined} />;
}

function AuctionWizardLoader({ auctionId }: { auctionId?: number }) {
  const fetchData = useCallback(async () => {
    const [inventory, draft] = await Promise.all([
      auctionApi.inventory(),
      auctionId === undefined ? undefined : auctionApi.get(auctionId),
    ]);
    return { inventory, draft };
  }, [auctionId]);
  const { data, loading, error, reload } = useAuctionResource(fetchData, 'Could not load your seller inventory or draft.');
  if (data?.draft && data.draft.status !== 'DRAFT') return <Navigate to={`${AUCTIONS_PATH}/${data.draft.id}`} replace />;
  return <AuctionPage>
    {data ? <AuctionWizard inventory={data.inventory} initialDraft={data.draft} refreshInventory={() => reload()} /> : <>
      <PageHeader eyebrow="Seller auctions" title={auctionId ? 'Edit Draft' : 'Create Auction'} />
      {loading ? <AuctionLoading label="Loading seller inventory" /> : <ErrorState message={error} onRetry={() => reload()} />}
    </>}
  </AuctionPage>;
}

function AuctionWizard({ inventory, initialDraft, refreshInventory }: {
  inventory: AuctionInventory[];
  initialDraft?: Auction;
  refreshInventory: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [fields, setFields] = useState(() => draftFields(initialDraft));
  const [photos, setPhotos] = useState<DraftPhotos>({});
  const [saved, setSaved] = useState(initialDraft);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState<'save' | 'publish' | null>(null);
  const [dirty, setDirty] = useState(false);
  const allowNavigation = useRef(false);
  const [idempotencyKey] = useState(() => Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join(''));
  const [clockOffset] = useState(() => initialDraft?.serverTime ? Date.parse(initialDraft.serverTime) - Date.now() : 0);
  const clock = useAuctionClock();
  const now = clock + clockOffset;
  const selected = inventory.find(item => String(item.productId) === fields.productId);
  const urls = { front: saved?.frontImageUrl, back: saved?.backImageUrl };
  const blocker = useBlocker(() => dirty && !allowNavigation.current);
  useBeforeUnload(useCallback(event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  }, [dirty]));
  const heading = useRef<HTMLDivElement>(null);
  const focusStep = useRef(false);
  useEffect(() => {
    if (focusStep.current) heading.current?.focus();
  }, [step]);

  const update = <K extends keyof DraftFields>(field: K, value: DraftFields[K]) => {
    setFields(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setDirty(true);
    setSuccess('');
    setMessage('');
  };
  const choosePhoto = (side: PhotoSide, photo: File) => {
    setPhotos(previous => ({ ...previous, [side]: photo }));
    setErrors(previous => ({ ...previous, [side]: undefined }));
    setDirty(true);
    setSuccess('');
    setMessage('');
  };
  const go = (next: number) => {
    focusStep.current = true;
    setErrors({});
    setMessage('');
    setStep(next);
  };
  const reviewEdit = (target: number) => {
    setReturnToReview(true);
    go(target);
  };
  const validate = (target: number) => validateDraftStep(target, fields, Boolean(selected && selected.availableQuantity > 0), photos, urls, now);
  const showValidation = (target: number, problems: DraftErrors) => {
    go(target);
    setErrors(problems);
    setMessage('Check the highlighted fields and try again.');
  };

  const save = async (publish: boolean) => {
    setBusy(publish ? 'publish' : 'save');
    setMessage('');
    setSuccess('');
    try {
      let draft = saved;
      if (!draft || dirty) {
        const body = draftMultipart(fields, photos);
        draft = draft ? await auctionApi.updateDraft(draft.id, body) : await auctionApi.createDraft(body, idempotencyKey);
        setSaved(draft);
        setPhotos({});
        setDirty(false);
      }
      if (publish) {
        const auction = await auctionApi.publish(draft.id);
        allowNavigation.current = true;
        navigate(`${AUCTIONS_PATH}/${auction.id}`, { replace: true, state: { created: true } });
      } else {
        setSuccess('Draft changes saved. Inventory remains available.');
      }
    } catch (failure) {
      setMessage(auctionError(failure, publish ? 'Could not confirm auction creation. You can check the draft and retry.' : 'Could not save your draft. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const next = () => {
    for (const target of step === 3 ? [0, 1, 2] : [step]) {
      const problems = validate(target);
      if (Object.keys(problems).length) {
        showValidation(target, problems);
        return;
      }
    }
    if (step === 3) { void save(true); return; }
    go(returnToReview ? 3 : step + 1);
    setReturnToReview(false);
  };

  const fieldsProps = { fields, errors, update };
  const card = <AuctionCardSummary name={selected?.cardName} imageUrl={selected?.imageUrl} setName={selected?.setName} condition={fields.condition} inventoryId={selected?.productId} />;
  const editAction = (label: string, target: number) => <Button type="button" size="sm" variant="ghost" onClick={() => reviewEdit(target)}>{label}</Button>;
  const canLeave = blocker.state === 'blocked';
  return <>
    <div ref={heading} tabIndex={-1} className="focus:outline-none">
      <PageHeader eyebrow="Seller auctions" title={step === 0 && initialDraft ? 'Edit Draft' : TITLES[step]} description={DESCRIPTIONS[step]}
        actions={saved && <Link to={`${AUCTIONS_PATH}/${saved.id}`} className="text-sm text-brand-blue hover:underline">View saved draft</Link>} />
    </div>
    {step < 3 && <ol aria-label="Auction setup progress" className="grid grid-cols-3 gap-2 rounded-xl bg-bg-surface p-3 sm:p-4">
      {STEPS.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={cn('flex min-w-0 items-center gap-2 text-xs sm:text-sm', step === index ? 'font-semibold text-text-primary' : 'text-text-secondary')}>
        <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full sm:size-8', index <= step ? 'bg-brand-blue text-bg-base' : 'bg-bg-elevated')}>
          {index < step ? <Check size={14} aria-hidden /> : index + 1}
        </span>
        {label}
      </li>)}
    </ol>}
    {success && <div role="status"><Notice title="Draft saved" tone="success">{success}</Notice></div>}
    <fieldset disabled={Boolean(busy)} className="min-w-0 space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {step === 0 && <>
            <InventoryPicker {...fieldsProps} inventory={inventory} selected={selected} />
            <ConditionAndGrading {...fieldsProps} inventoryCondition={selected ? normalizeConditionToCode(selected.condition) : undefined} />
            <AuctionPhotos photos={photos} urls={urls} errors={errors} onChoose={choosePhoto} />
          </>}
          {step === 1 && <PricingFields {...fieldsProps} />}
          {step === 2 && <ScheduleFields {...fieldsProps} now={now} />}
          {step === 3 && <>
            <Panel className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Card details</h2>{editAction('Edit card details', 0)}
              </div>
              {card}
              <DetailRows items={[
                ['Condition', formatCondition(fields.condition)],
                ['Grading', fields.gradingCompany ? [fields.gradingCompany, fields.grade, fields.certNumber].join(' · ') : 'Ungraded'],
              ]} />
            </Panel>
            <AuctionPhotos photos={photos} urls={urls} actions={editAction('Edit photos', 0)} />
          </>}
        </div>
        <aside className="min-w-0 space-y-4">
          {step === 0 && <>
            <Panel className="space-y-3">
              <h2 className="text-lg font-semibold">Starting price</h2>
              <Input label="Start price (THB)" inputMode="decimal" value={fields.startPrice} onChange={event => update('startPrice', event.target.value)} error={errors.startPrice} />
              <p className="text-xs text-text-secondary">Must be greater than ฿0.</p>
            </Panel>
            <Notice title="Inventory stays available">Saving a draft keeps your inventory available. Confirming the auction reserves one unit.</Notice>
            {selected && <Panel className="space-y-3"><h2 className="text-lg font-semibold">Selected card</h2>{card}</Panel>}
          </>}
          {(step === 1 || step === 3) && <Panel className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{step === 1 ? 'Seller-only summary' : 'Pricing'}</h2>
              {step === 3 && editAction('Edit pricing', 1)}
            </div>
            {step === 1 && card}
            <PricingRows fields={fields} />
          </Panel>}
          {step === 1 && <Panel className="space-y-3">
            <h2 className="text-lg font-semibold">What bidders will see</h2>
            <DetailRows items={[
              ['Starting bid', money(fields.startPrice)],
              ['Buy-It-Now', fields.buyItNowEnabled ? money(fields.buyItNowPrice) : 'Not set'],
            ]} />
            {fields.reserveEnabled && <p className="text-xs text-text-secondary">Reserve not met · Amount hidden</p>}
          </Panel>}
          {(step === 2 || step === 3) && <Panel className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{step === 2 ? 'Schedule summary' : 'Scheduling'}</h2>
              {step === 3 && editAction('Edit scheduling', 2)}
            </div>
            {step === 2 && card}
            <ScheduleRows fields={fields} now={now} />
            {step === 2 && <PricingRows fields={fields} />}
            {fields.startMode === 'NOW' && <p className="text-xs text-text-secondary">Estimated times. Confirmation uses the server clock.</p>}
          </Panel>}
          {step === 3 && <Notice title="Inventory locks only after success">Confirmation creates the auction and reserves one unit together.</Notice>}
        </aside>
      </div>
      {message && <div role="alert" className="rounded-xl border border-status-danger/30 bg-status-danger/5 p-4 text-sm text-status-danger">
        {message}
        {step === 0 && <Button type="button" variant="ghost" size="sm" className="ml-3" onClick={() => { void refreshInventory(); }}>Refresh inventory</Button>}
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <Button type="button" variant="secondary" onClick={() => { if (step === 0) navigate(AUCTIONS_PATH); else go(step - 1); }}>Back</Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate(AUCTIONS_PATH)}>Cancel</Button>
          <Button type="button" variant="secondary" isLoading={busy === 'save'} onClick={() => { void save(false); }}>{initialDraft ? 'Save Changes' : 'Save Draft'}</Button>
          <Button type="button" isLoading={busy === 'publish'} onClick={next}>{returnToReview && step < 3 ? 'Return to Review' : NEXT[step]}</Button>
        </div>
      </div>
    </fieldset>
    <FeedbackPopup isOpen={canLeave} tone="destructive" title="Leave without saving?"
      message="Your changes since the last save will be discarded."
      primaryAction={{ label: 'Discard changes', onClick: () => { if (blocker.state === 'blocked') blocker.proceed(); } }}
      secondaryAction={{ label: 'Keep editing', onClick: () => { if (blocker.state === 'blocked') blocker.reset(); } }}
    />
  </>;
}
