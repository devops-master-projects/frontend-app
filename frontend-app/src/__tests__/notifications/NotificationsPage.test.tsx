import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import * as api from '../../features/notifications/api/notificationsApi'
import NotificationsPage from '../../features/notifications/pages/NotificationsPage'

vi.mock('../../features/accommodations/navbar/HostNavbar', () => ({ default: () => null }))
vi.mock('../../features/accommodations/navbar/GuestNavbar', () => ({ default: () => null }))
vi.mock('../../features/notifications/api/websocket', () => ({ connectWebSocket: () => {}, disconnectWebSocket: () => {} }))

vi.mock('../../features/auth/api/authApi', () => ({
  getUserInfoFromToken: () => ({ id: 'user-1' }),
  getRole: () => 'GUEST',
}))

vi.mock('../../features/notifications/api/notificationsApi', () => ({
  getUserNotifications: vi.fn(),
  markAllAsRead: vi.fn(),
  markSelectedAsRead: vi.fn(),
  deleteNotificationsBulk: vi.fn(),
  markAsRead: vi.fn(),
}))

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no notifications', async () => {
    vi.mocked(api.getUserNotifications).mockResolvedValue([])
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )
    await screen.findByText(/no notifications found/i)
  })

  it('renders list and performs mark all as read and delete selected', async () => {
    const now = new Date().toISOString()
    vi.mocked(api.getUserNotifications).mockResolvedValue([
      { id: 'n1', notifType: 'NEW', message: 'Hello', createdAt: now, read: false },
      { id: 'n2', notifType: 'INFO', message: 'World', createdAt: now, read: true },
    ])
    vi.mocked(api.markAllAsRead).mockResolvedValue()
    vi.mocked(api.markSelectedAsRead).mockResolvedValue()
    vi.mocked(api.deleteNotificationsBulk).mockResolvedValue()

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    // List renders
    await screen.findByText(/hello/i)
    expect(screen.getByText(/world/i)).toBeInTheDocument()

    // New chip visible for unread
    expect(screen.getByText(/new/i)).toBeInTheDocument()

    // Mark all as read
    await userEvent.click(screen.getByRole('button', { name: /mark all as read/i }))
    await waitFor(() => {
      expect(api.markAllAsRead).toHaveBeenCalled()
      // Chip should be gone
      expect(screen.queryByText(/new/i)).toBeNull()
    })

    // Select first item checkbox then delete selected
    const checkboxes = screen.getAllByRole('checkbox')
    // First checkbox in header row then items; click last to ensure we select an item
    await userEvent.click(checkboxes[checkboxes.length - 1])
    await userEvent.click(screen.getByRole('button', { name: /delete selected/i }))
    await waitFor(() => expect(api.deleteNotificationsBulk).toHaveBeenCalledWith(['n2']))
  })
})
