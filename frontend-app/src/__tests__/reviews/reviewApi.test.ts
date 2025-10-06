/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// mock getAccessToken before importing the module so functions include Authorization header
vi.mock('../../features/auth/api/authApi', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
}))

import * as reviewApi from '../../features/reviews/api/reviewApi'

describe('reviewApi', () => {
  let __origFetch: any
  beforeEach(() => {
    vi.resetAllMocks()
    __origFetch = (global as any).fetch
    ;(global as any).fetch = vi.fn()
  })

  afterEach(() => {
    ;(global as any).fetch = __origFetch
  })

  it('deleteReview - resolves on ok and includes Authorization header', async () => {
    ;(global as any).fetch.mockResolvedValue({ ok: true, text: async () => '' })

    await expect(reviewApi.deleteReview('r1')).resolves.toBeUndefined()

    expect((global as any).fetch).toHaveBeenCalled()
    const [url, opts] = (global as any).fetch.mock.calls[0]
    expect(url).toContain('/api/reviews/accommodations/r1')
    expect(opts.method).toBe('DELETE')
    expect(opts.headers.Authorization).toContain('test-token')
  })

  it('deleteReview - throws when non-ok', async () => {
    ;(global as any).fetch.mockResolvedValue({ ok: false, text: async () => 'Not Found' })
    await expect(reviewApi.deleteReview('r2')).rejects.toThrow('Not Found')
  })

  it('getReviewById - returns json when ok', async () => {
    const dto = { id: 'r1', guestId: 'g1', accommodationId: 'a1', rating: 5, comment: 'x', createdAt: 't', guestFirstName: 'A', guestLastName: 'B' }
    ;(global as any).fetch.mockResolvedValue({ ok: true, json: async () => dto })

    const res = await reviewApi.getReviewById('r1')
    expect(res).toEqual(dto)
  })

  it('updateReview - sends PUT with JSON body and returns json', async () => {
    const input = { accommodationId: 'a1', rating: 4, comment: 'ok' }
    const updated = { id: 'r2', ...input, guestId: 'g2', createdAt: 't', guestFirstName: 'A', guestLastName: 'B' }
    ;(global as any).fetch.mockResolvedValue({ ok: true, json: async () => updated })

    const res = await reviewApi.updateReview('r2', input)
    expect(res).toEqual(updated)

    const [, opts] = (global as any).fetch.mock.calls[0]
    expect(opts.method).toBe('PUT')
    expect(opts.headers['Content-Type']).toBe('application/json')
    expect(opts.body).toBe(JSON.stringify(input))
  })

  it('getAccommodationReviews - returns page object', async () => {
    const page = { content: [], totalPages: 0, averageRating: 0 }
    ;(global as any).fetch.mockResolvedValue({ ok: true, json: async () => page })

    const res = await reviewApi.getAccommodationReviews('a1', 2, 5)
    expect(res).toEqual(page)
  })

  it('createAccommodationReview - posts and succeeds', async () => {
    const dto = { accommodationId: 'a1', rating: 5, comment: 'nice' }
    ;(global as any).fetch.mockResolvedValue({ ok: true, text: async () => '' })

    await expect(reviewApi.createAccommodationReview(dto)).resolves.toBeUndefined()

    const [, opts] = (global as any).fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.headers['Content-Type']).toBe('application/json')
    expect(opts.headers.Authorization).toContain('test-token')
    expect(opts.body).toBe(JSON.stringify(dto))
  })

  it('getHostReviews - returns host paged response', async () => {
    const resp = { content: [], totalPages: 1, averageRating: 4 }
    ;(global as any).fetch.mockResolvedValue({ ok: true, json: async () => resp })

    const res = await reviewApi.getHostReviews('h1', 0, 5)
    expect(res).toEqual(resp)
  })

  it('createHostReview - posts and includes Authorization', async () => {
    const dto = { hostId: 'h1', rating: 5, comment: 'good' }
    ;(global as any).fetch.mockResolvedValue({ ok: true, text: async () => '' })

    await expect(reviewApi.createHostReview(dto)).resolves.toBeUndefined()

    const [, opts] = (global as any).fetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toContain('test-token')
  })

  it('getHostReviewById - returns json when ok', async () => {
    const dto = { id: 'hr1', guestId: 'g1', hostId: 'h1', rating: 5, comment: '', createdAt: 't', guestFirstName: 'A', guestLastName: 'B' }
    ;(global as any).fetch.mockResolvedValue({ ok: true, json: async () => dto })

    const res = await reviewApi.getHostReviewById('hr1')
    expect(res).toEqual(dto)
  })

  it('updateHostReview - throws on non-ok', async () => {
    ;(global as any).fetch.mockResolvedValue({ ok: false, text: async () => 'err' })
    await expect(reviewApi.updateHostReview('hr1', { hostId: 'h1', rating: 3, comment: 'x' })).rejects.toThrow('err')
  })

  it('deleteHostReview - calls DELETE and includes Authorization', async () => {
    ;(global as any).fetch.mockResolvedValue({ ok: true, text: async () => '' })
    await expect(reviewApi.deleteHostReview('hr1')).resolves.toBeUndefined()

    const [, opts] = (global as any).fetch.mock.calls[0]
    expect(opts.method).toBe('DELETE')
    expect(opts.headers.Authorization).toContain('test-token')
  })
})
