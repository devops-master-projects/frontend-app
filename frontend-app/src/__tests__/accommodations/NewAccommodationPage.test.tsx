import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as api from '../../features/accommodations/api/accommodationsApi'
import type { AccommodationResponseDto } from '../../features/accommodations/api/accommodationsApi'
import * as amen from '../../features/accommodations/api/amenitiesApi'
import type { AmenityResponseDto } from '../../features/accommodations/api/amenitiesApi'
import NewPage from '../../features/accommodations/pages/NewAccommodationPage'

vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => null }))
vi.mock('../../features/accommodations/api/accommodationsApi', () => ({
  createAccommodation: vi.fn(),
  uploadPhotoToCloudinary: vi.fn()
}))
vi.mock('../../features/accommodations/api/amenitiesApi', () => ({ fetchAmenities: vi.fn() }))
vi.setConfig({ testTimeout: 15000 })

describe('NewAccommodationPage', () => {
  // Setup console.error mock BEFORE beforeEach
  beforeAll(() => {
    // Suppress specific console errors that are expected in tests
    const originalError = console.error;
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const msg = String(args[0] || '');
      // Suppress act warnings and AggregateError messages
      if (msg.includes('act') ||
          msg.includes('AggregateError') ||
          msg.includes('Warning: An update to') ||
          msg.includes('Warning: ReactDOM.render')) {
        return;
      }
      // Log other errors for debugging
      originalError.apply(console, args);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks()

    // Ensure fetchAmenities resolves immediately to avoid timing issues
    vi.mocked(amen.fetchAmenities).mockResolvedValue([
      { id: 'am1', name: 'Wifi', description: '' }
    ] as AmenityResponseDto[])

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob://test')
  })

  it('validates required fields and does not submit without photo', async () => {
    render(
        <MemoryRouter initialEntries={[{ pathname: '/accommodations/new' }]}>
          <Routes>
            <Route path="/accommodations/new" element={<NewPage />} />
          </Routes>
        </MemoryRouter>
    )

    // Wait for amenities to load
    await waitFor(() => expect(amen.fetchAmenities).toHaveBeenCalled())

    // Click save button
    await userEvent.click(screen.getByRole('button', { name: /save accommodation/i }))

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })

    // Ensure create API was not called
    expect(api.createAccommodation).not.toHaveBeenCalled()
  })

  it('submits when valid: uploads photo and creates accommodation', async () => {
    vi.mocked(api.uploadPhotoToCloudinary).mockResolvedValue('http://img/p1.jpg')
    const created: AccommodationResponseDto = {
      id: 'a1',
      name: 'Cabin',
      minGuests: 1,
      maxGuests: 2,
      description: 'Nice',
      urlPhotos: ['http://img/p1.jpg'],
      location: { country: 'Serbia', city: 'Belgrade', address: 'Main', postalCode: '11000' },
      autoConfirm: false,
      pricingMode: 'PER_NIGHT',
      amenities: [],
    }
    vi.mocked(api.createAccommodation).mockResolvedValue(created)

    render(
        <MemoryRouter initialEntries={[{ pathname: '/accommodations/new' }]}>
          <Routes>
            <Route path="/accommodations/new" element={<NewPage />} />
            <Route path="/accommodations" element={<div>List</div>} />
          </Routes>
        </MemoryRouter>
    )

    // Wait for component to be ready
    await waitFor(() => expect(amen.fetchAmenities).toHaveBeenCalled())

    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/name/i), 'Cabin')
    await userEvent.type(screen.getByLabelText(/^country$/i), 'Serbia')
    await userEvent.type(screen.getByLabelText(/city/i), 'Belgrade')
    await userEvent.type(screen.getByLabelText(/address/i), 'Main')
    await userEvent.type(screen.getByLabelText(/postal code/i), '11000')
    await userEvent.type(screen.getByLabelText(/description/i), 'Nice')

    // Add photo
    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
    const uploader = screen.getByRole('button', { name: /drag & drop or click to select photos/i })
    const input = uploader.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(input, file)

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /save accommodation/i }))

    // Wait for API call
    await waitFor(() => {
      expect(api.uploadPhotoToCloudinary).toHaveBeenCalled()
      expect(api.createAccommodation).toHaveBeenCalled()
    }, { timeout: 5000 })
  })
})