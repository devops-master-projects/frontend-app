import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import * as bookingApi from '../../features/booking/api/bookingApi'
import AvailabilityPage from '../../features/booking/pages/AvailabilityCalendarPage'
import type { AvailabilityResponseDto } from '../../features/booking/api/bookingApi'

// Mock heavy components
vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => null }))

// Mock react-big-calendar with a lightweight shim exposing hooks to trigger selection
type CalendarEvent = { id: string; title: string; start: Date; end: Date; allDay?: boolean; resource?: { status: string }; priceType?: string }
vi.mock('react-big-calendar', () => ({
  Calendar: (props: { events?: CalendarEvent[]; onSelectSlot?: (slot: { start: Date; end: Date }) => void; onSelectEvent?: (e: CalendarEvent) => void }): ReactElement => {
    const { events = [], onSelectSlot, onSelectEvent } = props
    return (
      <div>
        <div>CalendarMock</div>
        <div data-testid="events-count">{events.length}</div>
        <div data-testid="events-json">{JSON.stringify(events)}</div>
        <button onClick={() => onSelectSlot && onSelectSlot({ start: new Date(2099, 0, 14), end: new Date(2099, 0, 16) })}>select-slot-ok</button>
        <button onClick={() => onSelectSlot && onSelectSlot({ start: new Date(2000, 0, 1), end: new Date(2000, 0, 2) })}>select-slot-past</button>
        <button onClick={() => onSelectSlot && onSelectSlot({ start: new Date(2099, 0, 11), end: new Date(2099, 0, 13) })}>select-slot-overlap</button>
        <button onClick={() => {
          const ev = events.find((e) => e.resource?.status === 'AVAILABLE') as CalendarEvent | undefined
          if (onSelectEvent && ev) onSelectEvent(ev)
        }}>select-available-event</button>
        <button onClick={() => onSelectEvent && onSelectEvent({ id: 'res1', title: 'Reserved', start: new Date(2099,0,22), end: new Date(2099,0,23,23,59,59,999), allDay: true, resource: { status: 'RESERVED' }, priceType: 'NORMAL' })}>select-reserved-event</button>
      </div>
    )
  },
  momentLocalizer: () => ({} as unknown as never),
}))

vi.mock('../../features/booking/api/bookingApi.ts', () => ({
  getAvailability: vi.fn(),
  createAvailability: vi.fn(),
  updateAvailability: vi.fn(),
  deleteAvailability: vi.fn(),
}))

