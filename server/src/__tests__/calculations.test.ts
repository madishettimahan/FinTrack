import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/db.js';

describe('Financial Calculations & Precision Verification', () => {
  let token: string;
  let foodCatId: string;
  let salaryCatId: string;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Math Precision User',
        email: `math-${Date.now()}@calc.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    token = userRes.body.data.accessToken;

    const catRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    const cats = catRes.body.data;
    foodCatId = cats.find((c: any) => c.name.includes('Food')).id;
    salaryCatId = cats.find((c: any) => c.name.includes('Salary')).id;

    // Add Income: $5,000.00
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INCOME',
        amount: 5000.0,
        categoryId: salaryCatId,
        date: new Date(currentYear, currentMonth - 1, 5).toISOString(),
        description: 'Salary',
      });

    // Add Food Expense: $350.50
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 350.5,
        categoryId: foodCatId,
        date: new Date(currentYear, currentMonth - 1, 10).toISOString(),
        description: 'Groceries 1',
      });

    // Add another Food Expense: $149.50 (Total Food = $500.00)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 149.5,
        categoryId: foodCatId,
        date: new Date(currentYear, currentMonth - 1, 12).toISOString(),
        description: 'Groceries 2',
      });

    // Create a Budget of $1,000 for Food
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: foodCatId,
        amount: 1000.0,
        month: currentMonth,
        year: currentYear,
      });

    // Create a Savings Goal: target $2,000, current $500 (25%)
    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Investment Fund',
        targetAmount: 2000.0,
        currentAmount: 500.0,
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@calc.test' } },
    });
  });

  it('calculates Dashboard totals accurately: Balance = Income - Expenses', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { summary } = res.body.data;

    // Income = $5,000.00, Expenses = $500.00, Balance = $4,500.00
    expect(summary.totalIncome).toBe(5000.0);
    expect(summary.totalExpenses).toBe(500.0);
    expect(summary.totalBalance).toBe(4500.0);
    expect(summary.totalSavings).toBe(4500.0);
  });

  it('calculates Budget remaining & percentage accurately', async () => {
    const res = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const budget = res.body.data.find((b: any) => b.categoryId === foodCatId);
    expect(budget).toBeDefined();

    // Budget: 1000, Spent: 500, Remaining: 500, Used: 50%
    expect(budget.amount).toBe(1000.0);
    expect(budget.spent).toBe(500.0);
    expect(budget.remaining).toBe(500.0);
    expect(budget.percentage).toBe(50);
    expect(budget.status).toBe('SAFE');
  });

  it('calculates Savings Goal percentage and remaining accurately', async () => {
    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const goal = res.body.data[0];
    expect(goal).toBeDefined();

    // Target: 2000, Current: 500, Remaining: 1500, %: 25%
    expect(goal.targetAmount).toBe(2000.0);
    expect(goal.currentAmount).toBe(500.0);
    expect(goal.remaining).toBe(1500.0);
    expect(goal.percentage).toBe(25);
  });

  it('handles goal deposit and recalculates progress', async () => {
    const goalsRes = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    const goalId = goalsRes.body.data[0].id;

    // Add $500 more to reach $1,000 (50%)
    const adjustRes = await request(app)
      .post(`/api/goals/${goalId}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500.0,
        operation: 'ADD',
      });

    expect(adjustRes.status).toBe(200);
    expect(adjustRes.body.data.currentAmount).toBe(1000.0);

    const updatedGoalsRes = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    const updatedGoal = updatedGoalsRes.body.data.find((g: any) => g.id === goalId);
    expect(updatedGoal.percentage).toBe(50);
    expect(updatedGoal.remaining).toBe(1000.0);
  });
});
