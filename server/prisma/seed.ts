import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', type: 'EXPENSE' as const },
  { name: 'Travel & Transport', icon: 'Plane', type: 'EXPENSE' as const },
  { name: 'Shopping', icon: 'ShoppingBag', type: 'EXPENSE' as const },
  { name: 'Bills & Utilities', icon: 'Receipt', type: 'EXPENSE' as const },
  { name: 'Education', icon: 'GraduationCap', type: 'EXPENSE' as const },
  { name: 'Entertainment', icon: 'Film', type: 'EXPENSE' as const },
  { name: 'Healthcare', icon: 'Activity', type: 'EXPENSE' as const },
  { name: 'Housing & Rent', icon: 'Home', type: 'EXPENSE' as const },
  { name: 'Other Expense', icon: 'MoreHorizontal', type: 'EXPENSE' as const },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', type: 'INCOME' as const },
  { name: 'Freelance', icon: 'Laptop', type: 'INCOME' as const },
  { name: 'Business', icon: 'TrendingUp', type: 'INCOME' as const },
  { name: 'Investment', icon: 'PieChart', type: 'INCOME' as const },
  { name: 'Gift', icon: 'Gift', type: 'INCOME' as const },
  { name: 'Other Income', icon: 'DollarSign', type: 'INCOME' as const },
];

