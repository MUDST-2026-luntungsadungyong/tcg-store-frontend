import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Keeps route navigation at the top while preserving intentional hash links. */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelectorAll<HTMLElement>('[data-route-scroll-container]').forEach((container) => {
      container.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [pathname, search, hash]);

  return null;
}
