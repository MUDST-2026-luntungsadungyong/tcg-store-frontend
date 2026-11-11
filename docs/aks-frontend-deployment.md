# Frontend deployment: Cloudflare Pages (11 November 2026)

The live frontend is React/Vite on Cloudflare Pages at <https://tcg-store-frontend.pages.dev/>. The production branch is `main`. It is no longer served from AKS. The AKS `tcg-store-frontend` Kubernetes Deployment is a legacy-named **Caddy API gateway**; its `/` returns 404 and it proxies `/api/*` to the backend.

## How release works

A merge to frontend `main` triggers Cloudflare Pages Git integration. The configured build command is `npm ci --legacy-peer-deps && npm run build`, and the output directory is `dist`. Set build variables `VITE_API_BASE_URL=/api` and `VITE_ENABLE_MOCK_API=false`. Set the **Production runtime** variable `API_ORIGIN=https://tcgstore-demo-2026-11.malaysiawest.cloudapp.azure.com`. The Pages Function in `functions/api/[[path]].ts` forwards same-origin `/api` calls and WebSocket upgrades to that AKS HTTPS origin. The backend AKS deployment is handled by the backend repository's `.github/workflows/deploy-aks-demo.yml`, not by the frontend workflow.

## Custom domain

The actual GoDaddy domain is `tcgmythix.store`. Its nameservers are being moved to Cloudflare. Once the Cloudflare zone becomes Active, add `tcgmythix.store` and `www.tcgmythix.store` in Workers & Pages → `tcg-store-frontend` → Custom domains. Cloudflare Pages creates the correct DNS target. Do not point the apex to the AKS Load Balancer IP. Keep email MX/TXT records in Cloudflare DNS when email service is configured. Verify HTTPS home page, a deep SPA route, and `/api/health` at the custom host.

The backend's `APP_CORS_ALLOWED_ORIGINS` must include the actual apex and www origins. See the backend `docs/aks-operator-guide-th.md` for complete AKS operation, CI/CD, monitoring, secrets and cost guidance.

## Quick checks

```powershell
Invoke-WebRequest https://tcg-store-frontend.pages.dev/
Invoke-RestMethod https://tcg-store-frontend.pages.dev/api/health
```

In Cloudflare Pages → Deployments, check the latest `main` deployment and build log. In Settings → Variables and secrets, check `API_ORIGIN` under Production. In Custom domains, check that each host is Active. A 503 saying `API origin is not configured` means the Pages Function did not receive `API_ORIGIN`; a 502 means the upstream request failed. Check the AKS API gateway and backend next.
