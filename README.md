# FinTrack
A web-based personal finance management system for tracking transactions, monitoring budgets, and gaining insights into spending habits.
💰 Personal Finance Tracker

A secure, full-stack personal finance management application that helps users track income, expenses, budgets, savings goals, subscriptions, and overall financial activity through an intuitive dashboard.

The project combines full-stack web development with application security, making it suitable for academic projects, portfolios, and placement demonstrations.

---

📌 Problem Statement

Managing personal finances manually can make it difficult to understand spending habits, track budgets, and maintain savings goals.

The Personal Finance Tracker provides a centralized platform where users can securely record financial transactions, monitor spending, manage budgets, track savings, and analyze their financial activity through interactive dashboards.

---

🎯 Objectives

- Track income and expenses in one place
- Monitor monthly spending
- Create and manage budgets
- Track savings goals
- Monitor recurring subscriptions
- Analyze spending patterns
- Generate financial reports
- Export financial data
- Protect user financial information through secure authentication and authorization

---

✨ Features

🔐 Authentication & Security

- User registration and login
- Secure password hashing
- JWT-based authentication
- Protected routes
- User-specific data isolation
- Authorization checks
- Rate limiting
- Input validation
- XSS protection
- SQL injection prevention
- Secure API design
- Audit logging
- Secure error handling

💵 Transaction Management

Users can:

- Add income
- Add expenses
- Edit transactions
- Delete transactions
- Categorize transactions
- Add descriptions and notes
- Select payment methods
- Search transactions
- Filter by category
- Filter by transaction type
- Filter by date range
- Sort transactions
- Paginate transaction results

📊 Financial Dashboard

The dashboard provides:

- Total income
- Total expenses
- Current balance
- Total savings
- Recent transactions
- Monthly income vs expenses
- Expense distribution
- Spending trends
- Budget utilization
- Savings progress

🎯 Budget Management

Users can:

- Create monthly budgets
- Set category-based budgets
- Edit budgets
- Delete budgets
- Monitor spending
- View remaining budget
- Track budget utilization

Budget status:

- 🟢 Safe
- 🟡 Warning
- 🔴 Exceeded

🏦 Savings Goals

Create financial goals such as:

«New Laptop — ₹60,000»

Track:

- Target amount
- Current savings
- Remaining amount
- Completion percentage
- Deadline

🔄 Subscription Tracker

Track recurring expenses such as:

- Streaming services
- Software subscriptions
- Cloud services
- Gym memberships
- Other recurring payments

Supported billing cycles:

- Weekly
- Monthly
- Quarterly
- Yearly

📈 Analytics & Insights

The application generates insights based on transaction data.

Examples:

- Highest spending category
- Monthly spending changes
- Income vs expense trends
- Budget usage
- Savings progress
- Subscription costs

📄 Reports

Generate reports for:

- Current month
- Previous month
- Last 3 months
- Last 6 months
- Current year
- Custom date ranges

Reports include:

- Total income
- Total expenses
- Net savings
- Category-wise expenses
- Transaction summaries

📥 Data Export

Users can export financial data as:

- CSV
- PDF

🔔 Notifications

The application provides notifications for events such as:

- Budget approaching limit
- Budget exceeded
- Upcoming subscription payments
- Savings goal progress

---

🛠️ Tech Stack

Frontend

- React.js
- Vite
- JavaScript / TypeScript
- Tailwind CSS
- React Router
- Axios
- Recharts

Backend

- Node.js
- Express.js
- REST API
- TypeScript

Database

- PostgreSQL
- Prisma ORM

Authentication & Security

- JWT
- Argon2 / bcrypt
- Helmet
- Rate limiting
- Zod / Joi validation

Testing

- Jest / Vitest
- Supertest

Development

- Git
- GitHub
- Docker
- ESLint
- Prettier

---

🏗️ System Architecture

                    ┌──────────────────────┐
                    │       User           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │   Tailwind CSS       │
                    └──────────┬───────────┘
                               │
                         REST API / HTTPS
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Express Backend    │
                    │      Node.js         │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌────────────────┐          ┌────────────────┐
        │ Authentication │          │ Business Logic │
        │ & Security     │          │ & Validation   │
        └────────────────┘          └────────┬───────┘
                                             │
                                             ▼
                                  ┌────────────────────┐
                                  │ Prisma ORM         │
                                  └─────────┬──────────┘
                                            │
                                            ▼
                                  ┌────────────────────┐
                                  │ PostgreSQL         │
                                  │ Database           │
                                  └────────────────────┘

---

🗄️ Database Design

Main entities:

User
 │
 ├── Transactions
 │       └── Category
 │
 ├── Budgets
 │       └── Category
 │
 ├── Savings Goals
 │
 ├── Subscriptions
 │       └── Category
 │
 ├── Notifications
 │
 └── Audit Logs

Main Tables

Table| Purpose
User| Stores user account information
Transaction| Stores income and expense records
Category| Stores transaction categories
Budget| Stores monthly budgets
SavingsGoal| Stores financial goals
Subscription| Stores recurring expenses
Notification| Stores user notifications
AuditLog| Stores security/activity events
RefreshToken/Session| Manages authenticated sessions

---

🔢 Financial Calculations

Balance

Balance = Total Income - Total Expenses

Savings

Savings = Income - Expenses

Budget Remaining

Budget Remaining = Budget Amount - Category Expenses

Budget Usage

