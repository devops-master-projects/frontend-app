import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('notificationsApi', () => {
  const VITE_NOTIFICATION_API_URL = 'https://notif.api.test'
  let api: typeof import('../../features/notifications/api/notificationsApi')

  beforeEach(async () => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_NOTIFICATION_API_URL', VITE_NOTIFICATION_API_URL)
    api = await import('../../features/notifications/api/notificationsApi')
    localStorage.clear()
  })

  it('fetchNotificationSettings returns data and updateNotificationSetting patches', async () => {
    const settings = [{ notifType: 'EMAIL', enabled: true }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(settings) })
    const s = await api.fetchNotificationSettings()
    expect(s).toEqual(settings)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ notifType: 'EMAIL', enabled: false }) })
    const updated = await api.updateNotificationSetting('EMAIL', false)
    expect(updated.enabled).toBe(false)
  })

  it('getUserNotifications/unread/getNotificationById work, error on non-ok, and call correct URL', async () => {
    const list = [{ id: 'n1', notifType: 'INFO', message: 'hi', createdAt: '', read: false }]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(list) })
    const res = await api.getUserNotifications()
    expect(res).toEqual(list)
    expect(globalThis.fetch).toHaveBeenCalledWith(`${VITE_NOTIFICATION_API_URL}/api/notifications`, expect.any(Object))

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(list) })
    const unread = await api.getUnreadNotifications()
    expect(unread).toEqual(list)

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(list[0]) })
    const one = await api.getNotificationById('n1')
    expect(one.id).toBe('n1')

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('err') })
    await expect(api.getNotificationById('bad')).rejects.toThrow(/err/i)
  })

  it('markAllAsRead/markAsRead/markSelectedAsRead/deleteNotificationsBulk call endpoints and build params', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await expect(api.markAllAsRead()).resolves.toBeUndefined()
    await expect(api.markAsRead('n1')).resolves.toBeUndefined()
    await expect(api.markSelectedAsRead(['n1', 'n2'])).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalled()
    await expect(api.deleteNotificationsBulk(['n1'])).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalled()
  })
})
