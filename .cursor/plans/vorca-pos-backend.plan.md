---
name: vorca-pos-backend-plan
overview: Backend delivery plan for Vorca POS covering API architecture, data consistency, security, and operational readiness.
isProject: false
---

# Vorca POS Backend Plan

## Scope

- Build backend services for multi-location POS operations, synchronization, reporting, and reliability.
- Keep business logic and transactional integrity in API and workers.
- Provide stable contracts for frontend and third-party integrations.

## Target Stack

- Node.js + Express 5 (TypeScript)
- PostgreSQL (primary data store)
- Redis (cache, pub/sub, short-lived state)
- Socket.io (real-time event delivery)
- Background jobs (queue workers for retries/reconciliation)

## Domain Modules

- `auth`: JWT, refresh rotation, admin 2FA support, session audit trails.
- `users_roles`: role and permission policy (Owner, Manager, Cashier, IT Admin).
- `catalog`: products, variants, pricing, tax profiles.
- `inventory`: stock by location, transfers, adjustments, low-stock thresholding.
- `sales`: cart/transaction lifecycle, refunds, exchanges, cross-location returns.
- `loyalty`: customer profile, points accrual/redeem, promotion eligibility.
- `reporting`: aggregate KPIs, period/location dimensions, export job dispatch.
- `notifications`: low-stock and processing failure events.

## API Architecture

- Versioned REST surface: `/api/v1/...`.
- Request/response schema validation on every endpoint.
- Idempotency keys for payment and transaction finalization endpoints.
- Centralized async error middleware with standardized error shape.
- RBAC middleware chain at route-level.
- Health and readiness endpoints for orchestration.

## Data and Consistency Strategy

- Single source of truth: PostgreSQL transactional writes.
- Use explicit transaction boundaries for sale commit, stock decrement, and loyalty update.
- Event outbox pattern for reliable real-time and async processing.
- Reconciliation jobs for sync drift, stale transfers, and failed payment callbacks.
- Conflict policy for multi-location edits (last-write constraints + auditability).

## Real-time and Offline Support

- Emit domain events after successful transaction commit.
- Publish inventory/sales deltas per location channel.
- Support frontend offline replay via server-side dedupe and conflict response codes.
- Maintain acknowledgment and retry semantics for guaranteed delivery paths.

## Security and Compliance

- Password hashing + secure token storage strategy.
- PCI boundary isolation for payment payload handling.
- Audit logs for privileged actions and sensitive data changes.
- Rate limiting and abuse protections on auth/payment endpoints.
- Secret management and dependency vulnerability scanning in CI.

## Backend Phases

### Phase 1 - Core Platform (Week 1-4)

- Service scaffold, module boundaries, configuration validation, logging.
- Auth + RBAC core, base user/location/product schemas, migration pipeline.
- Initial sales transaction endpoint and inventory write path.

### Phase 2 - Multi-location Consistency (Week 5-8)

- Inventory transfer workflows, adjustment ledger, low-stock eventing.
- Socket.io channels and event contracts for location updates.
- Retry queue and reconciliation worker baseline.

### Phase 3 - Business Intelligence and Loyalty (Week 9-12)

- Reporting aggregates and export job API.
- Loyalty points engine and customer-level history trails.
- Employee activity metrics and shift reporting feeds.

### Phase 4 - Hardening and Go-live (Week 13-16)

- Performance optimization, index tuning, load tests.
- Security hardening, 2FA flows, audit completeness checks.
- Operational runbooks, on-call alerts, disaster recovery validation.

## Acceptance Gates

- Gate 1: authenticated transaction API and persisted sales records.
- Gate 2: consistent inventory movement across locations with auditable history.
- Gate 3: reporting and loyalty APIs stable for pilot operations.
- Gate 4: SLO, security, and reliability criteria pass production readiness checks.
