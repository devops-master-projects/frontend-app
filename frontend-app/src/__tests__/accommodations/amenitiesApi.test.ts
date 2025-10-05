import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('amenitiesApi', () => {
  const VITE_ACCOMMODATION_API_URL = 'https://acc.api.test'
  let api: typeof import('../../features/accommodations/api/amenitiesApi')

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_ACCOMMODATION_API_URL', VITE_ACCOMMODATION_API_URL)
    // Mock token functions
    vi.mock('../../features/auth/api/authApi.ts', () => ({
      getAccessToken: () => 't',
      getTokenType: () => 'Bearer',
    }))
    api = await import('../../features/accommodations/api/amenitiesApi')
  })

  it('createAmenity posts and returns json', async () => {
    const dto = { id: '1', name: 'Wifi', description: 'Fast' }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(dto) })
    const res = await api.createAmenity({ name: 'Wifi', description: 'Fast' })
    expect(res).toEqual(dto)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${VITE_ACCOMMODATION_API_URL}/api/amenities`,
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('createAmenity throws on error status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, text: () => Promise.resolve('Bad') })
    await expect(api.createAmenity({ name: 'x', description: 'y' })).rejects.toThrow(/Bad|HTTP 400/)
  })

  it('fetchAmenities returns list', async () => {
    const list = [{ id: '1', name: 'Wifi', description: 'Fast' }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(list) })
    const res = await api.fetchAmenities()
    expect(res).toEqual(list)
  })

  it('fetchAmenities throws on error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Oops') })
    await expect(api.fetchAmenities()).rejects.toThrow(/Oops|HTTP 500/)
  })
})
