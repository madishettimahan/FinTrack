# FinanceFlow Architecture & Design Decisions

This document outlines the software engineering principles, design patterns, and security mechanisms implemented across FinanceFlow.

---

## 1. High-Level Architectural Pattern

FinanceFlow employs a decoupled **Client-Server Architecture** structured as a monorepo:

```
[ React Client (SPA) ]  <--- HTTPS / JSON API --->  [ Express Backend ]  <--- SQL (Prisma) --->  [ PostgreSQL ]
```

### Key Highlights:
- **Stateless API**: Authentication is completely decoupled from server sessions using signed JWTs.
- **Strict Separation of Concerns**:
  - `Routes`: Map HTTP verb/paths to controller handlers with schema validation and authentication middleware attached.
  - `Controllers`: Parse and format HTTP request/responses; contain zero database logic.
  - `Services`: Encapsulate business logic, computations, and multi-tenant database queries.
  - `Prisma Data Access Layer`: Type-safe schema definitions and parameterized query generation.

---

## 2. Multi-Tenant Authorization & Data Isolation

A key security requirement in financial systems is ensuring that **User A cannot access or manipulate User B's records under any circumstance**.

### Implementation Pattern:
1. Every authenticated HTTP request passes through `auth.ts` middleware.
2. The middleware validates the JWT signature, extracts `userId`, and assigns it to `req.user`.
3. In service operations, every query includes an explicit tenant filter:
   ```typescript
   // Example from transactionService.ts
   const transaction = await prisma.transaction.findFirst({
     where: { id: transactionId, userId },
   });
   ```
4. If a user attempts to update or delete a record that does not belong to their tenant ID, the query returns `null`, triggering a `404 Not Found` or `403 Forbidden` response.

---

## 3. Financial Computation Integrity

1. **Normalized Aggregations**:
   - Total Balance = `SUM(INCOME) - SUM(EXPENSE)`.
   - Savings Rate = `(Net Savings / Total Income) * 100`.
   - Normalized Subscription Monthly Cost:
     - Weekly: `amount * (52 / 12)`
     - Quarterly: `amount / 3`
     - Yearly: `amount / 12`
2. **Deterministic Status Flags**:
   - Budget status is dynamically evaluated on retrieval:
     - `percentage < 80%` => `SAFE`
     - `80% <= percentage <= 100%` => `WARNING`
     - `percentage > 100%` => `EXCEEDED`

---

## 4. Frontend Component & State Architecture

1. **Global Contexts**:
   - `AuthContext`: Centralized login, logout, registration, and user session synchronization.
   - `CurrencyContext`: Multi-currency formatting (`USD`, `INR`, `EUR`, `GBP`) using native `Intl.NumberFormat`.
   - `ToastContext`: Ephemeral, non-blocking toast notifications with auto-dismiss.
2. **Axios Interceptor Pipeline**:
   - Automatically attaches `Authorization: Bearer <token>` to outbound requests.
   - Catches `401 Unauthorized` responses, flushes stale credentials, and routes gracefully to `/login`.
