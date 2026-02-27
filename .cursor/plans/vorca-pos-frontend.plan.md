---
name: vorca-pos-frontend-plan
overview: Frontend UI/UX delivery plan for Vorca POS focused on role-based workflows using shadcn/ui as base system and Aceternity UI for premium interactive sections.
todos: []
isProject: false
---

# Vorca POS Frontend UI/UX Plan

## Scope

- Deliver role-focused interfaces for Owner, Manager, and Cashier personas.
- Optimize cashier speed and error prevention in daily operations.
- Ensure consistent, accessible, responsive UX across critical flows.
- Use `shadcn/ui` as the default component foundation and `Aceternity UI` selectively for high-impact visual/interactive modules.

## UI Stack Strategy (shadcn + Aceternity)

- **Base system (`shadcn/ui`)**:
  - Forms, dialogs, sheets, tables, command/search, dropdowns, tabs, toasts.
  - Data-heavy and operational screens (cashier, inventory, employee tools).
- **Enhancement layer (`Aceternity UI`)**:
  - Dashboard hero sections, animated KPI cards, spotlight/empty states, feature explainers.
  - Apply only where it improves comprehension without slowing operational flows.
- **Integration rule**:
  - If a screen is high-frequency transactional, prioritize shadcn simplicity and speed.
  - If a screen is insight/overview oriented, allow Aceternity visual patterns.
- **Dependency baseline (from Aceternity docs context)**:
  - Ensure `motion`, `clsx`, and `tailwind-merge` utility compatibility.
  - Keep shared `cn()` utility in `lib/utils.ts` for consistent class composition.

## UX Principles

- Operational clarity over visual complexity.
- Minimize clicks for high-frequency cashier tasks.
- Surface alerts and exceptions early for managers.
- Keep analytics digestible with progressive drill-down for owners.
- Every view must support loading, empty, error, and success states.

## Information Architecture

- Route groups:
  - `app/(auth)/...`
  - `app/(cashier)/pos/...`
  - `app/(manager)/inventory/...`
  - `app/(owner)/dashboard/...`
- Shared shell:
  - role-aware side navigation
  - global search/quick actions
  - alert center and user/session controls
- Domain component layers:
  - `components/ui/` primitives
  - `components/domain/` POS-focused composites
  - `lib/` formatters, validation mappers, view utilities

## Core Screen Flows

- Cashier:
  - product lookup
  - cart and quantity editing
  - discount and payment state transitions
  - receipt/confirmation
  - returns and exchanges
- Manager:
  - inventory overview with low-stock emphasis
  - transfer request creation and status tracking
  - stock adjustment history and accountability
  - shift and staff summary touchpoints
- Owner:
  - KPI dashboard across locations
  - trend comparisons by period/location
  - top product/location performance cards
  - reporting export triggers

## Design System Foundation

- Tokens: color roles, typography scale, spacing rhythm, radius, elevation.
- Components (shadcn-first): button, input, select, table, card, badge, dialog, drawer, tabs, toast.
- Aceternity component zones:
  - analytics hero header
  - KPI visual cards
  - contextual onboarding/empty-state blocks
- Patterns:
  - dense data tables with filters/sort/pagination
  - chart containers with consistent legends and date range controls
  - form validation messaging and confirm/cancel interaction standards

## Accessibility and Responsiveness

- Keyboard-first navigation for checkout workflow.
- Focus management and shortcut strategy for high-throughput operation.
- WCAG-focused checks: contrast, semantic landmarks, labels, error associations.
- Layout optimization for desktop POS terminals and tablet usage.

## Frontend Performance

- Use Next.js App Router streaming and Suspense boundaries for perceived speed.
- Define loading skeletons at route and widget levels.
- Budget initial render for key operational pages and monitor regressions.

## Frontend Phases

### Phase 1 - UX Foundations (Week 1-2)

- Replace starter app UI with role gateway and base shell.
- Initialize `shadcn` setup (`components.json`, aliases, theme variable strategy).
- Establish design tokens and primitive component library.
- Define Aceternity usage boundaries and performance guardrails per route type.
- Define route map and navigation hierarchy for all personas.

### Phase 2 - Core Operations UX (Week 3-5)

- Implement cashier checkout and return flows.
- Implement manager inventory and transfer flows.
- Implement owner dashboard baseline and reporting entry points.
- Keep cashier/manager flows on shadcn components only (no non-essential animation).

### Phase 3 - Advanced UX Modules (Week 6-8)

- Loyalty interactions and customer context panels.
- Employee and shift UX modules.
- Notification center with severity/action states.
- Apply Aceternity patterns to owner-facing insights and explanatory UI blocks.

### Phase 4 - Polish and Validation (Week 9-12)

- Accessibility and responsive hardening.
- Microcopy and state consistency pass.
- Task-based usability validation and iteration.

## Acceptance Gates

- Gate 1: role-aware navigation + design system baseline complete.
- Gate 2: cashier, manager, and owner core tasks navigable end-to-end.
- Gate 3: advanced modules integrated with consistent interaction patterns.
- Gate 4: no major accessibility/usability blockers for pilot release.
- Gate 5: shadcn + Aceternity composition remains consistent and performance-safe on target devices.