describe('AvailabilityCalendarPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // One existing available block: 2099-01-10 .. 2099-01-12
        vi.mocked(bookingApi.getAvailability).mockResolvedValue([
        { id: 'av1', accommodationId: 'abc', startDate: '2099-01-10', endDate: '2099-01-12', price: 100, priceType: 'NORMAL', status: 'AVAILABLE' },
        ] as AvailabilityResponseDto[])
        vi.mocked(bookingApi.createAvailability).mockResolvedValue({ id: 'new1', accommodationId: 'abc', startDate: '2099-01-14', endDate: '2099-01-15', price: 150, priceType: 'HOLIDAY', status: 'AVAILABLE' } as AvailabilityResponseDto)
        vi.mocked(bookingApi.updateAvailability).mockResolvedValue({ id: 'av1', accommodationId: 'abc', startDate: '2099-01-10', endDate: '2099-01-12', price: 200, priceType: 'SEASONAL', status: 'AVAILABLE' } as AvailabilityResponseDto)
        vi.mocked(bookingApi.deleteAvailability).mockResolvedValue(undefined)
    })

    it('loads availability and creates a new availability on save', async () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }]}>
                <Routes>
                <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
                </Routes>
            </MemoryRouter>
        )

        // Page heading ensures render
        expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()

  const user = userEvent.setup()
  await user.click(screen.getByText('select-slot-ok'))
        fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '150' } })
  await user.click(screen.getByRole('button', { name: /save/i }))

        expect(bookingApi.createAvailability).toHaveBeenCalledWith({
        accommodationId: 'abc',
        startDate: '2099-01-14',
        endDate: '2099-01-15',
        price: 150,
        priceType: 'NORMAL',
        })
    })

    it('edits and deletes an existing availability', async () => {
        render(
  <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }]}>
            <Routes>
            <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
            </Routes>
        </MemoryRouter>
        )

  expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()
  const user = userEvent.setup()
  await user.click(screen.getByText('select-available-event'))
        expect(await screen.findByText(/edit availability/i)).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '200' } })
  await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(bookingApi.updateAvailability).toHaveBeenCalled()

    // Wait for edit dialog to close after save
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /edit availability/i })).toBeNull()
    })

    // Re-open edit dialog to ensure editTarget is set before deletion
  await user.click(screen.getByText('select-available-event'))
    expect(await screen.findByRole('dialog', { name: /edit availability/i })).toBeInTheDocument()

    // Initiate delete flow
  await user.click(screen.getByRole('button', { name: /^delete$/i }))

    const prompt = await screen.findByText(/are you sure you want to delete/i)
    const dialogEl = prompt.closest('[role="dialog"]') as HTMLElement

    const confirmBtn = await within(dialogEl).findByRole('button', { name: /^delete$/i })

        await user.click(confirmBtn)
    await waitFor(() =>
         expect(bookingApi.deleteAvailability).toHaveBeenCalled())
    })

  it('ignores past selection and does not open modal', async () => {
    render(
  <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }]}>
        <Routes>
          <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-slot-past'))
    expect(screen.queryByText(/new availability/i)).toBeNull()
    expect(bookingApi.createAvailability).not.toHaveBeenCalled()
  })

  it('prevents creating availability when selected slot overlaps existing', async () => {
    render(
  <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }]}>
        <Routes>
          <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-slot-overlap'))
    expect(screen.queryByText(/new availability/i)).toBeNull()
    expect(bookingApi.createAvailability).not.toHaveBeenCalled()
  })

  it('refuses to open edit for RESERVED event', async () => {
    render(
  <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }]}>
        <Routes>
          <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-reserved-event'))
    expect(screen.queryByText(/edit availability/i)).toBeNull()
  })

  it('does not update when end date is earlier than start date', async () => {
    render(
  <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }]}>
        <Routes>
          <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-available-event'))
    expect(await screen.findByText(/edit availability/i)).toBeInTheDocument()

    // Set end date before start date
    const startVal = (screen.getByLabelText(/start date/i) as HTMLInputElement).value
    const startDate = new Date(startVal)
    const invalidEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()-1)
    const yyyy = invalidEnd.getFullYear()
    const mm = String(invalidEnd.getMonth()+1).padStart(2,'0')
    const dd = String(invalidEnd.getDate()).padStart(2,'0')
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: `${yyyy}-${mm}-${dd}` } })
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(bookingApi.updateAvailability).not.toHaveBeenCalled()
  })

  it('does not update when edited range overlaps a RESERVED block', async () => {
    // Override availability to include a RESERVED event overlapping the available block
    vi.mocked(bookingApi.getAvailability).mockResolvedValueOnce([
      { id: 'av1', accommodationId: 'abc', startDate: '2099-01-10', endDate: '2099-01-12', price: 100, priceType: 'NORMAL', status: 'AVAILABLE' },
      { id: 'rv1', accommodationId: 'abc', startDate: '2099-01-11', endDate: '2099-01-11', price: 0, priceType: 'NORMAL', status: 'RESERVED' },
    ] as AvailabilityResponseDto[])

    render(
  <MemoryRouter initialEntries={[{ pathname: '/booking/abc/availability' }] }>
        <Routes>
          <Route path="/booking/:id/availability" element={<AvailabilityPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/availability calendar/i)).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('select-available-event'))
    expect(await screen.findByText(/edit availability/i)).toBeInTheDocument()
    // Without changing dates, the overlap with RESERVED should prevent update
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(bookingApi.updateAvailability).not.toHaveBeenCalled()
  })
})