Budget Usage % =
(Category Expenses / Budget Amount) × 100

Savings Goal Progress

Savings Goal % =
(Current Amount / Target Amount) × 100

---

🔒 Security

Security is one of the main focuses of this project.

The application implements:

Authentication

- Password hashing
- JWT authentication
- Secure session handling
- Token expiration
- Protected routes

Authorization

Every financial resource belongs to a specific authenticated user.

For example:

User A → Transaction A
User B → Transaction B

User A must never be able to access Transaction B.

API Security

- Helmet
- CORS configuration
- Rate limiting
- Input validation
- Secure HTTP responses
- Centralized error handling

Database Security

Prisma ORM and parameterized queries are used to reduce SQL injection risks.

Input Security

User input is validated and sanitized to reduce risks such as:

- XSS
- SQL injection
- Mass assignment
- Invalid data

Sensitive Information

The application never exposes:

- Password hashes
- JWT secrets
- Database credentials
- Environment variables
- Internal server stack traces

---

📂 Project Structure

personal-finance-tracker/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   └── charts/
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── config/
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── docs/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── LICENSE
└── README.md

---

🚀 Getting Started

Prerequisites

Install:

- Node.js
- npm
- PostgreSQL or Docker
- Git

Check installation:

node --version
npm --version
git --version

---

📥 Installation

Clone the repository:

git clone https://github.com/YOUR_USERNAME/personal-finance-tracker.git

Navigate into the project:

cd personal-finance-tracker

---

📦 Install Dependencies

Frontend:

cd client
npm install

Backend:

cd ../server
npm install

---

🔐 Environment Variables

Create:

server/.env

Use ".env.example" as a template.

Example:

DATABASE_URL="postgresql://username:password@localhost:5432/finance_tracker"

JWT_SECRET="your_secure_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

PORT=5000

CLIENT_URL="http://localhost:5173"

NODE_ENV="development"

⚠️ Never commit ".env" to GitHub.

---

🐘 Database Setup

Start PostgreSQL.

If using Docker:

docker compose up -d

Run Prisma migrations:

cd server
npx prisma migrate dev

Generate Prisma client:

npx prisma generate

Seed development data:

npx prisma db seed

---

▶️ Run the Application

Start backend:

cd server
npm run dev

Start frontend in another terminal:

cd client
npm run dev

The frontend will normally be available at:

http://localhost:5173

The backend will normally run at:

http://localhost:5000

---

🧪 Testing

Run backend tests:

cd server
npm test

Run frontend tests:

cd client
npm test

Run linting:

npm run lint

Run production build:

npm run build

---

🔌 API Endpoints

Authentication

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

Transactions

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id

Categories

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

Budgets

GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id

Savings Goals

GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id

Subscriptions

GET    /api/subscriptions
POST   /api/subscriptions
PUT    /api/subscriptions/:id
DELETE /api/subscriptions/:id

Analytics

GET /api/dashboard
GET /api/analytics
GET /api/reports

---

🖥️ Application Pages

Landing Page
     │
     ├── Login
     └── Register
           │
           ▼
       Dashboard
           │
     ┌─────┼────────────────────────────┐
     │     │             │              │
     ▼     ▼             ▼              ▼
Transactions Budgets   Goals      Subscriptions
     │
     ▼
   Reports
     │
     ▼
  Analytics
     │
     ▼
Settings / Profile

---

📊 Dashboard Preview

The dashboard provides a quick overview of the user's financial situation:

┌─────────────────────────────────────────────────┐
│              PERSONAL FINANCE                    │
├────────────┬────────────┬────────────┬───────────┤
│ Balance    │ Income     │ Expenses   │ Savings   │
│ ₹42,500    │ ₹60,000    │ ₹17,500    │ ₹42,500   │
├────────────┴────────────┴────────────┴───────────┤
│                                                 │
│        Income vs Expense Chart                  │
│                                                 │
├───────────────────────┬─────────────────────────┤
│ Expense Categories    │ Budget Progress         │
│                       │                         │
│ Food                  │ ████████░░ 80%          │
│ Travel                │ █████░░░░░ 50%          │
│ Shopping              │ ███████░░░ 70%          │
└───────────────────────┴─────────────────────────┘

---

🌱 Future Improvements

Potential future features:

- AI-powered expense categorization
- Receipt scanning using OCR
- Bank transaction integration
- Advanced anomaly detection
- Financial forecasting
- Recurring transaction automation
- Email notifications
- Mobile application
- Multi-currency support
- Two-factor authentication
- Biometric authentication
- Advanced security monitoring

---

⚠️ Disclaimer

This application is intended for personal finance tracking and educational purposes.

It does not provide professional financial, investment, tax, or legal advice.

---

🎓 Academic Value

This project demonstrates knowledge of:

- Full-stack development
- React
- REST APIs
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Authentication
- Authorization
- Database design
- Data visualization
- API security
- Secure coding
- Testing
- Git/GitHub
- Docker

---

👨‍💻 Author

Madishetti Mahan

B.Tech — Cybersecurity / Computer Science & Engineering

JNTUH

---

⭐ Project Highlights

«🔐 Security-focused
💻 Full-stack architecture
📊 Data visualization
🗄️ Relational database design
🔑 Secure authentication
📈 Financial analytics
🧪 Automated testing
🐳 Docker-ready
🚀 Deployment-ready»

If you find this project useful, consider giving the repository a ⭐.
