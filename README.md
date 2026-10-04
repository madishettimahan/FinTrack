# 💰 FinanceFlow — Production-Ready Personal Finance Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-cyan.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-indigo.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6+-darkblue.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-teal.svg)](https://tailwindcss.com/)

A modern, secure, and production-quality Personal Finance Management system built from scratch with a React + Vite frontend, Express + TypeScript backend, PostgreSQL database with Prisma ORM, JWT authentication with token rotation, multi-tenant data isolation, and comprehensive test coverage.

Designed for full-stack engineering portfolios, cybersecurity demonstration, and enterprise-grade code quality.

---

## 📸 Key Features

### 1. 🔐 Security & Identity
- **JWT Authentication Flow**: Short-lived Access Tokens (15 min) + securely hashed Refresh Tokens (7 days) with cryptographically unique `jti` nonces.
- **Salted Password Hashing**: Argon2 / bcrypt with minimum 10 rounds, enforcing 8+ characters with uppercase, lowercase, numbers, and special symbols.
- **Strict Multi-Tenant Isolation**: Every database query scopes transactions, budgets, subscriptions, and goals to `userId = authenticatedUser.id`.
- **Automated Audit Logging**: Critical security actions (login, registration, password change, deletion) recorded in `AuditLog` table with IP, User-Agent, and timestamps.
- **API Hardening**: `helmet` headers, strict CORS policy, Zod runtime schema validation, and Express rate limiting (`express-rate-limit`).

### 2. 📊 Executive Dashboard
- **Dynamic Cash Flow Cards**: Cumulative Total Balance, Total Income, Total Expenses, and Monthly Net Savings formatted to user currency (`USD $`, `INR ₹`, `EUR €`, `GBP £`).
- **Interactive Recharts Visualizations**:
  - 6-month dual-bar Income vs. Expense cash flow.
  - Expense-by-category Donut chart with percentages.
  - Category budget utilization meters (<80% Safe, 80-100% Warning, >100% Exceeded).
  - Target savings goal progress bars with milestone badges.
- **Recent Transactions Ledger**: Instant visibility of latest financial activities.

