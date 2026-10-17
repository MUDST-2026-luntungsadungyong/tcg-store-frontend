# Staging browser journey

`cypress/e2e/11_live_staging_reservation_journey.cy.ts` is the opt-in real-service test. It does not use `cy.intercept`, mock storage, or mock credentials.

The journey is one serial browser flow because the buyer consumes the listing created by the seller:

1. log in as an approved seller and create a listing from the catalog;
2. log out, log in as a buyer, and prove `/workspace/listings` redirects to `/`;
3. find that card in the marketplace, reserve it, and confirm the reservation.

The checkout API creates a reservation order; this product does not collect a payment method or shipping address yet. Therefore the authorization assertion is the buyer-versus-seller route boundary, not payment authorization.

## Staging workflow contract

Run **Staging browser journey** manually after the backend staging release is accepted. Supply the deployed staging frontend URL, its API URL ending in `/api`, and the exact backend OCI digest (for example `sha256:...`).

The workflow verifies the deployed frontend and staging readiness endpoint, builds the frontend with `VITE_ENABLE_MOCK_API=false` and the supplied API URL, then writes `e2e-release-contract.json` into the compiled frontend and verifies its API URL/digest. Cypress then opens the deployed staging frontend, avoiding a localhost-to-staging CORS bypass. This makes the build/release selection auditable while exercising the real staging origin.

It does not, by itself, prove Kubernetes is running that digest: the current backend public health endpoint deliberately exposes no image digest. The backend staging deployment receipt remains the source of truth for deployment-to-digest proof. Add a protected deployment metadata endpoint or have the staging runner inspect the Deployment image before treating the two as cryptographically verified end-to-end.

Configure these protected staging values before dispatching:

| Name | Kind | Purpose |
| --- | --- | --- |
| `E2E_SELLER_EMAIL`, `E2E_SELLER_PASSWORD` | GitHub environment secrets | approved seller test account |
| `E2E_BUYER_EMAIL`, `E2E_BUYER_PASSWORD` | GitHub environment secrets | buyer test account |
| `E2E_CARD_QUERY` | GitHub environment variable | a catalog query that returns a sellable card |

## Local execution

The spec is skipped unless `CYPRESS_LIVE_E2E=true`; this prevents an ordinary `npm run test:e2e` from creating local or staging records. Start a real backend and database first, then supply dedicated disposable accounts:

```powershell
$env:VITE_ENABLE_MOCK_API = 'false'
$env:VITE_API_BASE_URL = 'http://localhost:8080/api'
$env:VITE_PORT = '4173'
$env:CYPRESS_LIVE_E2E = 'true'
$env:CYPRESS_API_BASE_URL = 'http://localhost:8080/api'
$env:CYPRESS_BACKEND_DIGEST = 'sha256:<64-lowercase-hex-characters>'
$env:CYPRESS_E2E_SELLER_EMAIL = '<approved seller email>'
$env:CYPRESS_E2E_SELLER_PASSWORD = '<seller password>'
$env:CYPRESS_E2E_BUYER_EMAIL = '<buyer email>'
$env:CYPRESS_E2E_BUYER_PASSWORD = '<buyer password>'
$env:CYPRESS_E2E_CARD_QUERY = '<known catalog card>'
npm run dev
```

In a second terminal, run `npm run test:e2e:staging -- --config baseUrl=http://127.0.0.1:4173`. Use disposable accounts: the test intentionally creates a listing and a reservation order.
