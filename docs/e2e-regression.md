# Cypress full regression

## Run

Run the CI-equivalent regression from the frontend repository root:

```sh
npm run test:e2e:full
```

`scripts/run-cypress-regression.mjs` starts and stops two local Vite processes, waits for each server to be ready, then runs the same two Cypress partitions used by CI:

- Business and browser-mock specs use `http://localhost:3000` with `VITE_ENABLE_MOCK_API=true`; design specs are excluded.
- Design HTTP-fixture specs use `http://localhost:3001` with `VITE_ENABLE_MOCK_API=false`.

The CI workflow calls this same npm script. It starts no second set of servers. Cypress failure screenshots are written beneath `cypress/screenshots/` and uploaded by CI as `cypress-failure-evidence`.

`npm run test:e2e` remains a direct Cypress command for focused work against a server that the developer has started in the correct mode. It does not configure or start the two-server regression environment.

## Why the previous full command was misleading

Previously `test:e2e:full` was just `cypress run`. It ran business specs and design HTTP-fixture specs on one Vite server, whose default was HTTP mode (`VITE_ENABLE_MOCK_API=false`). The business mock database journeys expect the browser mock adapter and local storage fixtures. Running them in HTTP mode made their expected local data/API setup absent; meanwhile design specs did not get their dedicated origin/mode. That produced false regression signals from an invalid test environment.

The earlier single-server run reported 25 failed cases in seven specs:

| Spec | Failed cases |
| --- | ---: |
| `03_cart_and_checkout_flow.cy.ts` | 1 |
| `10_collection_and_leaderboard.cy.ts` | 1 |
| `11_seller_order_management.cy.ts` | 9 |
| `13_buyer_vouchers_and_checkout.cy.ts` | 2 |
| `17_actual_card_photos.cy.ts` | 9 |
| `19_voucher_admin_buyer_sync.cy.ts` | 1 |
| `admin/04_seller_update_product.cy.ts` | 2 |
| **Total** | **25** |

All seven specs passed when run under the matching server mode and origin. This classifies those failures as test-environment mismatch, not product defects.

## Observed CI-mode baseline

On the main-based Phase 2 worktree, with the base/main `package-lock.json`, the runner completed successfully:

- Business partition: 38 specs, 185 tests; 182 passed, 0 failed, 3 pending, 0 skipped. The pending tests are opt-in live/staging coverage.
- Design HTTP-fixture partition: 7 specs, 21 tests; 21 passed, 0 failed, 0 pending, 0 skipped.
- Combined: 45 specs, 206 tests; 203 passed, 0 failed, 3 pending, 0 skipped.

The same command completed on Windows, including startup and cleanup of both child Vite processes. Vite logged existing React Router hydration warnings and one duplicate-key console warning in the admin voucher tests; neither caused a test failure.
