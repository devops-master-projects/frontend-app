import { render, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as api from '../../features/notifications/api/notificationsApi'
import NotificationDetailsPage from '../../features/notifications/pages/NotificationDetailsPage'

vi.mock('../../features/accommodations/navbar/HostNavbar', () => ({ default: () => null }))
vi.mock('../../features/accommodations/navbar/GuestNavbar', () => ({ default: () => null }))
vi.mock('../../features/auth/api/authApi', () => ({ getRole: () => 'GUEST' }))

vi.mock('../../features/notifications/api/notificationsApi', () => ({ getNotificationById: vi.fn() }))

describe('NotificationDetailsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows spinner then renders notification info', async () => {
    vi.mocked(api.getNotificationById).mockResolvedValue({
      id: 'n1', notifType: 'NEW', message: 'Hi Dana', createdAt: new Date().toISOString(), read: false,
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/notifications/n1' }]}>
        <Routes>
          <Route path="/notifications/:id" element={<NotificationDetailsPage />} />
        </Routes>
      </MemoryRouter>
    )

    // initial loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    // data rendered
    expect(await screen.findByText(/notification details/i)).toBeInTheDocument()
    expect(screen.getByText(/hi dana/i)).toBeInTheDocument()
  })

  it('renders empty state when API returns null/undefined', async () => {
  vi.mocked(api.getNotificationById).mockResolvedValue(undefined as unknown as never)

    render(
      <MemoryRouter initialEntries={[{ pathname: '/notifications/missing' }]}>
        <Routes>
          <Route path="/notifications/:id" element={<NotificationDetailsPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/no notification found/i)).toBeInTheDocument()
  })
})
