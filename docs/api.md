# FinanceFlow REST API Specification

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP Authorization header:
```
Authorization: Bearer <access_token>
```

Standard Response Format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Standard Error Format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Log in and receive access/refresh tokens | No |
| `POST` | `/auth/refresh` | Rotate and issue fresh access token | No (Cookie/Body) |
| `POST` | `/auth/logout` | Revoke active refresh token | Yes |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes |
| `PUT` | `/auth/profile` | Update name or preferred currency | Yes |
| `PUT` | `/auth/change-password` | Update account password | Yes |

---

## 2. Transactions (`/api/transactions`)

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/transactions` | `page`, `limit`, `type`, `categoryId`, `search`, `startDate`, `endDate`, `sortBy`, `sortOrder` | List paginated transactions |
| `POST` | `/transactions` | - | Create new transaction |
| `GET` | `/transactions/:id` | - | Retrieve single transaction |
| `PUT` | `/transactions/:id` | - | Update transaction |
| `DELETE` | `/transactions/:id` | - | Delete transaction |

---

## 3. Categories (`/api/categories`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List user custom & default categories |
| `POST` | `/categories` | Create custom category |
| `PUT` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Remove custom category |

---

## 4. Budgets (`/api/budgets`)

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/budgets` | `month`, `year` | List category budgets with spent/remaining metrics |
| `POST` | `/budgets` | - | Set monthly category limit |
| `PUT` | `/budgets/:id` | - | Modify budget amount |
| `DELETE` | `/budgets/:id` | - | Delete budget limit |

---

## 5. Savings Goals (`/api/goals`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/goals` | List all savings goals with progress % |
| `POST` | `/goals` | Create new target goal |
| `GET` | `/goals/:id` | Get specific goal |
| `PUT` | `/goals/:id` | Update goal details |
| `POST` | `/goals/:id/adjust` | Deposit or withdraw money (`operation: ADD \| WITHDRAW`) |
| `DELETE` | `/goals/:id` | Delete savings goal |

---

## 6. Subscriptions (`/api/subscriptions`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/subscriptions` | List subscriptions with normalized costs and metrics |
| `POST` | `/subscriptions` | Create recurring subscription |
| `PUT` | `/subscriptions/:id` | Update subscription |
| `DELETE` | `/subscriptions/:id` | Delete subscription |

---

## 7. Dashboard & Analytics (`/api/dashboard`, `/api/analytics`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Total balance, monthly summary, chart series, recent items |
| `GET` | `/analytics` | Month-over-month comparisons, daily average, projections, smart insights |

---

## 8. Reports & Notifications (`/api/reports`, `/api/notifications`)

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/reports` | `range`, `startDate`, `endDate` | Statement summary, breakdowns, ledger |
| `GET` | `/reports/export/csv` | `range`, `startDate`, `endDate` | Download CSV spreadsheet |
| `GET` | `/notifications` | - | Real-time budget and bill alerts |
