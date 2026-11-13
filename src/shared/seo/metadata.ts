export const SITE_URL = 'https://tcgmythix.store';
export const DEFAULT_TITLE = 'Mythix | Trading Card Marketplace · ซื้อขายการ์ด TCG';
export const DEFAULT_DESCRIPTION = 'Discover trading cards and compare seller listings on Mythix. ค้นหาการ์ดสะสมและร้านค้า TCG สำหรับนักสะสมไทยและทั่วโลก';
const DEFAULT_IMAGE = `${SITE_URL}/assets/mythix_logo_white_v3.png`;

export interface PageMetadata {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  image?: string;
}

export function routeMetadata(pathname: string, search = ''): PageMetadata {
  const path = pathname.replace(/\/+$/, '') || '/';
  const common = { path, description: DEFAULT_DESCRIPTION };
  if (path === '/') return { ...common, title: DEFAULT_TITLE };
  if (path === '/cards' || path === '/marketplace') return {
    ...common, path: '/cards', title: 'Trading Cards & Seller Listings | Mythix',
    description: 'Browse trading cards and compare listings from sellers on Mythix. ค้นหาการ์ด TCG และเปรียบเทียบรายการขายจากร้านค้า',
    noindex: Boolean(search),
  };
  if (path === '/collections') return {
    ...common, title: 'Public Card Collections | Mythix',
    description: 'Explore public trading card collections on Mythix. สำรวจคอลเลกชันการ์ดสะสมที่นักสะสมเปิดเผยต่อสาธารณะ',
  };
  // Details stay out of search until their public data has loaded successfully.
  if (/^\/cards\/[^/]+$/.test(path)) return { ...common, title: 'Trading Card | Mythix', noindex: true };
  if (/^\/stores\/[^/]+$/.test(path)) return { ...common, title: 'Seller Store | Mythix', noindex: true };
  // Explicit allowlist prevents account, order verification, private collections,
  // auth tokens and unknown routes from accidentally becoming search results.
  return { ...common, title: 'Mythix', noindex: true };
}

function meta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export function applyMetadata(value: PageMetadata) {
  const canonical = new URL(value.path, SITE_URL);
  // Never expose query parameters (including reset tokens) in metadata.
  canonical.search = '';
  canonical.hash = '';
  const image = value.image && /^https?:\/\//i.test(value.image) ? value.image : DEFAULT_IMAGE;
  const noindex = value.noindex || window.location.origin !== SITE_URL;
  document.title = value.title;
  meta('name', 'description', value.description);
  meta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
  meta('property', 'og:type', 'website');
  meta('property', 'og:site_name', 'Mythix');
  meta('property', 'og:title', value.title);
  meta('property', 'og:description', value.description);
  meta('property', 'og:url', canonical.href);
  meta('property', 'og:image', image);
  meta('name', 'twitter:card', 'summary');
  meta('name', 'twitter:title', value.title);
  meta('name', 'twitter:description', value.description);
  meta('name', 'twitter:image', image);
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = canonical.href;
}
