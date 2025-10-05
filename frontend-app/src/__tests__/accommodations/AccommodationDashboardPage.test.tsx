import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import type { SearchResponse } from '../../features/accommodations/api/accommodationsApi'

// Lightweight stubs for navbars and card
vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({
  default: (props: { onSearch?: (filters: { q?: string }) => void; onHome?: () => void }): ReactElement => (
    <div>
      <button data-testid="host-search" onClick={() => props.onSearch && props.onSearch({ q: 'beach' })}>Search</button>
      <button data-testid="host-home" onClick={() => props.onHome && props.onHome()}>Home</button>
    </div>
  )
}))
vi.mock('../../features/accommodations/navbar/GuestNavbar.tsx', () => ({
  default: (props: { onHome?: () => void }): ReactElement => (
    <div>
      <button data-testid="guest-home" onClick={() => props.onHome && props.onHome()}>Home</button>
    </div>
  )
}))
vi.mock('../../features/accommodations/pages/AccommodationCard', () => ({
  default: (props: { accommodation: SearchResponse }): ReactElement => <div data-testid={`acc-${props.accommodation.id}`}>{props.accommodation.name}</div>
}))

// Mock role and API
vi.mock('../../features/auth/api/authApi', () => ({ getRole: vi.fn(() => 'GUEST') }))
vi.mock('../../features/accommodations/api/accommodationsApi', () => ({
  fetchAccommodations: vi.fn(),
  searchAccommodations: vi.fn()
}))

import * as api from '../../features/accommodations/api/accommodationsApi'
import Dashboard from '../../features/accommodations/pages/AccommodationDashboard'
import * as auth from '../../features/auth/api/authApi'

const makeItems = (n: number): SearchResponse[] => Array.from({ length: n }).map((_, i) => ({
  id: String(i + 1),
  name: `Place ${i + 1}`,
  location: { city: 'X', country: 'Y', address: '', postalCode: '' },
  description: '',
  photos: [],
  amenities: [],
  minGuests: 1,
  maxGuests: 2,
  totalPrice: 0,
  unitPrice: 0,
  pricingMode: 'FIXED',
}))

describe('AccommodationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders list, paginates, and onHome resets to first page', async () => {
  vi.mocked(api.fetchAccommodations).mockResolvedValue(makeItems(7))

    render(
  <MemoryRouter initialEntries={[{ pathname: '/accommodations' }]}>
        <Routes>
          <Route path="/accommodations" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    )

    // Header and first page items
    expect(await screen.findByRole('heading', { name: /accommodations/i })).toBeInTheDocument()
    expect(screen.getByTestId('acc-1')).toBeInTheDocument()
    expect(screen.getByTestId('acc-6')).toBeInTheDocument()
    expect(screen.queryByTestId('acc-7')).toBeNull()

  // Go to page 2 (MUI uses aria-label "Go to page 2")
  fireEvent.click(screen.getByRole('button', { name: /go to page 2/i }))
    expect(await screen.findByTestId('acc-7')).toBeInTheDocument()
    expect(screen.queryByTestId('acc-1')).toBeNull()

    // Trigger onHome via mocked navbar button
    fireEvent.click(screen.getByTestId('guest-home'))
    expect(await screen.findByTestId('acc-1')).toBeInTheDocument()
  })

  it('HOST: home refreshes accommodations and search navigates to results', async () => {
  vi.mocked(api.fetchAccommodations).mockResolvedValue(makeItems(3))
    const results = makeItems(2)
  const searchSpy = vi.spyOn(api, 'searchAccommodations').mockResolvedValue(results)
    vi.spyOn(auth, 'getRole').mockImplementation(() => 'HOST')

    const ResultsView = () => {
      const loc = useLocation() as { state?: { results?: SearchResponse[] } }
      return <div>Results {loc.state?.results?.length ?? 0}</div>
    }

    render(
  <MemoryRouter initialEntries={[{ pathname: '/accommodations' }]}>
        <Routes>
          <Route path="/accommodations" element={<Dashboard />} />
          <Route path="/search-results" element={<ResultsView />} />
        </Routes>
      </MemoryRouter>
    )

    // Initially on accommodations
    expect(await screen.findByRole('heading', { name: /accommodations/i })).toBeInTheDocument()

    // Trigger home via host navbar (remains on same route but refreshes list)
    fireEvent.click(screen.getByTestId('host-home'))
    expect(await screen.findByRole('heading', { name: /accommodations/i })).toBeInTheDocument()

    // Trigger search via host navbar and navigate to results route
    fireEvent.click(screen.getByTestId('host-search'))
    expect(await screen.findByText(/results 2/i)).toBeInTheDocument()
    expect(searchSpy).toHaveBeenCalled()
  })
})
