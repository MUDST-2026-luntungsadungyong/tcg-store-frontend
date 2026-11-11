import { useState } from 'react';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
  alt?: string;
}

/** A decorative avatar by default; pass alt when the image itself needs a label. */
export function Avatar({ name, src, className = '', alt = '' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initial = name?.trim().charAt(0).toUpperCase() || 'M';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-brand-blue/20 font-semibold text-brand-blue ${className}`} aria-hidden={alt ? undefined : true}>
      {src && src !== failedSrc ? <img src={src} alt={alt} className="size-full object-cover" onError={() => setFailedSrc(src)} /> : <span aria-label={alt || undefined}>{initial}</span>}
    </span>
  );
}
