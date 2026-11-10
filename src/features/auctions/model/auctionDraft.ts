import { CONDITION_CODE_MAP } from '@/entities/card/model/condition';
import type { Auction, StartMode } from '../api/auctions';
import { bangkokFields, bangkokStart, DURATIONS } from './auctionFormat';

export interface DraftFields {
  productId: string;
  cardId: string;
  quantity: string;
  language: string;
  condition: string;
  gradingCompany: string;
  grade: string;
  certNumber: string;
  startPrice: string;
  reservePrice: string;
  buyItNowPrice: string;
  reserveEnabled: boolean;
  buyItNowEnabled: boolean;
  startMode: StartMode;
  date: string;
  time: string;
  durationHours: string;
}

export const PHOTO_SIDES = ['front', 'back'] as const;
export type PhotoSide = typeof PHOTO_SIDES[number];
export type DraftPhotos = Partial<Record<PhotoSide, File>>;
export type DraftPhotoUrls = Partial<Record<PhotoSide, string | null>>;
export type DraftErrors = Partial<Record<keyof DraftFields | PhotoSide, string>>;

export function draftFields(auction?: Auction): DraftFields {
  return {
    productId: String(auction?.productId ?? ''),
    cardId: auction?.productId ? '' : (auction?.cardId ?? ''),
    quantity: '1',
    language: auction?.language ?? 'EN',
    condition: auction?.condition ?? '',
    gradingCompany: auction?.gradingCompany ?? '',
    grade: auction?.grade ?? '',
    certNumber: auction?.certNumber ?? '',
    startPrice: String(auction?.startPrice ?? ''),
    reservePrice: String(auction?.reservePrice ?? ''),
    buyItNowPrice: String(auction?.buyItNowPrice ?? ''),
    reserveEnabled: auction?.reservePrice != null,
    buyItNowEnabled: auction?.buyItNowPrice != null,
    startMode: auction?.startMode ?? 'NOW',
    ...bangkokFields(auction?.startAt),
    durationHours: String(auction?.durationHours ?? 72),
  };
}

function validPrice(value: string) {
  return /^\d{1,10}(?:\.\d{1,2})?$/.test(value) && Number(value) > 0;
}

export function validateDraftStep(step: number, fields: DraftFields, hasStock: boolean, photos: DraftPhotos, urls: DraftPhotoUrls, now: number): DraftErrors {
  const errors: DraftErrors = {};
  if (step === 0) {
    if (!hasStock && !fields.cardId) errors.productId = 'Choose a card or available inventory item.';
    if (fields.quantity !== '1' && Number(fields.quantity) !== 1) errors.quantity = 'Auctions can only contain exactly one card.';
    if (!Object.hasOwn(CONDITION_CODE_MAP, fields.condition)) errors.condition = 'Select a card condition.';
    if (!validPrice(fields.startPrice)) errors.startPrice = 'Enter a positive THB amount with up to two decimals.';
    if (fields.gradingCompany && !fields.grade.trim()) errors.grade = 'Enter the grade.';
    if (fields.gradingCompany && !fields.certNumber.trim()) errors.certNumber = 'Enter the certificate number.';
    for (const side of PHOTO_SIDES) {
      if (!photos[side] && !urls[side]) errors[side] = `Add the actual ${side} photo.`;
    }
  }
  if (step === 1) {
    if (fields.reserveEnabled && (!validPrice(fields.reservePrice) || Number(fields.reservePrice) < Number(fields.startPrice))) {
      errors.reservePrice = 'Reserve price must be at least the starting price.';
    }
    if (fields.buyItNowEnabled && (!validPrice(fields.buyItNowPrice)
      || Number(fields.buyItNowPrice) <= Math.max(Number(fields.startPrice), fields.reserveEnabled ? Number(fields.reservePrice) : 0))) {
      errors.buyItNowPrice = 'Buy-It-Now must be higher than the starting price and any reserve price.';
    }
  }
  if (step === 2) {
    if (!DURATIONS.some(({ value }) => value === fields.durationHours)) errors.durationHours = 'Choose an auction duration.';
    if (fields.startMode === 'SCHEDULED') {
      const start = bangkokStart(fields.date, fields.time);
      if (!fields.date) errors.date = 'Select a start date.';
      if (!fields.time) errors.time = 'Select a start time.';
      if (start && Date.parse(start) < now + 15 * 60_000) errors.time = 'Choose a start at least 15 minutes ahead.';
    }
  }
  return errors;
}

export function draftMultipart(fields: DraftFields, photos: DraftPhotos) {
  const body = new FormData();
  const values = {
    productId: fields.productId,
    cardId: fields.productId ? '' : fields.cardId,
    quantity: '1',
    language: fields.productId ? '' : fields.language,
    condition: fields.condition,
    gradingCompany: fields.gradingCompany,
    grade: fields.gradingCompany && fields.grade.trim(),
    certNumber: fields.gradingCompany && fields.certNumber.trim(),
    startPrice: fields.startPrice,
    reservePrice: fields.reserveEnabled && fields.reservePrice,
    buyItNowPrice: fields.buyItNowEnabled && fields.buyItNowPrice,
    startMode: fields.startMode,
    startAt: fields.startMode === 'SCHEDULED' && bangkokStart(fields.date, fields.time),
    durationHours: fields.durationHours,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) body.append(key, value);
  }
  for (const side of PHOTO_SIDES) {
    const photo = photos[side];
    if (photo) body.append(`${side}Image`, photo);
  }
  return body;
}
