# Profile redesign and avatar editor

The Profile page shows a social-style header, integrated contact details and a read-only preview of up to six collection entries. Collection management stays on `/collection`. Preview details appear on hover or keyboard focus and can be toggled by touch.

Profile completeness counts six equally weighted saved values: avatar, name, email, phone, LINE and Facebook. The floating percentage expands on hover/focus or tap, respects reduced motion, and links to the missing fields. At 100%, users can dismiss it; dismissal is stored per account in this browser and cleared when the profile becomes incomplete. Contact fields remain optional.

The avatar trigger opens the current photo editor before offering a new upload. Users can drag, zoom, rotate in 90-degree steps and reset. Position sliders provide keyboard alternatives. Saving exports the crop to a 512x512 PNG. No Bio field or schema change is included.

## Backend dependency

- `GET /api/users/profile/avatar`: authenticated image bytes for the current account, with a valid image content type and `Cache-Control: no-store`.
- `POST /api/users/profile/avatar`: authenticated multipart upload using field `image`, returning the updated profile.
- Existing profile/contact PUT payloads stay separate.

The editor loads existing image bytes through the API client, including authentication, rather than requesting the public storage URL with anonymous CORS. This permits canvas export when the storage bucket does not provide browser CORS headers.

## Validation on 2026-10-25

- Full Frontend Vitest: 59 files, 275 passed.
- Frontend build and lint passed.
- Related Cypress HTTP-fixture suites: 21 passed across profile/contact routes, Remember me/session boundaries, responsive layout and photo editing (375px and desktop).
- Backend Maven suite: 218 total, zero failures/errors, two environment-gated tests skipped (PostgreSQL checkout concurrency and live TiDB validation).

Browser inspection used mock accounts. Cypress avatar reads/uploads use fixtures; these results do not establish real user storage upload/read or deployment readiness.

This PR is stacked on `fix/unify-mythix-design-system`, which includes the auth/session changes used during verification. Those auth changes were not yet present in `main` at delivery time. The main CI workflow filters PR bases to main/develop, so a stacked PR may not trigger that workflow.
