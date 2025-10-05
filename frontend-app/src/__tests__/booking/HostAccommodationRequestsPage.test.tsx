import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as bookingApi from '../../features/booking/api/bookingApi'
import * as accApi from '../../features/accommodations/api/accommodationsApi'
import Page from '../../features/booking/pages/HostAccommodationRequestsPage'

vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => null }))

vi.mock('../../features/booking/api/bookingApi', () => ({
  getReservationRequestsByAccommodation: vi.fn(),
  updateReservationRequestStatus: vi.fn(),
}))

vi.mock('../../features/accommodations/api/accommodationsApi.ts', () => ({
  getAutoConfirm: vi.fn(),
  updateAutoConfirm: vi.fn(),
}))

const makeRequest = (over: Partial<any> = {}) => ({
  id: 'r1',
  createdAt: '2099-01-01T00:00:00Z',
  guestFirstName: 'Ada',
  guestLastName: 'Lovelace',
  guestEmail: 'ada@example.com',
  guestCount: 2,
  startDate: '2099-01-10',
  endDate: '2099-01-12',
  cancellationsCount: 0,
  status: 'PENDING',
  ...over,
})

describe('HostAccommodationRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bookingApi.getReservationRequestsByAccommodation).mockResolvedValue([
      makeRequest(),
      makeRequest({ id: 'r2', status: 'APPROVED' }),
      makeRequest({ id: 'r3', status: 'REJECTED' }),
    ] as any)
    vi.mocked(accApi.getAutoConfirm).mockResolvedValue(false)
    vi.mocked(accApi.updateAutoConfirm).mockResolvedValue(undefined as any)
    vi.mocked(bookingApi.updateReservationRequestStatus).mockResolvedValue(undefined as any)
  })

  it('renders requests, toggles auto-approve, and approves/rejects a pending request', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/requests' }] as any}>
        <Routes>
          <Route path="/booking/:id/requests" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation requests/i)).toBeInTheDocument()

    // Toggle auto-approve
  const switchCtl = screen.getByRole('switch', { name: /auto-approve new requests/i })
    fireEvent.click(switchCtl)
    expect(accApi.updateAutoConfirm).toHaveBeenCalledWith('abc', true)

    // Approve
  const approve = await screen.findByRole('button', { name: /^approve$/i })
  fireEvent.click(approve)
    expect(bookingApi.updateReservationRequestStatus).toHaveBeenCalledWith('r1', 'APPROVED')

    // Reject (pending was already approved; simulate click on reject still triggers call)
  const reject = await screen.findByRole('button', { name: /^reject$/i })
  fireEvent.click(reject)
    expect(bookingApi.updateReservationRequestStatus).toHaveBeenCalledWith('r1', 'REJECTED')

    // Pagination controls exist
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
  })
})
