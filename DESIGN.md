# Mythix UI system

## Direction

Calm, collector-focused dark product UI. Keep the committed Navy/blue/gold palette and Inter + IBM Plex Sans Thai. Card art supplies visual variety; controls and page structure stay predictable. Do not introduce a second UI framework.

## Color roles

| Token | Value | Use |
|---|---|---|
| bg-base | #0B141F | Page canvas |
| bg-surface | #131D2D | Supporting sections/navigation |
| bg-card | #1B2336 | Content cards, dialogs, toast |
| bg-elevated | #212B42 | Raised detail/navigation surfaces |
| bg-input | #18202B | Form/search controls |
| brand-blue | #72A8FF | Primary action, selected state, focus |
| brand-gold | #BFA659 | Collector/brand emphasis |
| status-success/danger/warning | Existing green/red/yellow | Outcome semantics |
| text-primary/secondary/muted | #F3F4F6 / #B8C4D8 / #A6B4CA | Foreground hierarchy |
| border-default | #35435A | Panel boundaries |

Blue filled buttons use Navy text: about 7.72:1 contrast on the solid brand blue. Do not use white text on this light blue. White image mats, rank medals and condition colors are intentional content exceptions, not a light application theme.

## Components and composition

- Shared Button: rounded-xl; sm/min36, md/min44, lg/min48. Primary=blue, secondary=raised Navy, gold=brand emphasis, danger=destructive, ghost=low emphasis. Preserve loading/disabled/focus.
- Input/Select/SearchField/FilterDropdown: 44px height, rounded-xl, bg-input, blue focus; errors take precedence over normal focus and expose accessible descriptions.
- Badge/ConditionLabel: pill geometry. Condition labels retain domain-specific colors.
- PageContainer: max1440, gutters16→24→32, vertical24. Workspace layout owns padding; nested workspace pages override to zero instead of adding a second gutter.
- PageHeader: one h1, description and wrapping actions. Marketing hero is an intentional exception to compact product typography.
- Panel/Toolbar: opaque Navy, subtle border; use shared components in new/refactored pages instead of duplicating raw colors.
- Cards and tables may have domain-specific content. Preserve common surface/type/spacing, semantic table markup and accessible controls. Do not force every dataset into the same columns.
- Existing glass-card/glass-elevated names are compatibility aliases to opaque surfaces; do not add decorative blur behind content panels.

## Feedback

- Toast: lightweight outcome feedback; retain action-specific copy. Titles optional where they add context. Success means completed operation; info means neutral information.
- Field/form error: inline when user must correct a value. Do not replace useful inline errors with disappearing toast.
- FeedbackPopup: acknowledgement/confirmation or next-step actions; preserve destructive confirmation and View collection actions.
- Modal: focus trap, Escape, opener restoration. FeedbackPopup requires an explicit action and traps focus without adding implicit dismissal.
- Toast default4s success/info and8s error/warning; hover/focus pauses remaining time; duration0 is persistent. Max4 visible, identical active notifications deduplicated. Responsive16px gutters, accessible status/alert and dismiss control.
- Layer scale: dropdown60, modal-backdrop1000, modal1010, toast1100. No feature-specific z9999.
- Motion is short and communicates state. Respect prefers-reduced-motion; do not add page-load choreography.

## Test contract

Retain routes, request/payload contracts, field IDs, data-testid values and accessible names unless behavior deliberately changes. Prefer aria-pressed/selected semantics over asserting a historical Tailwind color class. Expected panel colors can be tested where they are an explicit design requirement.

Mock Cypress and live staging are separate evidence. Local visual inspection and build success do not prove deployed reservation/database behavior. Database cleanup for tests is disabled unless CYPRESS_ALLOW_DB_CLEANUP=true on a disposable local database; mock UI journeys must not touch PostgreSQL cleanup.
