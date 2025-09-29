import { beforeEach, describe, expect, it, vi } from 'vitest';

const VITE_API_URL = 'https://api.example.test';

function mockFetchOkJson(
  data: unknown,
  assert?: (input: RequestInfo, init?: RequestInit) => void
) {
  globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    assert?.(input, init);
    const resp = {
      ok: true,
      status: 200,
      json: async () => data,
      text: async () => JSON.stringify(data),
    } as unknown as Response;
    return resp;
  }) as unknown as typeof fetch;
}

function mockFetchOkText(
  text: string,
  assert?: (input: RequestInfo, init?: RequestInit) => void
) {
  globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    assert?.(input, init);
    const resp = {
      ok: true,
      status: 200,
      json: async () => ({ text }),
      text: async () => text,
    } as unknown as Response;
    return resp;
  }) as unknown as typeof fetch;
}

function mockFetchErr(status = 400, text = 'Bad Request') {
  globalThis.fetch = vi.fn(async () => {
    return {
      ok: false,
      status,
      text: async () => text,
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

describe('authApi', () => {
  let api: typeof import('../../features/auth/api/authApi');

  beforeEach(async () => {
    localStorage.clear();
    vi.resetAllMocks();
    vi.resetModules(); 
    vi.stubEnv('VITE_API_URL', VITE_API_URL); 
    api = await import('../../features/auth/api/authApi');
  });

  it('setTokens & clearTokens work with localStorage', () => {
    const resp = {
      access_token: 'abc',
      token_type: 'Bearer',
      refresh_token: 'ref',
      expires_in: 3600,
      scope: 'read',
    };
    api.setTokens(resp);
    expect(api.getAccessToken()).toBe('abc');
    expect(api.getTokenType()).toBe('Bearer');
    expect(localStorage.getItem('refresh_token')).toBe('ref');
    expect(Number(localStorage.getItem('expires_at'))).toBeGreaterThan(Date.now());

    api.clearTokens();
    expect(api.getAccessToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(api.getTokenType()).toBe('Bearer'); 
  });

  it('registerUser sends POST and returns text on success', async () => {
    mockFetchOkText('Registered OK', (input, init) => {
      expect(String(input)).toBe(`${VITE_API_URL}/api/auth/register`);
      expect(init?.method).toBe('POST');
    });

    const msg = await api.registerUser({
      username: 'u',
      password: 'p',
      firstName: 'f',
      lastName: 'l',
      email: 'e@x.com',
      role: 'USER',
    });
    expect(msg).toBe('Registered OK');
  });

  it('registerUser throws on HTTP error', async () => {
    mockFetchErr(409, 'Username taken');
    await expect(
      api.registerUser({
        username: 'u',
        password: 'p',
        firstName: 'f',
        lastName: 'l',
        email: 'e@x.com',
        role: 'USER',
      })
    ).rejects.toThrow(/Username taken/i);
  });

  it('loginUser stores tokens and returns response', async () => {
    const payload = {
      access_token: 'A1',
      refresh_token: 'R1',
      token_type: 'Bearer',
      expires_in: 1800,
    };
    mockFetchOkJson(payload, (input, init) => {
      expect(String(input)).toBe(`${VITE_API_URL}/api/auth/login`);
      expect(init?.method).toBe('POST');
    });

    const resp = await api.loginUser({ username: 'u', password: 'p' });
    expect(resp).toEqual(payload);
    expect(localStorage.getItem('access_token')).toBe('A1');
    expect(localStorage.getItem('refresh_token')).toBe('R1');
  });

  it('loginUser throws on non-ok', async () => {
    mockFetchErr(401, 'Unauthorized');
    await expect(api.loginUser({ username: 'u', password: 'bad' })).rejects.toThrow(/Unauthorized/i);
  });

  it('refreshToken updates tokens on success', async () => {
    localStorage.setItem('refresh_token', 'REFRESH!');
    const payload = {
      access_token: 'NEW',
      refresh_token: 'NEWREF',
      token_type: 'Bearer',
      expires_in: 1200,
    };
    mockFetchOkJson(payload, (input, init) => {
      expect(String(input)).toBe(`${VITE_API_URL}/api/auth/refresh`);
      expect(init?.method).toBe('POST');
      expect(String(init?.body)).toContain('REFRESH!');
    });

    const resp = await api.refreshToken();
    expect(resp.access_token).toBe('NEW');
    expect(localStorage.getItem('access_token')).toBe('NEW');
    expect(localStorage.getItem('refresh_token')).toBe('NEWREF');
  });

  it('refreshToken clears storage and throws on error', async () => {
    localStorage.setItem('refresh_token', 'R');
    mockFetchErr(403, 'Forbidden');
    await expect(api.refreshToken()).rejects.toThrow(/Forbidden/i);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('getProfile uses auth header and returns JSON', async () => {
    localStorage.setItem('access_token', 'TKN');
    localStorage.setItem('token_type', 'Bearer');

    mockFetchOkJson({ firstName: 'Jane' }, (input, init) => {
      expect(String(input)).toBe(`${VITE_API_URL}/api/auth/profile`);
      expect(init?.method).toBe('GET');
      const h = new Headers(init?.headers as HeadersInit);
      expect(h.get('Authorization')).toBe('Bearer TKN');
    });

    const data = await api.getProfile();
    expect(data.firstName).toBe('Jane');
  });

  it('getProfile throws on non-ok', async () => {
    mockFetchErr(404, 'Not found');
    await expect(api.getProfile()).rejects.toThrow(/Not found/i);
  });

  it('updateProfile PUTs body and returns text', async () => {
    localStorage.setItem('access_token', 'T');
    mockFetchOkText('OK', (input, init) => {
      expect(String(input)).toBe(`${VITE_API_URL}/api/auth/profile`);
      expect(init?.method).toBe('PUT');
      expect(String(init?.body)).toContain('"firstName"');
    });

    const msg = await api.updateProfile({ firstName: 'A', lastName: 'B', email: 'a@b.com', address: '' });
    expect(msg).toBe('OK');
  });

  it('changeCredentials PUTs body and returns text', async () => {
    localStorage.setItem('access_token', 'T');
    mockFetchOkText('Changed', (input, init) => {
      expect(String(input)).toBe(`${VITE_API_URL}/api/auth/credentials`);
      expect(init?.method).toBe('PUT');
      expect(String(init?.body)).toContain('"currentPassword"');
      expect(String(init?.body)).toContain('"newPassword"');
    });

    const msg = await api.changeCredentials({ currentPassword: 'old', newPassword: 'newer' });
    expect(msg).toBe('Changed');
  });

  it('updateProfile throws on non-ok', async () => {
    mockFetchErr(400, 'Invalid');
    await expect(api.updateProfile({ firstName: 'X', lastName: 'Y' })).rejects.toThrow(/Invalid/i);
  });

  it('changeCredentials throws on non-ok', async () => {
    mockFetchErr(401, 'Unauthorized');
    await expect(api.changeCredentials({ currentPassword: 'bad' })).rejects.toThrow(/Unauthorized/i);
  });
});
