import { useEffect, useRef, useState } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { profileApi } from '../api/profile';
import { Button } from '@/shared/components/Button';

interface Props {
  file: File | null;
  currentUrl?: string;
  onUpload: () => void;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}

export function AvatarPhotoEditor({ file, currentUrl, onUpload, saving, error, onClose, onSave }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [localError, setLocalError] = useState('');
  const [exporting, setExporting] = useState(false);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const busy = saving || exporting;

  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    const photo = new Image();
    setImage(null);
    setLocalError('');
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    photo.onload = () => { if (active) setImage(photo); };
    const fail = () => { if (active) setLocalError('Unable to open this photo for editing. Please upload a new photo.'); };
    photo.onerror = fail;
    reader.onerror = fail;
    reader.onload = () => { if (active && typeof reader.result === 'string') photo.src = reader.result; };
    if (file) reader.readAsDataURL(file);
    else if (currentUrl) {
      profileApi.getAvatar().then((blob) => {
        if (active) reader.readAsDataURL(blob);
      }).catch(fail);
    }
    return () => {
      active = false;
      reader.onload = null;
      reader.onerror = null;
      photo.onload = null;
      photo.onerror = null;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file, currentUrl]);

  const swapped = rotation % 180 !== 0;
  const width = image ? (swapped ? image.naturalHeight : image.naturalWidth) : 512;
  const height = image ? (swapped ? image.naturalWidth : image.naturalHeight) : 512;
  const scale = Math.max(512 / width, 512 / height) * zoom;
  const maxX = Math.max(0, (width * scale - 512) / 2);
  const maxY = Math.max(0, (height * scale - 512) / 2);
  const x = Math.max(-maxX, Math.min(maxX, position.x));
  const y = Math.max(-maxY, Math.min(maxY, position.y));

  useEffect(() => {
    if (!image) return;
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 512, 512);
    context.save();
    context.translate(256 + x, 256 + y);
    context.rotate(rotation * Math.PI / 180);
    context.scale(scale, scale);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    context.restore();
  }, [image, x, y, scale, rotation]);

  async function save() {
    if (!canvas.current || !image || busy) return;
    setExporting(true);
    setLocalError('');
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob(
        (value) => value ? resolve(value) : reject(new Error('export')), 'image/png',
      ));
      await onSave(new File([blob], 'profile-photo.png', { type: 'image/png' }));
    } catch {
      setLocalError('Unable to prepare your photo. Please try again.');
    } finally { setExporting(false); }
  }

  return (
    <Modal isOpen onClose={() => { if (!busy) onClose(); }} title="Update profile photo" mobileSheet
      footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={!image} isLoading={busy} onClick={() => void save()}>Save photo</Button></>}>
      <div className="space-y-5 p-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">{file ? 'Preview your new photo' : currentUrl ? 'Adjust your current photo' : 'Add a profile photo'}</p>
          <Button variant="secondary" disabled={busy} onClick={onUpload}>Upload new photo</Button>
        </div>
        <div className="relative mx-auto aspect-square w-56 max-w-full overflow-hidden rounded-full bg-bg-base ring-4 ring-brand-blue/30 sm:w-64">
          {!image && <span className="pointer-events-none absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-text-secondary">{!file && !currentUrl ? 'Choose a photo to get started' : localError ? 'Photo unavailable' : 'Loading photo…'}</span>}
          <canvas ref={canvas} width={512} height={512} role="img" aria-label="Cropped profile photo preview" className={`size-full touch-none ${busy ? '' : 'cursor-grab active:cursor-grabbing'}`}
            onPointerDown={(event) => {
              if (busy) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { x: event.clientX, y: event.clientY, startX: x, startY: y };
            }}
            onPointerMove={(event) => {
              if (!drag.current || busy) return;
              const factor = 512 / event.currentTarget.getBoundingClientRect().width;
              setPosition({ x: drag.current.startX + (event.clientX - drag.current.x) * factor, y: drag.current.startY + (event.clientY - drag.current.y) * factor });
            }}
            onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
        </div>
        <p className="text-center text-sm text-text-secondary">Drag to position your photo, or use the controls below.</p>
        <fieldset disabled={busy || !image} className="space-y-3 rounded-2xl border border-border-default p-4">
          <legend className="sr-only">Photo adjustments</legend>
          <label className="block text-sm text-text-primary">Zoom <span className="float-right tabular-nums text-text-secondary">{Math.round(zoom * 100)}%</span><input aria-label="Zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="block h-11 w-full accent-brand-blue" /></label>
          <label className="block text-sm text-text-primary">Horizontal position<input aria-label="Horizontal position" type="range" min={-maxX} max={maxX || 0.01} step="1" value={x} onChange={(event) => setPosition((previous) => ({ ...previous, x: Number(event.target.value) }))} className="block h-11 w-full accent-brand-blue" /></label>
          <label className="block text-sm text-text-primary">Vertical position<input aria-label="Vertical position" type="range" min={-maxY} max={maxY || 0.01} step="1" value={y} onChange={(event) => setPosition((previous) => ({ ...previous, y: Number(event.target.value) }))} className="block h-11 w-full accent-brand-blue" /></label>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="flex-1 gap-2" onClick={() => { setRotation((value) => (value + 90) % 360); setPosition({ x: 0, y: 0 }); }}><RotateCw size={16} aria-hidden="true" />Rotate</Button>
            <Button variant="ghost" className="flex-1 gap-2" onClick={() => { setZoom(1); setRotation(0); setPosition({ x: 0, y: 0 }); }}><RotateCcw size={16} aria-hidden="true" />Reset</Button>
          </div>
        </fieldset>
        <p className="text-xs text-text-secondary">PNG, JPEG or WebP, up to 5 MiB.</p>
        {(localError || error) && <p role="alert" className="text-sm text-status-danger">{localError || error}</p>}
      </div>
    </Modal>
  );
}