async function main() {
  console.log('[Seed] Starting database seed...');

  // Clean existing demo user if present
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@financeflow.dev' },
  });

  if (existingUser) {
    console.log('[Seed] Removing existing demo user data...');
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const demoUser = await prisma.user.create({
    data: {
      name: 'Alex Taylor',
      email: 'demo@financeflow.dev',
      passwordHash,
      currency: 'USD',
    },
  });

  console.log(`[Seed] Created Demo User: ${demoUser.email} (ID: ${demoUser.id})`);

  // 2. Create Categories
  const categoryRecords: Record<string, string> = {};
  for (const cat of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
    const created = await prisma.category.create({
      data: {
        userId: demoUser.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        isDefault: true,
      },
    });
    categoryRecords[cat.name] = created.id;
  }

  // 3. Create realistic transactions for the current month and previous 2 months
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const transactionsData = [
    // Current month income
    {
      type: 'INCOME' as const,
      amount: 4500.0,
      categoryName: 'Salary',
      description: 'Monthly Software Engineering Salary',
      date: new Date(currentYear, currentMonth, 1),
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Direct deposit',
    },
    {
      type: 'INCOME' as const,
      amount: 850.0,
      categoryName: 'Freelance',
      description: 'Web development freelance project',
      date: new Date(currentYear, currentMonth, 10),
      paymentMethod: 'UPI',
      notes: 'Client invoice paid',
    },
    {
      type: 'INCOME' as const,
      amount: 175.5,
      categoryName: 'Investment',
      description: 'Quarterly dividend payout',
      date: new Date(currentYear, currentMonth, 15),
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Index fund distributions',
    },

    // Current month expenses
    {
      type: 'EXPENSE' as const,
      amount: 1400.0,
      categoryName: 'Housing & Rent',
      description: 'Apartment monthly rent',
      date: new Date(currentYear, currentMonth, 1),
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Apartment 4B',
    },
    {
      type: 'EXPENSE' as const,
      amount: 125.4,
      categoryName: 'Food & Dining',
      description: 'Trader Joe’s weekly groceries',
      date: new Date(currentYear, currentMonth, 3),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 68.2,
      categoryName: 'Food & Dining',
      description: 'Dinner with coworkers at Bistro',
      date: new Date(currentYear, currentMonth, 6),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 110.0,
      categoryName: 'Bills & Utilities',
      description: 'Electric and water utility bill',
      date: new Date(currentYear, currentMonth, 8),
      paymentMethod: 'DEBIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 45.0,
      categoryName: 'Travel & Transport',
      description: 'Gas station refill',
      date: new Date(currentYear, currentMonth, 11),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 89.99,
      categoryName: 'Shopping',
      description: 'Running shoes on sale',
      date: new Date(currentYear, currentMonth, 14),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 32.5,
      categoryName: 'Entertainment',
      description: 'IMAX Cinema tickets',
      date: new Date(currentYear, currentMonth, 18),
      paymentMethod: 'DEBIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 95.0,
      categoryName: 'Healthcare',
      description: 'Dental checkup & cleaning co-pay',
      date: new Date(currentYear, currentMonth, 20),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 145.8,
      categoryName: 'Food & Dining',
      description: 'Whole Foods market groceries',
      date: new Date(currentYear, currentMonth, 22),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },

    // Last month transactions
    {
      type: 'INCOME' as const,
      amount: 4500.0,
      categoryName: 'Salary',
      description: 'Monthly Software Engineering Salary',
      date: new Date(currentYear, currentMonth - 1, 1),
      paymentMethod: 'BANK_TRANSFER',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 1400.0,
      categoryName: 'Housing & Rent',
      description: 'Apartment monthly rent',
      date: new Date(currentYear, currentMonth - 1, 1),
      paymentMethod: 'BANK_TRANSFER',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 380.0,
      categoryName: 'Food & Dining',
      description: 'Monthly groceries and eating out',
      date: new Date(currentYear, currentMonth - 1, 12),
      paymentMethod: 'CREDIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 180.0,
      categoryName: 'Shopping',
      description: 'Home essentials & desk accessories',
      date: new Date(currentYear, currentMonth - 1, 15),
      paymentMethod: 'DEBIT_CARD',
      notes: null,
    },
    {
      type: 'EXPENSE' as const,
      amount: 140.0,
      categoryName: 'Bills & Utilities',
      description: 'Internet and electric bill',
      date: new Date(currentYear, currentMonth - 1, 19),
      paymentMethod: 'BANK_TRANSFER',
      notes: null,
    },
  ];

  for (const t of transactionsData) {
    const categoryId = categoryRecords[t.categoryName];
    if (categoryId) {
      await prisma.transaction.create({
        data: {
          userId: demoUser.id,
          type: t.type,
          amount: t.amount,
          categoryId,
          description: t.description,
          date: t.date,
          paymentMethod: t.paymentMethod,
          notes: t.notes,
        },
      });
    }
  }

  // 4. Create Monthly Budgets
  const targetMonth = currentMonth + 1;
  const budgetsToCreate = [
    { categoryName: 'Food & Dining', amount: 500.0 },
    { categoryName: 'Housing & Rent', amount: 1450.0 },
    { categoryName: 'Shopping', amount: 250.0 },
    { categoryName: 'Bills & Utilities', amount: 200.0 },
    { categoryName: 'Travel & Transport', amount: 150.0 },
    { categoryName: 'Entertainment', amount: 100.0 },
  ];

  for (const b of budgetsToCreate) {
    const categoryId = categoryRecords[b.categoryName];
    if (categoryId) {
      await prisma.budget.create({
        data: {
          userId: demoUser.id,
          categoryId,
          amount: b.amount,
          month: targetMonth,
          year: currentYear,
        },
      });
    }
  }

  // 5. Create Savings Goals
  const deadline1 = new Date();
  deadline1.setMonth(deadline1.getMonth() + 6);

  const deadline2 = new Date();
  deadline2.setMonth(deadline2.getMonth() + 3);

  const deadline3 = new Date();
  deadline3.setMonth(deadline3.getMonth() + 10);

  await prisma.savingsGoal.createMany({
    data: [
      {
        userId: demoUser.id,
        name: 'Emergency Fund',
        targetAmount: 10000.0,
        currentAmount: 6500.0,
        deadline: deadline1,
        description: '6 months of living expenses safely preserved in high-yield savings.',
      },
      {
        userId: demoUser.id,
        name: 'New M3 MacBook Pro',
        targetAmount: 2500.0,
        currentAmount: 1950.0,
        deadline: deadline2,
        description: 'Workstation upgrade for full-stack engineering and development.',
      },
      {
        userId: demoUser.id,
        name: 'Trip to Tokyo',
        targetAmount: 3500.0,
        currentAmount: 1400.0,
        deadline: deadline3,
        description: 'Autumn vacation to Japan including flights and lodging.',
      },
    ],
  });

  // 6. Create Recurring Subscriptions
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 3);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 14);

  const subscriptions = [
    {
      name: 'Netflix 4K Premium',
      amount: 22.99,
      billingCycle: 'MONTHLY' as const,
      nextPaymentDate: tomorrow,
      categoryName: 'Entertainment',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Spotify Family',
      amount: 16.99,
      billingCycle: 'MONTHLY' as const,
      nextPaymentDate: nextWeek,
      categoryName: 'Entertainment',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Amazon Prime Annual',
      amount: 139.0,
      billingCycle: 'YEARLY' as const,
      nextPaymentDate: nextMonth,
      categoryName: 'Shopping',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Fiber Internet 1Gbps',
      amount: 70.0,
      billingCycle: 'MONTHLY' as const,
      nextPaymentDate: nextMonth,
      categoryName: 'Bills & Utilities',
      status: 'ACTIVE' as const,
    },
  ];

  for (const s of subscriptions) {
    const categoryId = categoryRecords[s.categoryName] || categoryRecords['Other Expense'];
    await prisma.subscription.create({
      data: {
        userId: demoUser.id,
        name: s.name,
        amount: s.amount,
        billingCycle: s.billingCycle,
        nextPaymentDate: s.nextPaymentDate,
        categoryId,
        status: s.status,
      },
    });
  }

  console.log('[Seed] Database seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('DEMO CREDENTIALS:');
  console.log('Email:    demo@financeflow.dev');
  console.log('Password: Password123!');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
