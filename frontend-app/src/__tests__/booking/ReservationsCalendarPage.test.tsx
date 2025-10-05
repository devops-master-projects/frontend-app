import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as bookingApi from '../../features/booking/api/bookingApi'
import * as accApi from '../../features/accommodations/api/accommodationsApi'
import Page from '../../features/booking/pages/ReservationsCalendarPage'

vi.mock('../../features/accommodations/navbar/GuestNavbar.tsx', () => ({ default: () => null }))

// Mock calendar
vi.mock('react-big-calendar', () => ({
  Calendar: (props: any) => {
    const { onSelectSlot, onSelectEvent } = props
    return (
      <div>
        <div>CalendarMock</div>
        <button onClick={() => onSelectSlot && onSelectSlot({ start: new Date(2099,0,2), end: new Date(2099,0,4) } as any)}>select-slot-ok</button>
        <button onClick={() => onSelectSlot && onSelectSlot({ start: new Date(2099,2,1), end: new Date(2099,2,2) } as any)}>select-slot-outside</button>
        <button onClick={() => onSelectEvent && onSelectEvent({ id: 'req1', title: 'Reservation request', start: new Date(2099,0,10), end: new Date(2099,0,11,23,59,59,999), allDay: true, resource: { status: 'PENDING' }, priceType: 'NORMAL', guestCount: 2 })}>select-pending</button>
        <button onClick={() => onSelectEvent && onSelectEvent({ id: 'res1', title: 'Your reservation!', start: new Date(2099,0,20), end: new Date(2099,0,21,23,59,59,999), allDay: true, resource: { status: 'APPROVED' }, priceType: 'NORMAL' })}>select-approved</button>
        <button onClick={() => onSelectEvent && onSelectEvent({ id: 'res2', title: 'Your reservation!', start: new Date(), end: new Date(), allDay: true, resource: { status: 'APPROVED' }, priceType: 'NORMAL' })}>select-approved-too-late</button>
      </div>
    )
  },
  momentLocalizer: () => ({} as any),
}))

vi.mock('../../features/booking/api/bookingApi.ts', () => ({
  getAvailability: vi.fn(),
  getReservationRequestsByGuest: vi.fn(),
  createReservationRequest: vi.fn(),
  updateReservationRequest: vi.fn(),
  deleteReservationRequest: vi.fn(),
  cancelReservation: vi.fn(),
}))

vi.mock('../../features/accommodations/api/accommodationsApi.ts', () => ({
  fetchAccommodationById: vi.fn(),
}))

describe('ReservationsCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Availability: wide range to allow edits/creates: 2099-01-01 .. 2099-02-01
    vi.mocked(bookingApi.getAvailability).mockResolvedValue([
      { id: 'a1', startDate: '2099-01-01', endDate: '2099-02-01', price: 50, priceType: 'NORMAL', status: 'AVAILABLE' },
    ] as any)
    // Requests: one PENDING (will be edited) and exclude REJECTED
    vi.mocked(bookingApi.getReservationRequestsByGuest).mockResolvedValue([
      { id: 'req1', startDate: '2099-01-10', endDate: '2099-01-11', status: 'PENDING', guestCount: 2, connectedReservationCancelled: false },
    ] as any)
    vi.mocked(accApi.fetchAccommodationById).mockResolvedValue({ id: 'id', name: 'Acc', minGuests: 1, maxGuests: 4, description: '', urlPhotos: [], location: { country: '', city: '', address: '', postalCode: '' }, autoConfirm: false, pricingMode: 'FIXED', amenities: [] } as any)
    vi.mocked(bookingApi.createReservationRequest).mockResolvedValue({ id: 'newReq', startDate: '2099-01-02', endDate: '2099-01-03', status: 'PENDING', guestCount: 1 } as any)
    vi.mocked(bookingApi.updateReservationRequest).mockResolvedValue({ id: 'req1', startDate: '2099-01-10', endDate: '2099-01-11', status: 'PENDING', guestCount: 3 } as any)
    vi.mocked(bookingApi.deleteReservationRequest).mockResolvedValue(undefined as any)
    vi.mocked(bookingApi.cancelReservation).mockResolvedValue(undefined as any)
  })

  it('creates a new reservation request from available days', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/reservations' }] as any}>
        <Routes>
          <Route path="/booking/:id/reservations" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation calendar/i)).toBeInTheDocument()

  const user = userEvent.setup()
  await user.click(screen.getByText('select-slot-ok'))
    // Guest count prefilled within range; confirm
  await user.click(screen.getByRole('button', { name: /reserve/i }))
    expect(bookingApi.createReservationRequest).toHaveBeenCalled()
  })

  it('edits a pending request guest count and deletes it', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/reservations' }] as any}>
        <Routes>
          <Route path="/booking/:id/reservations" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation calendar/i)).toBeInTheDocument()

    // Open edit dialog for PENDING
    const user = userEvent.setup()
    await user.click(screen.getByText('select-pending'))
    const gc = await screen.findByLabelText(/guest count/i)
  fireEvent.change(gc, { target: { value: '3' } })
  await user.click(screen.getByRole('button', { name: /^save$/i }))
  // Wait for async call
  await new Promise(r => setTimeout(r))
  expect(bookingApi.updateReservationRequest).toHaveBeenCalled()

    // Delete flow
    await user.click(screen.getByText('select-pending'))
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))
    expect(bookingApi.deleteReservationRequest).toHaveBeenCalled()
  })

  it('cancels an approved reservation when allowed', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/reservations' }] as any}>
        <Routes>
          <Route path="/booking/:id/reservations" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation calendar/i)).toBeInTheDocument()

  const user = userEvent.setup()
  await user.click(screen.getByText('select-approved'))
    // Cancel dialog opens; click confirm (assumes can cancel by design of mock date in far future)
  await user.click(await screen.findByRole('button', { name: /yes, cancel/i }))
    expect(bookingApi.cancelReservation).toHaveBeenCalled()
  })

  it('does not open reserve dialog when selected days are not all available', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/reservations' }] as any}>
        <Routes>
          <Route path="/booking/:id/reservations" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation calendar/i)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByText('select-slot-outside'))

    expect(screen.queryByText(/new reservation/i)).toBeNull()
    expect(bookingApi.createReservationRequest).not.toHaveBeenCalled()
  })

  it('does not update when edit date moves outside availability (branch returns)', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/reservations' }] as any}>
        <Routes>
          <Route path="/booking/:id/reservations" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-pending'))
    // Move end date to March 5, 2099 (outside availability window in mock)
    const endInput = await screen.findByLabelText(/end date/i)
    fireEvent.change(endInput, { target: { value: '2099-03-05' } })
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    // Should not call update since not allAvailable
    expect(bookingApi.updateReservationRequest).not.toHaveBeenCalled()
  })

  it('shows not allowed cancel state for an approved reservation too close to start', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/booking/abc/reservations' }] as any}>
        <Routes>
          <Route path="/booking/:id/reservations" element={<Page />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/reservation calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-approved-too-late'))
    // Button should be disabled and message should reflect too late to cancel
    const confirmBtn = await screen.findByRole('button', { name: /yes, cancel/i })
    expect(confirmBtn).toBeDisabled()
    expect(screen.getByText(/too late to cancel/i)).toBeInTheDocument()
  })
})
