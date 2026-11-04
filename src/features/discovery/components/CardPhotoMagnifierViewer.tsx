import { useState } from 'react';
import type { CardListing } from '@/entities/card/model/types';
import { Button } from '@/shared/components/Button';

export function CardPhotoMagnifierViewer({ officialImage, name, offers }: { officialImage: string; name: string; offers: CardListing[] }) {
  const [tab, setTab] = useState<'official' | 'actual'>('official');
  const [sellerId, setSellerId] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [failedSrc, setFailedSrc] = useState('');
  const offer = offers.find(item => item.id === sellerId) ?? offers[0];
  const photos = offer ? [
    { src: offer.actualImageFrontUrl, label: 'Front' },
    { src: offer.actualImageBackUrl, label: 'Back' },
    ...(offer.additionalImageUrls ?? []).map((src, index) => ({ src, label: `Additional ${index + 1}` })),
  ].filter((photo): photo is { src: string; label: string } => Boolean(photo.src)) : [];
  const photo = photos[photoIndex] ?? photos[0];
  const src = tab === 'official' ? officialImage : photo?.src;
  const reset = () => { setZoom(false); setHover(false); setPhotoIndex(0); setOrigin({ x: 50, y: 50 }); };
  return <section aria-label="Card image gallery" className="w-full min-w-0 max-w-md space-y-4">
    <div role="tablist" aria-label="Card image source" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'official' : event.key === 'End' ? 'actual' : tab === 'official' ? 'actual' : 'official';
      setTab(next); reset();
      event.currentTarget.querySelector<HTMLButtonElement>(`#card-photo-tab-${next}`)?.focus();
    }} className="flex border-b border-white/15">{(['official', 'actual'] as const).map(value => <button key={value} id={`card-photo-tab-${value}`} type="button" role="tab" tabIndex={tab === value ? 0 : -1} aria-selected={tab === value} aria-controls="card-photo-panel" className={`min-h-11 flex-1 border-b-2 px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue ${tab === value ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary'}`} onClick={() => { setTab(value); reset(); }}>{value === 'official' ? 'Official Art' : 'Actual Card Photos'}</button>)}</div>
    {tab === 'actual' && offers.length > 0 && <div>
      <label htmlFor="card-photo-seller" className="mb-1 block text-sm text-text-secondary">Photos from seller</label>
      <select id="card-photo-seller" value={offer?.id ?? ''} className="h-11 w-full rounded-xl border border-white/15 bg-bg-input px-3 text-sm" onChange={event => { setSellerId(event.target.value); reset(); }}>
        {offers.map(item => <option key={item.id} value={item.id}>{item.sellerName || `Seller ${item.sellerId}`} · ฿{item.price.toLocaleString()} · {item.condition || 'Condition unspecified'}</option>)}
      </select>
      {offer?.gradingCompany && <p className="mt-2 text-sm text-text-secondary">{offer.gradingCompany} {offer.grade} · Cert {offer.certNumber || 'not supplied'} · Seller supplied, unverified</p>}
    </div>}
    <div id="card-photo-panel" role="tabpanel" aria-labelledby={`card-photo-tab-${tab}`} className="space-y-3">
      {src && failedSrc !== src ? <div style={{ touchAction: tab === 'actual' && zoom ? 'none' : 'auto' }} className={`relative aspect-[3/4] overflow-hidden rounded-xl bg-bg-input ${tab === 'actual' ? 'cursor-zoom-in' : ''}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onPointerMove={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        setOrigin({ x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)) });
      }}>
        <img key={src} src={src} alt={tab === 'official' ? `${name} official art` : `${photo?.label} actual card photo`} onError={() => setFailedSrc(src)} className="h-full w-full object-contain" style={{ transform: tab === 'actual' && (zoom || hover) ? 'scale(2.5)' : undefined, transformOrigin: `${origin.x}% ${origin.y}%` }} />
      </div> : <div role="status" className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-text-secondary">{src ? 'This photo could not be loaded.' : tab === 'actual' ? 'This seller has not uploaded actual card photos.' : 'Official art is not available.'}</div>}
      {tab === 'actual' && photos.length > 0 && <>
        <div className="flex flex-wrap gap-2" aria-label="Actual photo selection">{photos.map((item, index) => <button key={`${item.src}-${index}`} type="button" aria-pressed={photo === item} onClick={() => { setPhotoIndex(index); setZoom(false); setOrigin({ x: 50, y: 50 }); }} className={`min-h-11 rounded-lg border px-3 text-sm ${photo === item ? 'border-brand-blue text-brand-blue' : 'border-white/15 text-text-secondary'}`}>{item.label}</button>)}</div>
        <Button type="button" variant="secondary" size="sm" aria-pressed={zoom} onClick={() => setZoom(value => !value)}>Zoom 2.5×</Button>
        <p className="text-sm text-text-secondary">Hover to inspect, or turn on zoom and drag across the photo. Use the arrow keys below to inspect every corner.</p>
        {zoom && <div className="grid grid-cols-2 gap-4"><label className="text-sm">Horizontal position<input type="range" min="0" max="100" value={origin.x} className="w-full" onChange={event => setOrigin(value => ({ ...value, x: Number(event.target.value) }))} /></label><label className="text-sm">Vertical position<input type="range" min="0" max="100" value={origin.y} className="w-full" onChange={event => setOrigin(value => ({ ...value, y: Number(event.target.value) }))} /></label></div>}
      </>}
    </div>
  </section>;
}
