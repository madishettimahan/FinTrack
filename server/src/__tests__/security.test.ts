import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/db.js';

describe('Security Requirements: Multi-Tenant Data Isolation', () => {
  let userAToken: string;
  let userBToken: string;
  let userATransactionId: string;
  let userACategoryId: string;

  beforeAll(async () => {
    // 1. Register User A
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Alpha',
        email: `usera-${Date.now()}@security.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    userAToken = userARes.body.data.accessToken;

    // Get User A's default expense category
    const catRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${userAToken}`);

    userACategoryId = catRes.body.data[0].id;

    // Create a confidential transaction for User A
    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'EXPENSE',
        amount: 5000.0,
        categoryId: userACategoryId,
        date: new Date().toISOString(),
        description: 'Confidential Wire Transfer of User Alpha',
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Secret financial memo',
      });

    userATransactionId = txRes.body.data.id;

    // 2. Register User B (Adversary/Unrelated user)
    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Beta',
        email: `userb-${Date.now()}@security.test`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    userBToken = userBRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@security.test' } },
    });
  });

  it('MANDATORY: User B cannot access User A transaction (returns 404 without data leak)', async () => {
    const res = await request(app)
      .get(`/api/transactions/${userATransactionId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Must return 404 (or 403) and must never reveal User A's data
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('Confidential Wire Transfer of User Alpha');
    expect(JSON.stringify(res.body)).not.toContain('Secret financial memo');
  });

  it('MANDATORY: User B cannot modify User A transaction', async () => {
    const res = await request(app)
      .put(`/api/transactions/${userATransactionId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        amount: 1.0,
        description: 'Tampered by User B',
      });

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);

    // Verify User A transaction remains untampered in database
    const verifyTx = await prisma.transaction.findUnique({
      where: { id: userATransactionId },
    });
    expect(verifyTx?.amount).toBe(5000.0);
    expect(verifyTx?.description).toBe('Confidential Wire Transfer of User Alpha');
  });

  it('MANDATORY: User B cannot delete User A transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${userATransactionId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);

    // Verify User A transaction still exists
    const verifyTx = await prisma.transaction.findUnique({
      where: { id: userATransactionId },
    });
    expect(verifyTx).not.toBeNull();
  });

  it('MANDATORY: User B transactions query only returns User B records', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBe(0);
    expect(JSON.stringify(res.body)).not.toContain('Confidential Wire Transfer of User Alpha');
  });
});
