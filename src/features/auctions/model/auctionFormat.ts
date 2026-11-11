export const AUCTIONS_PATH = '/workspace/auctions';
export const CANCELLATIONS_PATH = '/admin/auction-cancellation-requests';
export const AUCTION_TIMEZONE = 'Asia/Bangkok';

const moneyFormat = new Intl.NumberFormat('en-TH', { style: 'currency', currency: 'THB' });
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: AUCTION_TIMEZONE,
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function money(amount?: number | string | null) {
  return amount != null && amount !== '' && Number.isFinite(Number(amount))
    ? moneyFormat.format(Number(amount))
    : '—';
}

export function auctionDate(value?: string | number | null) {
  if (value == null || !Number.isFinite(new Date(value).getTime())) return '—';
  return dateFormat.format(new Date(value));
}

export function bangkokStart(date: string, time: string) {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}+07:00`);
  return Number.isFinite(value.getTime()) ? value.toISOString() : null;
}

export function bangkokFields(value?: string | null): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const bangkokIso = new Date(new Date(value).getTime() + 7 * 3_600_000).toISOString();
  return { date: bangkokIso.slice(0, 10), time: bangkokIso.slice(11, 19) };
}

export function countdown(value: string | null, now: number) {
  if (!value) return '—';
  const seconds = Math.max(0, Math.ceil((Date.parse(value) - now) / 1000));
  if (!seconds) return 'Due now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ${minutes % 60}m` : `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export const DURATIONS = [
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
  { value: '120', label: '5 days' },
  { value: '168', label: '7 days' },
] as const;

export function durationLabel(hours?: string | number | null) {
  return DURATIONS.find(({ value }) => value === String(hours))?.label ?? '—';
}

export function matchesAuctionSearch(query: string, ...fields: Array<string | number | null | undefined>) {
  const search = query.trim().toLowerCase();
  return !search || fields.some(field => String(field ?? '').toLowerCase().includes(search));
}
