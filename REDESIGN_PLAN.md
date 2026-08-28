# FlowBoost Frontend Redesign Plan

## Design read

Reading this as: a traffic-campaign operations product for growth-minded operators, with a confident editorial-control-room language, leaning toward an ink, paper, and electric-violet system that makes campaign launch and delivery progress feel tangible rather than generic SaaS.

## Direction

The new visual world is **Signal Desk**: a compact campaign control room built from dark ink navigation, warm paper surfaces, hairline rules, sharp data labels, oversized numeric moments, and one electric violet signal color. The existing purple 3D mark remains a recognizable brand cue, but the redesign replaces the current generic card stack with a more deliberate editorial grid and stronger task hierarchy.

The interface will use a warm off-white canvas, deep navy-black rail, violet for active intent, acid green for healthy delivery, amber for attention, and coral for destructive/error states. Typography will pair a distinctive display face for titles with a highly legible sans for UI and a mono face for metrics, IDs, and status data. Motion will be restrained and functional: rail transitions, progress fills, count changes, and launch confirmation—not decorative perpetual animation.

## Arrangement map

| Surface | New arrangement | Primary user action | Important states |
|---|---|---|---|
| Authentication | Split screen: brand statement and compact sign-in panel; the 3D scene becomes a quiet signal field rather than the entire page | Sign in or create an account | Login, signup, validation, Firebase error |
| Dashboard | Header with date/context, hero “traffic pulse” module, metric strip, active campaign rail, recent activity column, one dominant launch CTA | Understand account health and start a campaign | Empty account, active campaigns, low balance |
| Campaigns | Page header + filter chips, featured active campaign card, dense but breathable campaign list, status legend | Find, inspect, pause, or resume a campaign | Active, paused, insufficient, completed, empty |
| New Campaign | Three-stage vertical step rail on desktop / sticky progress bar on mobile; wide form canvas with live cost summary pinned to the side | Configure and launch website traffic | Validation, insufficient balance, launch success |
| Wallet | Balance hero with funding CTA, “how funds move” explainer, transaction ledger with clear credit/debit treatment | Add funds and verify wallet activity | Payment loading, success, failed/cancelled, no transactions |
| Settings | Two-column settings index and focused panels; profile first, notifications second, danger zone isolated | Manage account preferences | Save success/error, password errors, delete confirmation |

## Shared shell

Desktop uses a 240px dark rail with the FlowBoost mark, one “Launch traffic” primary action, five traffic-product destinations (Overview, Campaigns, Wallet, Settings), and a compact account footer. Mobile collapses this into a top bar with a bottom navigation tray. No SMM catalog, reseller, service, or social-engagement navigation exists anywhere.

## Component system

Use a small set of reusable primitives: `SectionHeader`, `MetricTile`, `StatusPill`, `ProgressBar`, `CampaignCard`, `LedgerRow`, `StepRail`, `FieldGroup`, `EmptyState`, `Toast`, and `SignalMark`. Prefer CSS variables and shared class names over page-specific inline styles. All interactive elements require visible focus states, semantic labels, disabled/loading states, and keyboard-safe motion.

## Content rules

The product sells **website traffic campaigns only**. Use “visitors,” “destination,” “traffic source,” “delivery,” “reach,” “spend,” “wallet,” and “campaign.” Remove all references to SMM, reseller services, social packages, followers, likes, and service catalogs. Keep factual existing functionality; do not invent guarantees about traffic quality or conversion performance.

## Build order

1. Establish PRODUCT.md and this arrangement plan.
2. Replace global tokens, typography, reset, and shell layout.
3. Redesign authentication and the 3D signal field.
4. Redesign dashboard and campaign surfaces.
5. Redesign campaign creation without changing its Firestore data contract.
6. Redesign wallet, settings, and shared states.
7. Remove stale SMM language and legacy visual leftovers.
8. Build, run the Impeccable detector once, test desktop/mobile routes, fix one bounded batch, and publish.

## Acceptance criteria

The result must build successfully, preserve existing Firebase/Flutterwave behavior, remain responsive at desktop and mobile widths, contain no SMM-related product language or routes, make “launch traffic” the strongest action, expose balance and delivery status clearly, and avoid generic three-card marketing layouts or unbounded decorative motion.
