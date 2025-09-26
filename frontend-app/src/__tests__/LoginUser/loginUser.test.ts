import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser, type LoginRequest } from '../../features/auth/api/authApi'

describe('loginUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends POST request with JSON body and returns parsed JSON when ok', async () => {
    const mockResponse = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'refresh-token-value',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const body: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    }

    const result = await loginUser(body)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/login$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('throws error with response text when not ok', async () => {
    const errorMessage = 'Authentication failed: Invalid credentials'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(errorMessage),
      status: 401,
    })

    const body: LoginRequest = {
      username: 'wronguser',
      password: 'wrongpassword',
    }

    await expect(loginUser(body)).rejects.toThrow(errorMessage)
  })

  it('throws error with HTTP status if response text is empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(''),
      status: 500,
    })

    const body: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    }

    await expect(loginUser(body)).rejects.toThrow('HTTP 500')
  })

  it('handles network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const body: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    }

    await expect(loginUser(body)).rejects.toThrow('Network error')
  })

  it('calls correct API endpoint', async () => {
    const mockResponse = {
      access_token: 'token',
      refresh_token: 'refresh',
      token_type: 'Bearer',
      expires_in: 3600,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const body: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    }

    await loginUser(body)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.any(Object)
    )
  })

  it('sends correct headers', async () => {
    const mockResponse = {
      access_token: 'token',
      refresh_token: 'refresh',
      token_type: 'Bearer',
      expires_in: 3600,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const body: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    }

    await loginUser(body)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('handles different HTTP error status codes', async () => {
    const testCases = [
      { status: 400, message: 'Bad Request' },
      { status: 401, message: 'Unauthorized' },
      { status: 403, message: 'Forbidden' },
      { status: 500, message: 'Internal Server Error' },
    ]

    for (const testCase of testCases) {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve(testCase.message),
        status: testCase.status,
      })

      const body: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      }

      await expect(loginUser(body)).rejects.toThrow(testCase.message)
    }
  })

  it('handles response with missing optional fields', async () => {
    const mockResponse = {
      access_token: 'token',
      refresh_token: 'refresh',
      token_type: 'Bearer',
      expires_in: 3600,
      // scope is optional and not included
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const body: LoginRequest = {
      username: 'testuser',
      password: 'password123',
    }

    const result = await loginUser(body)
    expect(result).toEqual(mockResponse)
    expect(result.scope).toBeUndefined()
  })
})