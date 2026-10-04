import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/db.js';

describe('Authentication & Authorization Flow', () => {
  const testUser = {
    name: 'Test Engineer',
    email: `test-${Date.now()}@example.com`,
    password: 'ValidPassword123!',
    confirmPassword: 'ValidPassword123!',
  };

  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    // Cleanup created test user
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    });
  });

  it('should reject registration with invalid password (no special char)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid User',
        email: 'invalid@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration when passwords do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mismatch User',
        email: 'mismatch@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully register a new user with valid requirements', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose password hash

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should prevent duplicate email registration (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should successfully login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject access to protected /me endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should retrieve profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should refresh access token using refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should log out and invalidate session', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
