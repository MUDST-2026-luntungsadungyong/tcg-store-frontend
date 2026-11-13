import { useEffect } from 'react';
import { applyMetadata, type PageMetadata } from './metadata';

/** Metadata only; does not render or change page layout. */
export function usePageMetadata(value: PageMetadata) {
  const { title, description, path, noindex, image } = value;
  useEffect(() => {
    applyMetadata({ title, description, path, noindex, image });
  }, [title, description, path, noindex, image]);
}
