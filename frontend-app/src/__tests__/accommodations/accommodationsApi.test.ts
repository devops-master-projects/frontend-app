import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('accommodationsApi', () => {
  const VITE_SEARCH_API_URL = 'https://search.api.test'
  const VITE_ACCOMMODATION_API_URL = 'https://acc.api.test'
  const VITE_CLOUDINARY_UPLOAD_PRESET = 'preset'
  const VITE_CLOUDINARY_CLOUD_NAME = 'cloud'

  let api: typeof import('../../../features/accommodations/api/accommodationsApi')

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_SEARCH_API_URL', VITE_SEARCH_API_URL)
    vi.stubEnv('VITE_ACCOMMODATION_API_URL', VITE_ACCOMMODATION_API_URL)
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', VITE_CLOUDINARY_UPLOAD_PRESET)
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', VITE_CLOUDINARY_CLOUD_NAME)
    api = await import('../../features/accommodations/api/accommodationsApi')
    localStorage.clear()
  })

  it('fetchAccommodations returns JSON array when ok', async () => {
    const payload = [{ id: '1', name: 'A', description: 'd', location: { city: 'C', country: 'X', address: '', postalCode: '' }, photos: [], amenities: [], minGuests: 1, maxGuests: 2, totalPrice: 10, unitPrice: 10, pricingMode: 'PER_NIGHT' }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) })

    const res = await api.fetchAccommodations()
    expect(res).toEqual(payload)
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('getAutoConfirm returns boolean and throws on error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ autoConfirm: true }) })
    const got = await api.getAutoConfirm('acc-1')
    expect(got).toBe(true)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('Not found'), status: 404 })
    await expect(api.getAutoConfirm('acc-1')).rejects.toThrow(/Not found/i)
  })

  it('uploadPhotoToCloudinary posts FormData and returns secure_url', async () => {
    const secure = 'https://cdn.example/photo.jpg'
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ secure_url: secure }) })

    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    const res = await api.uploadPhotoToCloudinary(file)
    expect(res).toBe(secure)
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('createAccommodation posts JSON and returns created dto', async () => {
    const dto = { id: 'x', name: 'N', minGuests: 1, maxGuests: 2, description: 'd', urlPhotos: [], location: { country: 'c', city: 'ci', address: '', postalCode: '' }, autoConfirm: false, pricingMode: 'PER_NIGHT', amenities: [] }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(dto) })

    const reqBody = { name: 'N', location: { country: 'c', city: 'ci', address: '', postalCode: '' }, minGuests: 1, maxGuests: 2, description: 'd', autoConfirm: false, pricingMode: 'PER_NIGHT', photos: [], amenities: [] }
    const res = await api.createAccommodation(reqBody as any)
    expect(res).toEqual(dto)
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('updateAutoConfirm sends PATCH and resolves', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await expect(api.updateAutoConfirm('acc-1', true)).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${VITE_ACCOMMODATION_API_URL}/api/accommodations/acc-1/auto-confirm`,
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('updateAutoConfirm throws on error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Oops') })
    await expect(api.updateAutoConfirm('acc-1', false)).rejects.toThrow(/Oops|HTTP 500/)
  })

  it('fetchAccommodationById returns dto and handles error', async () => {
    const dto = { id: 'a1', name: 'N', minGuests: 1, maxGuests: 2, description: '', urlPhotos: [], location: { country: 'c', city: 'ci', address: '', postalCode: '' }, autoConfirm: false, pricingMode: 'PER_NIGHT', amenities: [] }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(dto) })
    const got = await api.fetchAccommodationById('a1')
    expect(got).toEqual(dto)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
    await expect(api.fetchAccommodationById('missing')).rejects.toThrow(/Not found/i)
  })

  it('updateAccommodation PUT returns dto and throws on error', async () => {
    const dto = { id: 'a1', name: 'N', minGuests: 1, maxGuests: 2, description: '', urlPhotos: [], location: { country: 'c', city: 'ci', address: '', postalCode: '' }, autoConfirm: false, pricingMode: 'PER_NIGHT', amenities: [] }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(dto) })
    const res = await api.updateAccommodation('a1', dto as any)
    expect(res).toEqual(dto)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, text: () => Promise.resolve('Bad') })
    await expect(api.updateAccommodation('a1', dto as any)).rejects.toThrow(/Bad/i)
  })

  it('searchAccommodations posts search request and returns results; throws on error', async () => {
    const results = [{ id: '1', name: 'House', description: '', location: { country: 'c', city: 'ci', address: '', postalCode: '' }, photos: [], amenities: [], minGuests: 1, maxGuests: 2, totalPrice: 100, unitPrice: 100, pricingMode: 'PER_NIGHT' }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(results) })
    const got = await api.searchAccommodations({ location: 'ci', guests: 2 })
    expect(got).toEqual(results)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${VITE_SEARCH_API_URL}/api/search`,
      expect.objectContaining({ method: 'POST' })
    )

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Server') })
    await expect(api.searchAccommodations({ location: 'ci', guests: 2 })).rejects.toThrow(/Server|HTTP 500/)
  })
})