### 3. 💳 Transaction Management
- Categorize cash flows as `INCOME` or `EXPENSE`.
- Support for multiple payment methods: `CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `UPI`, `OTHER`.
- Search, filter by category/type/date-range, and server-side pagination.
- Full CRUD with modal dialogs and destructive confirmation guards.

### 4. 🎯 Budget Management
- Monthly category spending caps with dynamic status tracking (`SAFE`, `WARNING`, `EXCEEDED`).
- Historical month-by-month budget navigator.
- Visual spent-vs-cap progress with over-budget alerts.

### 5. 🏆 Savings Goals
- Target goal creation with deadlines and descriptions.
- Deposit and withdrawal fund adjustments.
- Automated completion status and days-remaining countdown.

### 6. 🔄 Recurring Subscriptions
- Track recurring software, bills, and memberships across billing intervals (`WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`).
- Normalized monthly and annual cost calculations.
- Intelligent **"Due Soon"** warning flags for renewals due within 7 days.

### 7. 📈 Financial Reports & Export
- Customizable periods: *This Month, Last Month, Last 3 Months, Last 6 Months, This Year, Custom Range*.
- Summary breakdowns by category and payment method.
- **One-click CSV Data Export** and **Print / PDF Statement Generation**.

### 8. 💡 Smart Analytics & Insights
- Month-over-month percentage delta comparisons.
- Daily average spending pace and month-end expenditure projections.
- Automated descriptive spending alerts (largest category, abnormal spikes, budget compliance).

### 9. 🔔 In-App Notifications
- Real-time alerts generated from live financial data for budget thresholds, due bills, and savings milestones.

---

## 🏛️ System Architecture

```text
personal-finance-tracker/
│
├── client/                      # React 18 + Vite Frontend
│   ├── src/
│   │   ├── charts/              # Recharts wrappers (Bar, Donut, Progress)
│   │   ├── components/          # Reusable UI (Modal, ConfirmDialog, Pagination, etc.)
│   │   ├── context/             # AuthContext, CurrencyContext, ToastContext
│   │   ├── hooks/               # useApi, useDebounce
│   │   ├── layouts/             # DashboardLayout (Sidebar, Header), AuthLayout
│   │   ├── pages/               # Dashboard, Transactions, Budgets, Goals, etc.
│   │   ├── services/            # Axios API client with auth interceptors
│   │   └── types/               # TypeScript data models & API contracts
│   └── package.json
│
├── server/                      # Express + Node.js + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Normalized schema (8 models)
│   │   └── seed.ts              # Demo seed data (demo@financeflow.dev)
│   ├── src/
│   │   ├── config/              # Environment & Prisma client setup
│   │   ├── controllers/         # HTTP request/response handlers
│   │   ├── middleware/          # Auth, Validate, RateLimiter, ErrorHandler
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # Core business logic & database queries
│   │   ├── utils/               # JWT helpers, ApiResponse, Error classes
│   │   ├── validators/          # Zod schema definitions
│   │   ├── __tests__/           # Vitest integration & security test suites
│   │   └── app.ts               # Express server configuration
│   └── package.json
│
├── docs/                        # Architecture & API documentation
├── docker-compose.yml           # Multi-container orchestration
├── .env.example                 # Environment variables specification
└── README.md
```

---

## 🗄️ Database Schema (PostgreSQL + Prisma)

The relational schema is fully normalized with foreign key constraints, cascade rules, and compound indexes:

1. **User**: Credentials, preferred currency (`USD`, `INR`, `EUR`, `GBP`), timestamps.
2. **Category**: Per-user and default system categories (`type`: `INCOME` | `EXPENSE`).
3. **Transaction**: `amount`, `type`, `date`, `paymentMethod`, `categoryId`, `userId`.
4. **Budget**: Monthly allowance scoped to `(userId, categoryId, month, year)`.
5. **SavingsGoal**: Target savings goal with `currentAmount`, `targetAmount`, and `deadline`.
6. **Subscription**: Recurring bills with `billingCycle`, `nextPaymentDate`, `status`.
7. **RefreshToken**: Cryptographic token hash with revocation tracking and expiration.
8. **AuditLog**: Security audit trail capturing `userId`, `action`, `ipAddress`, and `userAgent`.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: (or use the built-in embedded runner)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/your-username/personal-finance-tracker.git
cd personal-finance-tracker
```

Copy the environment templates:
```bash
# Server environment
cp .env.example server/.env
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Database Migration & Seeding
```bash
cd server
npx prisma db push
npx tsx prisma/seed.ts
```

*Demo Login Credentials:*
- **Email**: `demo@financeflow.dev`
- **Password**: `Password123!`

### 4. Running the Application

**Option A: Development Mode**
```bash
# In terminal 1 (Backend API on http://localhost:5000)
cd server && npm run dev

# In terminal 2 (Frontend on http://localhost:5173)
cd client && npm run dev
```

**Option B: Docker Compose**
```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.

---

## 🧪 Testing & Verification

The test suite covers authentication, calculations, transaction mutations, and multi-tenant security authorization:

```bash
cd server
npm test
```

### Key Test Suites:
- `auth.test.ts`: User registration, validation checks, duplicate email prevention, login, JWT refresh token rotation, invalid password rejection.
- `security.test.ts`: **Cross-user isolation tests** ensuring User A cannot read, edit, or delete User B's transactions or budgets.
- `transactions.test.ts`: Transaction lifecycle, pagination, type filtering, date filtering, amount sorting.
- `calculations.test.ts`: Verification of financial formulas (net savings, category totals, budget percentages, subscription normalizations).

---

## 🛡️ Security Best Practices

1. **Principle of Least Privilege**: Database queries are strictly scoped to the requesting user ID extracted from verified JWT tokens.
2. **Timing-Safe Operations**: Password hashes are verified using Argon2/bcrypt with standard constant-time comparisons.
3. **Protection against OWASP Top 10**:
   - Injection: Handled via Prisma parameterized prepared statements.
   - Broken Access Control: Zero trust endpoints with mandatory ownership verification.
   - Security Misconfiguration: Helmet enabled, rate limiting enabled, CORS locked to trusted origins.
   - Sensitive Data Exposure: Passwords, salts, and secret keys never returned in API payloads.

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
