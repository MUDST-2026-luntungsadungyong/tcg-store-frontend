# Azure AKS demo frontend

On 11 November 2026, the frontend and backend run on the same Azure Kubernetes
Service cluster. The temporary HTTPS URL is
<https://tcgstore-demo-2026-11.malaysiawest.cloudapp.azure.com/>. Azure assigns
the DNS label to the Kubernetes `LoadBalancer` Service. Caddy serves the Vite
build and proxies `/api/*` to the backend `ClusterIP` Service. The browser uses
the same origin for pages and API requests. The purchased `tcgmihix.store`
domain can replace the temporary host after GoDaddy access is restored.

The bootstrap image is in the private Azure Container Registry at
`tcgstorecimah2026.azurecr.io/tcg-store-frontend`, pinned by digest in the
Kustomization. The AKS managed identity pulls it without a registry password.
The Caddy container obtained a public Let's Encrypt certificate. Its
certificate storage is an `emptyDir`, suitable for this short demo; a
longer-lived deployment should persist certificates or use cert-manager before
frequent pod replacements.

The `deploy-aks-demo.yml` GitHub workflow is prepared to run after the
main-branch `CI Pipeline` succeeds. It uses GitHub OIDC, builds the same commit
to ACR, pins the resulting digest, deploys the manifests, and checks the public
frontend and API. Its first run must be verified after merge. The identity
`id-tcg-frontend-github-aks-demo` has `AcrPush` on the demo registry and AKS
cluster admin credential access scoped to this demo cluster. No Azure client
secret is stored in GitHub.

## Verify

```powershell
kubectl get deployment,pods,service -n tcg-store-aks-demo -o wide
Invoke-WebRequest https://tcgstore-demo-2026-11.malaysiawest.cloudapp.azure.com/
Invoke-RestMethod https://tcgstore-demo-2026-11.malaysiawest.cloudapp.azure.com/api/health
```

The bootstrap checks returned HTTP 200 for `/` and a SPA route, and the API
reported `UP`, database `Connected`, and 2,002 cards. A request to the login
API with invalid test credentials returned `401 INVALID_CREDENTIALS`, confirming
that the frontend origin can reach the backend through the proxy.

The public Load Balancer and IP add Azure charges. The AKS worker, disk, and
ACR also consume the Azure for Students credit. The Azure budget sends alerts
but is not a hard cap. Delete the dedicated demo resource group after the
submission when the service is no longer needed.
