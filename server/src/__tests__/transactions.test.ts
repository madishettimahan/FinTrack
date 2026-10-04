import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/db.js';

describe('Transactions & Budget System', () => {
  let token: string;
  let expenseCatId: string;
  let incomeCatId: string;
  let createdTxId: string;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Transaction User',
        email: `txuser-${Date.now()}@txtest.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    token = userRes.body.data.accessToken;

    const catRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    const cats = catRes.body.data;
    expenseCatId = cats.find((c: any) => c.type === 'EXPENSE').id;
    incomeCatId = cats.find((c: any) => c.type === 'INCOME').id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@txtest.com' } },
    });
  });

  it('should reject transaction with negative amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: -50,
        categoryId: expenseCatId,
        date: new Date().toISOString(),
        description: 'Negative expense test',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create an income transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INCOME',
        amount: 3000.0,
        categoryId: incomeCatId,
        date: new Date().toISOString(),
        description: 'Biweekly Paycheck',
        paymentMethod: 'BANK_TRANSFER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(3000.0);
    expect(res.body.data.type).toBe('INCOME');
  });

  it('should create an expense transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 250.75,
        categoryId: expenseCatId,
        date: new Date().toISOString(),
        description: 'Supermarket Grocery Run',
        paymentMethod: 'CREDIT_CARD',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(250.75);
    createdTxId = res.body.data.id;
  });

  it('should search transactions by description', async () => {
    const res = await request(app)
      .get('/api/transactions?search=Supermarket')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBe(1);
    expect(res.body.data.transactions[0].description).toContain('Supermarket');
  });

  it('should filter transactions by type', async () => {
    const res = await request(app)
      .get('/api/transactions?type=INCOME')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBe(1);
    expect(res.body.data.transactions[0].type).toBe('INCOME');
  });

  it('should update an existing transaction', async () => {
    const res = await request(app)
      .put(`/api/transactions/${createdTxId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 275.0,
        description: 'Updated Grocery Run with receipts',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(275.0);
    expect(res.body.data.description).toBe('Updated Grocery Run with receipts');
  });

  it('should delete a transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${createdTxId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/transactions/${createdTxId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
