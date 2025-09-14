import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerUser, type RegisterRequest } from '../../features/auth/api/authApi'

describe('registerUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends POST request with JSON body and returns text when ok', async () => {
    const mockResponse = 'User registered successfully!'
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockResponse),
    })

    const body: RegisterRequest = {
      username: 'anja',
      password: 'secret',
      firstName: 'Anja',
      lastName: 'Bane',
      email: 'anja@example.com',
      role: 'guest',
    }

    const result = await registerUser(body)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/register$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
    expect(result).toBe(mockResponse)
  })

  it('throws error with response text when not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Invalid data'),
      status: 400,
    })

    await expect(registerUser({} as RegisterRequest)).rejects.toThrow('Invalid data')
  })

  it('throws error with HTTP status if response text is empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(''),
      status: 500,
    })

    await expect(registerUser({} as RegisterRequest)).rejects.toThrow('HTTP 500')
  })
})
