# Basic SEO

Primary origin: `https://tcgmythix.store`. Existing English interface and all visual design remain unchanged. Descriptions include English and Thai; this does not create separate language versions, so no hreflang alternatives are claimed.

- `index.html` supplies baseline descriptions and social preview tags.
- Route metadata resets on navigation. Public card/store details replace defaults only after loading; account, auth, verification, unknown and private collection URLs default to `noindex`. Non-production origins receive client-side `noindex` as well.
- `/marketplace` shares the `/cards` canonical. Search/filter URLs use `noindex`; no routes or navigation links change.
- Card canonicals use stable catalog IDs when available. No product offers, ratings or price schema are fabricated.
- `public/sitemap.xml` is a small static sitemap of public entry pages. Dynamic card/store enumeration is intentionally deferred; do not add private or unverified URLs or artificial last-modified dates.
- `robots.txt` permits crawling so crawlers can read `noindex`. Authentication remains the security boundary.

## Limits and follow-up

This remains a Vite client-rendered application. Per-route metadata and `noindex` require JavaScript; share crawlers that do not execute JavaScript see the baseline Mythix preview. This is not SSR, a server-level preview exclusion, or a true HTTP 404 implementation. Initial HTML intentionally has no homepage canonical, which would incorrectly canonicalize direct card/store visits before rendering.

After release, verify the domain in Google Search Console, submit `/sitemap.xml`, and inspect rendered homepage/card/store URLs. This PR does not change Cloudflare/DNS settings or provision Search Console. Server-rendered metadata, a full dynamic sitemap and HTTP indexing headers can be separate follow-ups. No ranking or indexing guarantee is made.
