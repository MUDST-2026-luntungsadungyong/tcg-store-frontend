import { useEffect, useState } from 'react';
import type { ListingPhotoFiles } from '../api/listings';
import { imageFileError } from '../model/imagePolicy';

export interface PhotoEditorValue {
  front: string;
  back: string;
  additional: string[];
  files: ListingPhotoFiles;
}
export const emptyPhotos = (): PhotoEditorValue => ({ front: '', back: '', additional: [], files: {} });

function PhotoPreview({ file, url, label }: { file?: File | null; url?: string; label: string }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  const src = file ? preview : url;
  return src ? <img src={src} alt={label} className="h-32 w-full rounded-lg bg-bg-input object-contain" /> : <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-text-muted">No photo selected</div>;
}

export function ListingPhotoEditor({ value, onChange, disabled }: { value: PhotoEditorValue; onChange: (value: PhotoEditorValue) => void; disabled?: boolean }) {
  const [error, setError] = useState('');
  const accept = 'image/jpeg,image/png,image/webp';
  const select = (side: 'front' | 'back', file?: File) => {
    if (!file) return;
    const issue = imageFileError(file);
    setError(issue || '');
    if (!issue) onChange({ ...value, files: { ...value.files, [side === 'front' ? 'frontImage' : 'backImage']: file } });
  };
  return <fieldset disabled={disabled} className="space-y-4 border-t border-white/10 pt-5">
    <legend className="px-0 text-base font-semibold">Actual card photos</legend>
    <p id="listing-photo-help" className="text-sm text-text-secondary">Photograph this card, including its corners and any damage. JPG, PNG or WebP; up to 5 MiB each.</p>
    <div className="grid gap-4 sm:grid-cols-2">{(['front', 'back'] as const).map(side => {
      const fileKey = side === 'front' ? 'frontImage' : 'backImage';
      return <div key={side} className="min-w-0 space-y-2">
        <label htmlFor={`seller-listing-${side}-image`} className="block text-sm font-medium">{side === 'front' ? 'Front photo' : 'Back photo'}</label>
        <PhotoPreview file={value.files[fileKey]} url={value[side]} label={`${side} photo preview`} />
        <input id={`seller-listing-${side}-image`} type="file" accept={accept} aria-describedby="listing-photo-help" className="block w-full min-w-0 text-sm text-text-secondary file:mr-2 file:rounded-lg file:border-0 file:bg-bg-elevated file:px-3 file:py-2 file:text-text-primary" onChange={event => { select(side, event.target.files?.[0]); event.target.value = ''; }} />
        {(value.files[fileKey] || value[side]) && <button type="button" className="min-h-9 text-sm text-brand-blue hover:underline" onClick={() => onChange({ ...value, [side]: '', files: { ...value.files, [fileKey]: null } })}>Remove {side} photo</button>}
      </div>;
    })}</div>
    <div className="space-y-2">
      <label htmlFor="seller-listing-additional-images" className="block text-sm font-medium">Additional photos (up to 4)</label>
      <input id="seller-listing-additional-images" type="file" multiple accept={accept} className="block w-full text-sm text-text-secondary file:mr-2 file:rounded-lg file:border-0 file:bg-bg-elevated file:px-3 file:py-2 file:text-text-primary" onChange={event => {
        const files = Array.from(event.target.files ?? []);
        const issue = files.map(imageFileError).find(Boolean) || (value.additional.length + (value.files.additionalImages?.length ?? 0) + files.length > 4 ? 'Add up to 4 additional photos.' : '');
        setError(issue || '');
        if (!issue) onChange({ ...value, files: { ...value.files, additionalImages: [...value.files.additionalImages ?? [], ...files] } });
        event.target.value = '';
      }} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{value.additional.map((url, index) => <div key={url}><PhotoPreview url={url} label={`Additional photo ${index + 1}`} /><button type="button" aria-label={`Remove saved additional photo ${index + 1}`} className="min-h-9 text-sm text-brand-blue" onClick={() => onChange({ ...value, additional: value.additional.filter((_, i) => i !== index) })}>Remove</button></div>)}{value.files.additionalImages?.map((file, index) => <div key={`${file.name}-${index}`}><PhotoPreview file={file} label={`New additional photo ${index + 1}`} /><button type="button" aria-label={`Remove new additional photo ${index + 1}`} className="min-h-9 text-sm text-brand-blue" onClick={() => onChange({ ...value, files: { ...value.files, additionalImages: value.files.additionalImages?.filter((_, i) => i !== index) } })}>Remove</button></div>)}</div>
    </div>
    {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
  </fieldset>;
}
