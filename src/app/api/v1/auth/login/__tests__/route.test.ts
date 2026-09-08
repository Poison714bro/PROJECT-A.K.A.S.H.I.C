import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Auth Login API Route (v1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests missing username or password with 400', async () => {
    const req = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('required');
  });

  it('authenticates predefined admin operator with default password', async () => {
    const req = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe('admin');
    expect(body.data.user.role).toBe('ADMIN');
    expect(body.data.user.clearanceLevel).toBe(3);
    expect(body.data.token).toContain('akashic-jwt-token-admin');
  });

  it('authenticates predefined agent operator', async () => {
    const req = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'agent', password: 'password' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('INVESTIGATOR');
    expect(body.data.user.clearanceLevel).toBe(2);
  });

  it('authenticates database user if found in Prisma', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: 'db-user-42',
      username: 'custom_operator',
      email: 'custom@agency.gov',
      role: 'ADMIN',
      clearanceLevel: 3,
    });

    const req = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'custom_operator', password: 'secure_password_123' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe('db-user-42');
    expect(body.data.user.username).toBe('custom_operator');
    expect(body.data.token).toContain('akashic-jwt-token-db-user-42');
  });

  it('rejects unrecognized credentials with 401', async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'unknown_intruder', password: 'bad_password' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('Invalid credentials');
  });
});
