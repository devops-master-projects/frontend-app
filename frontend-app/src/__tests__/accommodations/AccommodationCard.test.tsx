import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock heavy external libs to avoid many file opens during test runs
vi.mock('@mui/icons-material', () => ({
  KeyboardArrowLeft: () => null,
  KeyboardArrowRight: () => null,
}))
vi.mock('react-swipeable-views', () => ({
  __esModule: true,
  default: (props: any) => props.children,
}))

// Default getRole mock (guest). We'll reconfigure via spy in tests when needed.
vi.mock('../../features/auth/api/authApi', () => ({ getRole: () => 'GUEST' }))
import AccommodationCard from '../../features/accommodations/pages/AccommodationCard'
import * as authApi from '../../features/auth/api/authApi'

describe('AccommodationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders basic information and details link', () => {
    const acc = {
      id: '1', name: 'House', location: { city: 'X', country: 'Y', address: '', postalCode: '' }, description: 'Nice place', photos: ['p1.jpg', 'p2.jpg'], amenities: [], minGuests: 1, maxGuests: 2
    }
    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc as any} />
      </BrowserRouter>
    )

    expect(screen.getByText(/House/)).toBeInTheDocument()
    expect(screen.getByText(/X, Y/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /details/i })).toBeInTheDocument()
  })

  it('does not show edit for guest and shows for host', async () => {
    const acc = { id: '1', name: 'House', location: { city: 'X', country: 'Y', address: '', postalCode: '' }, description: '', photos: [], amenities: [], minGuests: 1, maxGuests: 2 }

    // Guest (default mock)
    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc as any} />
      </BrowserRouter>
    )
  expect(screen.queryByRole('link', { name: /edit/i })).toBeNull()

    // now mock host by spying on getRole
    const spy = vi.spyOn(authApi, 'getRole').mockImplementation(() => 'HOST')
    // re-render with host behavior
    render(
      <BrowserRouter>
        <AccommodationCard accommodation={acc as any} />
      </BrowserRouter>
    )
  expect(screen.getAllByRole('link', { name: /edit/i }).length).toBeGreaterThanOrEqual(1)
    spy.mockRestore()
  })
})
