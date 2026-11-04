# US-20 test and CI decisions

Decision owner: Codex. These are implementation decisions made under the user's authorization on 2026-11-05.

- Keep business Cypress journeys on the in-browser mock API and add API-mode HTTP fixtures under `cypress/e2e/design`. The latter verify actual multipart boundary/file-field serialization and server-validation errors; neither substitutes for a real storage integration journey.
- Add actual front/back photo uploads to the opt-in live staging journey regardless of catalog rarity. A cheap listing can still require photos when rarity is special or unknown. The test uses a deterministic valid PNG and disposable staging accounts; it remains opt-in because it creates real data.
- Existing high-price inventory and seller-edit journeys retain their prices and business assertions. They receive complete actual-photo fixtures rather than lowering prices to avoid the policy.
- Run the new policy suite through the existing Cypress spec glob. Do not add a separate mock-only CI job or skip policy cases.
- Derive fresh/repeat Flyway row counts from versioned migration files while asserting the US-20 migration exists and its columns/table preserve legacy listings without fabricating actual photos or grading metadata.
- Retain failure screenshots from the existing CI E2E job.

Coverage: optional Common/NM/499, exactly500, played/graded/special/unknown, missing one side, removal/replacement, additional-photo limits, invalid/oversized file, hidden draft and publish gate, multipart request, HTTP validation failure, live upload/reservation journey. API-mode gallery coverage runs at desktop/mobile widths and verifies seller selection, front/back switching, 2.5x transform, seller-supplied grading disclaimer, legacy no-photo state, and overflow.

Execution evidence is recorded by the coordinating agent after all implementation parts are integrated. A passing mock or HTTP-fixture suite is not evidence that Neon/storage/deployment has passed.

## Validation ledger

- Focused business policy: 9 passing, 0 failing, 0 skipped (local Electron).
- Existing seller inventory/edit regression: 6 passing after deterministic fixture initialization. Initial helper wrote an empty listing array before application seed initialization, which hid catalog/inventory; explicit original-spec fixtures fixed the test setup without changing product logic or assertions.
- API-mode HTTP suite: 4 passing after replacing a PNG fixture with bad IDAT CRC by a generated deterministic valid 2×3 PNG. `Pillow.load()` alone did not catch CRC corruption; `Image.verify()` now validates the fixture. Gallery assertions remain intact.
- New/affected Cypress files pass standalone TypeScript checking. Existing support command declarations needed an explicit module export and the correct `Chainable<AUTWindow>` return type for `loginByMock`.
- Both workflow YAML files parse; dynamic migration count and explicit US-20 upgrade/data-preservation assertions are present.
- Full-suite validation follows after integration; see coordinating agent's final execution record. Initial sandbox launch could not find the installed Cypress cache; explicit cache selection still could not launch Electron in sandbox. Authorized elevated browser and Vite processes in the same network context run successfully. No computer-use tooling was used.

## Integrated verification (2026-11-05)

- Full frontend unit run: 307 passing across 63 files. The later official-art/preflight/gallery review tests passed 8/8, including the new provenance helper.
- Lint passed with existing warnings. Production type-check/build passed after removing an unsupported test-only `exact` option from a role query; the role name remains exact by default.
- Full business Cypress initially had 134 passing, one failing and one existing opt-in live-staging pending case. The failure caught removal of genuine Card Text while fabricated metadata was removed; Card Text was restored without a fabricated fallback. Seller grading assertions moved to the per-offer gallery and retain exact company/grade/certification checks plus the unverified disclaimer. The affected card-detail suite then passed 13/13.
- Complete API-mode design suite passed 12/12 at desktop/mobile sizes. A coherent final full business rerun and GitHub CI results are tracked in the PR rather than inferred from focused runs.
- Real HTTP API plus object storage validation was executed by the backend companion work against an isolated local PostgreSQL database; all five unique managed objects were removed afterward. These are distinct results from the browser's mock/HTTP-fixture checks.

Final local business rerun: 28 specs, 136 cases, 135 passing, zero failing, one existing opt-in live-staging pending. Complete API-mode design suite: 12/12. A final HTTP fixture correction uses a unique created listing ID and the real HIGH_PRICE policy reason; the unchanged four cases passed without the duplicate-key warning. Live-staging was not run. GitHub CI results are recorded on PR191 for the exact commit under review.
