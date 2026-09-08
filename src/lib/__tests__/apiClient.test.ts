import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, setTokenAccessor } from '../apiClient';

describe('Centralized apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setTokenAccessor(() => null);
  });

  it('unwraps success envelope and returns data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        data: { activeTargets: 42 },
      }),
    });

    const res = await api.dashboard.kpis();
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ activeTargets: 42 });
    expect(res.error).toBeNull();
  });

  it('uses credentials: include for secure zero-trust cookies', async () => {
    global.fetch = vi.fn().mockImplementation((url, init) => {
      expect(init.credentials).toBe('include');
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: [] }),
      });
    });

    await api.dashboard.feed();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('correctly unwraps string-based error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        error: 'Invalid filter parameter supplied.',
      }),
    });

    const res = await api.map.pins();
    expect(res.ok).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error).toBe('Invalid filter parameter supplied.');
  });

  it('correctly unwraps object-based error response with message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Insufficient clearance level to access this dossier.',
          statusCode: 403,
        },
      }),
    });

    const res = await api.intelligence.dossier('ent-restricted');
    expect(res.ok).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error).toBe('Insufficient clearance level to access this dossier.');
  });

  it('handles network failure without throwing unhandled exceptions', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused by remote host'));

    const res = await api.auth.login('user', 'pass');
    expect(res.ok).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error).toBe('Connection refused by remote host');
  });
});
