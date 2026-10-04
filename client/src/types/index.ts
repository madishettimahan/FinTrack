// ─── User ───
export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Category ───
export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  isDefault: boolean;
}

// ─── Transaction ───
export interface Transaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId: string;
  category: Category;
  description: string;
  date: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
}

// ─── Budget ───
export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  month: number;
  year: number;
}

// ─── SavingsGoal ───
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  isCompleted: boolean;
  daysRemaining: number | null;
  deadline: string | null;
  description: string | null;
}

// ─── Subscription ───
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextPaymentDate: string;
  categoryId: string;
  category: Category;
  status: 'ACTIVE' | 'CANCELLED' | 'PAUSED';
  monthlyNormalized: number;
  yearlyNormalized: number;
  daysUntilDue: number;
  isDueSoon: boolean;
}

export interface SubscriptionData {
  subscriptions: Subscription[];
  metrics: { totalMonthlyCost: number; totalYearlyCost: number; activeCount: number; upcomingCount: number };
}

// ─── Notification ───
export interface AppNotification {
  id: string;
  type: string;
  level: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  link: string;
}

// ─── Dashboard ───
export interface DashboardSummary {
  totalBalance: number; totalIncome: number; totalExpenses: number; totalSavings: number;
  monthIncome: number; monthExpenses: number; monthSavings: number;
}

export interface MonthlyTrend { key: string; name: string; income: number; expense: number; savings: number }
export interface CategoryExpense { categoryId: string; categoryName: string; amount: number }
export interface BudgetUtil { id: string; category: string; budget: number; spent: number; remaining: number; percentage: number }
export interface GoalProgress { id: string; name: string; targetAmount: number; currentAmount: number; percentage: number }

export interface DashboardData {
  summary: DashboardSummary;
  charts: { monthlyTrends: MonthlyTrend[]; expensesByCategory: CategoryExpense[]; budgetUtilization: BudgetUtil[]; savingsProgress: GoalProgress[] };
  recentTransactions: Transaction[];
}

// ─── Analytics ───
export interface Insight { id: string; type: 'info' | 'warning' | 'positive'; title: string; message: string; icon?: string }

export interface AnalyticsData {
  insights: Insight[];
  metrics: {
    currentMonth: { income: number; expense: number; savings: number; savingsRate: number };
    lastMonth: { income: number; expense: number; savings: number };
    dailyAverageSpending: number; projectedMonthEndExpense: number;
  };
}

// ─── Report ───
export interface ReportData {
  period: { range: string; startDate: string; endDate: string };
  summary: { totalIncome: number; totalExpenses: number; netSavings: number; savingsRate: number; transactionCount: number };
  categoryBreakdown: { name: string; type: string; amount: number; percentage: number }[];
  paymentMethodBreakdown: { method: string; amount: number }[];
  transactions: { id: string; date: string; description: string; category: string; type: string; amount: number; paymentMethod: string }[];
}

// ─── Pagination ───
export interface Pagination { total: number; page: number; limit: number; totalPages: number }

// ─── API ───
export interface ApiResponse<T = any> { success: boolean; data?: T; message?: string; errors?: any[] }
