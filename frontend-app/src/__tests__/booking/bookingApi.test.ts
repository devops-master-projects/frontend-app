import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('bookingApi', () => {
  const VITE_BOOKING_API_URL = 'https://booking.api.test'
  let api: typeof import('../../features/booking/api/bookingApi')

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_BOOKING_API_URL', VITE_BOOKING_API_URL)
    api = await import('../../features/booking/api/bookingApi')
    localStorage.clear()
  })

  it('createReservationRequest posts and returns dto', async () => {
    const dto = { id: 'r1', guestId: 'g', accommodationId: 'a', startDate: '2025-10-10', endDate: '2025-10-11', guestCount: 2, status: 'PENDING', createdAt: '' }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(dto) })

  const req = { accommodationId: 'a', startDate: '2025-10-10', endDate: '2025-10-11', guestCount: 2 }
  const res = await api.createReservationRequest(req)
    expect(res).toEqual(dto)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${VITE_BOOKING_API_URL}/api/reservation-requests`,
      expect.any(Object)
    )
  })

  it('createReservationRequest throws on non-ok (branch)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 409, text: () => Promise.resolve('Conflict') })
    const req = { accommodationId: 'a', startDate: '2025-10-10', endDate: '2025-10-11', guestCount: 2 }
  await expect(api.createReservationRequest(req)).rejects.toThrow(/Conflict|HTTP 409/)
  })

  it('getReservationRequestsByGuest returns list and handles error', async () => {
    const arr = [{ id: 'x' }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(arr) })
    const got = await api.getReservationRequestsByGuest('acc-1')
    expect(got).toEqual(arr)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('Bad'), status: 400 })
    await expect(api.getReservationRequestsByGuest('acc-1')).rejects.toThrow(/Bad/i)
  })

  it('updateReservationRequestStatus patches and returns updated dto', async () => {
    const updated = { id: 'r1', status: 'APPROVED' }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) })
    const res = await api.updateReservationRequestStatus('r1', 'APPROVED')
    expect(res).toEqual(updated)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${VITE_BOOKING_API_URL}/api/reservation-requests/r1/status?status=APPROVED`,
      expect.any(Object)
    )
  })

  it('createAvailability/getAvailability/updateAvailability/deleteAvailability flow', async () => {
  const avail = { id: 'a1', accommodationId: 'acc', startDate: '2025-10-01', endDate: '2025-10-02', price: 100, status: 'AVAILABLE', priceType: 'NORMAL' }
    // create
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(avail) })
  const created = await api.createAvailability({ accommodationId: 'acc', startDate: '', endDate: '', price: 1, priceType: 'NORMAL' })
    expect(created).toEqual(avail)

    // getAvailability
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([avail]) })
    const arr = await api.getAvailability('acc')
    expect(arr).toEqual([avail])

    // updateAvailability
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(avail) })
    const upd = await api.updateAvailability('a1', { price: 200 })
    expect(upd).toEqual(avail)

    // deleteAvailability
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await expect(api.deleteAvailability('a1')).resolves.toBeUndefined()
  })

  it('getAvailability returns array on success and throws on error', async () => {
    const arr = [{ id: 'av1', startDate: '2025-10-05', endDate: '2025-10-10', price: 100, priceType: 'NORMAL', status: 'AVAILABLE' }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(arr) })
    const got = await api.getAvailability('a1')
    expect(got).toEqual(arr)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('Not found'), status: 404 })
    await expect(api.getAvailability('a1')).rejects.toThrow(/Not found/i)
  })

  it('cancelReservation sends POST and throws on non-ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await expect(api.cancelReservation('r1')).resolves.toBeUndefined()

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('Forbidden') })
    await expect(api.cancelReservation('r1')).rejects.toThrow(/Forbidden/i)
  })

  it('includes Authorization header when token present (branches)', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_BOOKING_API_URL', VITE_BOOKING_API_URL)
    vi.doMock('../../features/auth/api/authApi', () => ({
      getAccessToken: () => 'token123',
      getTokenType: () => 'Bearer',
    }))
    const mod = await import('../../features/booking/api/bookingApi')

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'x' }) })
  await mod.createAvailability({ accommodationId: 'a', startDate: '2025-01-01', endDate: '2025-01-02', price: 1, priceType: 'NORMAL' })
  const [, opts] = (globalThis.fetch as unknown as { mock: { calls: [string, { headers: Record<string, string> }][] } }).mock.calls[0]
    expect(opts.headers.Authorization).toBe('Bearer token123')

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await mod.getAvailability('a')
  const [, opts2] = (globalThis.fetch as unknown as { mock: { calls: [string, { headers: Record<string, string> }][] } }).mock.calls[0]
    expect(opts2.headers.Authorization).toBe('Bearer token123')
  })

  it('deleteReservationRequest sends DELETE and throws on error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await expect(api.deleteReservationRequest('r1')).resolves.toBeUndefined()

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('Missing') })
    await expect(api.deleteReservationRequest('r1')).rejects.toThrow(/Missing|HTTP 404/)
  })

  it('getReservationRequestsByAccommodation returns list and throws on error', async () => {
    const list = [{ id: 'r1' }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(list) })
    const got = await api.getReservationRequestsByAccommodation('acc-1')
    expect(got).toEqual(list)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Oops') })
    await expect(api.getReservationRequestsByAccommodation('acc-1')).rejects.toThrow(/Oops|HTTP 500/)
  })
})
