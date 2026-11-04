# US-20 frontend decisions

Decision author: Codex, 2026-11-05. The user delegated the remaining implementation choices to Codex. These are agent design decisions, not claims of external certificate verification.

- Keep the existing catalog-driven listing editor. Catalog identity, rarity and official art remain read-only; sellers enter the condition of their physical card and any grading information.
- Add an explicit visibility field. Hidden listings can be saved without required photos; showing a listing requires front and back photos when any policy rule applies. Disable the publish submit button while required photos are incomplete and explain the reason inline. Existing records remain visible until an edit or republish triggers validation.
- Allow four additional photos beyond front and back. Use native file inputs and individually removable previews with file validation before save. Revoke local object preview URLs when replaced or unmounted.
- Preserve the existing compatibility cover image while carrying official and actual photos separately. Never substitute another seller's photos into a listing's gallery.
- Place Official Art and Actual Card Photos in the card gallery. Selecting a seller resets the selected photo and zoom. Show the selected seller's grading details as seller supplied and unverified. Remove the prior fabricated grading, certificate and card metadata defaults.
- Support hover magnification at 2.5x as specified, plus an explicit zoom toggle and horizontal/vertical range controls for touch and keyboard users. Photo load failures and absent legacy photos have explicit states.
- Mirror the server's per-game allowlist in `imagePolicy.ts` for immediate UI feedback and mock API behavior, then request authoritative catalog rules with a 250ms debounce. Scope responses to the complete input snapshot and ignore stale responses. A preflight outage shows an estimate notice, permits hidden drafts, and leaves final validation to the save endpoint. Unknown rarity/game values and legacy seller-created catalog entries require photos rather than silently opting out. Trainer/Energy catalog supertypes use the Pokemon rules.
- Keep legacy single-image API support. Actual photos use separate multipart fields and retained URL semantics; new actual photo URL claims are rejected in the mock just as on the server. Existing owned photos can be retained or explicitly removed.

Validation evidence belongs in the final delivery report: local component/mock tests do not establish deployed storage or Neon migration success.
