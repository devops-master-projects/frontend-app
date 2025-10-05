import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import type { SearchResponse } from '../../features/accommodations/api/accommodationsApi'

// Mock heavy external libs to avoid many file opens during test runs
vi.mock('@mui/icons-material', () => ({
  KeyboardArrowLeft: () => null,
  KeyboardArrowRight: () => null,
}))
vi.mock('react-swipeable-views', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}))

// Default getRole mock (guest). We'll reconfigure via spy in tests when needed.
vi.mock('../../features/auth/api/authApi', () => ({ getRole: () => 'GUEST' }))
import AccommodationCard from '../../features/accommodations/pages/AccommodationCard'
import * as authApi from '../../features/auth/api/authApi'

describe('AccommodationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeSearchItem = (overrides: Partial<SearchResponse>): SearchResponse => ({
    id: 'id',
    name: 'Name',
    description: '',
    location: { city: '', country: '', address: '', postalCode: '' },
    photos: [],
    amenities: [],
    minGuests: 0,
    maxGuests: 0,
    totalPrice: 0,
    unitPrice: 0,
    pricingMode: 'FIXED',
    ...overrides,
  })

  it('renders basic information and details link', () => {
    const acc = makeSearchItem({
      id: '1', name: 'House', location: { city: 'X', country: 'Y', address: '', postalCode: '' }, description: 'Nice place', photos: ['p1.jpg', 'p2.jpg'], minGuests: 1, maxGuests: 2,
    })
    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc} />
      </BrowserRouter>
    )

    expect(screen.getByText(/House/)).toBeInTheDocument()
    expect(screen.getByText(/X, Y/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /details/i })).toBeInTheDocument()
  })

  it('does not show edit for guest and shows for host', async () => {
    const acc = makeSearchItem({ id: '1', name: 'House', location: { city: 'X', country: 'Y', address: '', postalCode: '' }, photos: [], minGuests: 1, maxGuests: 2 })

    // Guest (default mock)
    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc} />
      </BrowserRouter>
    )
  expect(screen.queryByRole('link', { name: /edit/i })).toBeNull()

    // now mock host by spying on getRole
    const spy = vi.spyOn(authApi, 'getRole').mockImplementation(() => 'HOST')
    // re-render with host behavior
    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc} />
      </BrowserRouter>
    )
  expect(screen.getAllByRole('link', { name: /edit/i }).length).toBeGreaterThanOrEqual(1)
    spy.mockRestore()
  })

  it('handles carousel next/back and disables at ends', async () => {
    const acc = makeSearchItem({ id: '1', name: 'House', location: { city: 'X', country: 'Y', address: '', postalCode: '' }, description: 'Nice', photos: ['p1.jpg', 'p2.jpg'], minGuests: 1, maxGuests: 2 })

    // Host role to also render EDIT button (exercise branch)
    vi.spyOn(authApi, 'getRole').mockImplementation(() => 'HOST')

    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc} />
      </BrowserRouter>
    )

    const user = userEvent.setup()
    const nextBtn = screen.getByRole('button', { name: /next/i })
    const backBtn = screen.getByRole('button', { name: /back/i })

    expect(backBtn).toBeDisabled()
    expect(nextBtn).not.toBeDisabled()

    await user.click(nextBtn)
    // At last step, next should become disabled and back enabled
    expect(nextBtn).toBeDisabled()
    expect(backBtn).not.toBeDisabled()

    await user.click(backBtn)
    expect(backBtn).toBeDisabled()
  })
})
