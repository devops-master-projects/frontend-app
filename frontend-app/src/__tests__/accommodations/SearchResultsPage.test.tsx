import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { searchAccommodations } from '../../features/accommodations/api/accommodationsApi'
import { getRole } from '../../features/auth/api/authApi'
import SearchResultsPage from '../../features/accommodations/pages/SearchResultsPage'
import * as ReactRouterDom from 'react-router-dom'

vi.mock('../../features/auth/api/authApi.ts', () => ({
  getRole: vi.fn(),
}))

vi.mock('../../features/accommodations/api/accommodationsApi', () => ({
  searchAccommodations: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({ state: {} })),
  }
})

vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({
  default: ({ onSearch }: { onSearch?: (f: unknown) => void }) => (
    <button onClick={() => onSearch?.({})}>Host Search</button>
  ),
}))

vi.mock('../../features/accommodations/navbar/GuestNavbar.tsx', () => ({
  default: ({ onSearch }: { onSearch?: (f: unknown) => void }) => (
    <button onClick={() => onSearch?.({})}>Guest Search</button>
  ),
}))

describe('SearchResultsPage', () => {
  const mockNavigate = vi.fn()
  const mockSearch = vi.mocked(searchAccommodations)
  const mockRole = vi.mocked(getRole)

  const { useNavigate, useLocation } = vi.mocked(ReactRouterDom)

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(mockNavigate)
  })

  it('renders HostNavbar when role is HOST', () => {
    mockRole.mockReturnValue('HOST')
    useLocation.mockReturnValue({
        state: { results: [] },
        key: '',
        pathname: '',
        search: '',
        hash: ''
    })

    render(
      <MemoryRouter>
        <SearchResultsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Host Search')).toBeInTheDocument()
    expect(screen.getByText(/search results/i)).toBeInTheDocument()
  })

  it('renders GuestNavbar when role is GUEST', () => {
    mockRole.mockReturnValue('GUEST')
    useLocation.mockReturnValue({
        state: { results: [] },
        key: '',
        pathname: '',
        search: '',
        hash: ''
    })

    render(
      <MemoryRouter>
        <SearchResultsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Guest Search')).toBeInTheDocument()
  })

  it('renders initial results', () => {
    mockRole.mockReturnValue('GUEST')
    const results = [
      {
        id: 1,
        name: 'Cozy Cabin',
        description: 'Nice place',
        location: { city: 'Belgrade', country: 'Serbia' },
        minGuests: 1,
        maxGuests: 3,
        totalPrice: 200,
        unitPrice: 50,
        pricingMode: 'NIGHT',
        photos: ['http://img.jpg'],
        amenities: ['WiFi', 'Parking'],
      },
    ]
    useLocation.mockReturnValue({
        state: { results },
        key: '',
        pathname: '',
        search: '',
        hash: ''
    })

    render(
      <MemoryRouter>
        <SearchResultsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Cozy Cabin')).toBeInTheDocument()
    expect(screen.getByText(/belgrade/i)).toBeInTheDocument()
    expect(screen.getByText(/wifi/i)).toBeInTheDocument()
  })

  it('shows message when no results', () => {
    mockRole.mockReturnValue('HOST')
    useLocation.mockReturnValue({
        state: { results: [] },
        key: '',
        pathname: '',
        search: '',
        hash: ''
    })

    render(
      <MemoryRouter>
        <SearchResultsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/no accommodations found/i)).toBeInTheDocument()
  })

  it('navigates to accommodation details on card click', () => {
    mockRole.mockReturnValue('GUEST')
    const results = [
      {
        id: 2,
        name: 'Apartment',
        description: 'Desc',
        location: { city: 'Novi Sad', country: 'Serbia' },
        minGuests: 2,
        maxGuests: 4,
        totalPrice: 100,
        unitPrice: 25,
        pricingMode: 'NIGHT',
        photos: [],
        amenities: [],
      },
    ]
    useLocation.mockReturnValue({
        state: { results },
        key: '',
        pathname: '',
        search: '',
        hash: ''
    })

    render(
      <MemoryRouter>
        <SearchResultsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Apartment'))
    expect(mockNavigate).toHaveBeenCalledWith('/accommodations/2')
  })

  it('calls searchAccommodations and updates results on onSearch', async () => {
    mockRole.mockReturnValue('HOST')
    useLocation.mockReturnValue({
        state: { results: [] },
        key: '',
        pathname: '',
        search: '',
        hash: ''
    })
    mockSearch.mockResolvedValue([
      {
        id: "3",
        name: 'Villa',
        description: 'Luxury',
        location: {
            city: 'Budva', country: 'Montenegro',
            address: '',
            postalCode: ''
        },
        minGuests: 1,
        maxGuests: 5,
        totalPrice: 300,
        unitPrice: 100,
        pricingMode: 'PER_NIGHT',
        photos: [],
        amenities: ['Pool'],
      },
    ])

    render(
      <MemoryRouter>
        <SearchResultsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Host Search'))

    await waitFor(() => expect(mockSearch).toHaveBeenCalled())

    expect(await screen.findByText('Villa')).toBeInTheDocument()
  })
})
