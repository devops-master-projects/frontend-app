import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as api from '../../features/accommodations/api/accommodationsApi'
import * as amen from '../../features/accommodations/api/amenitiesApi'
import EditPage from '../../features/accommodations/pages/EditAccommodationPage'

vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => null }))
vi.mock('../../features/accommodations/api/accommodationsApi', () => ({
  fetchAccommodationById: vi.fn(),
  updateAccommodation: vi.fn(),
  uploadPhotoToCloudinary: vi.fn(),
}))
vi.mock('../../features/accommodations/api/amenitiesApi', () => ({
  fetchAmenities: vi.fn(),
}))
vi.setConfig({ testTimeout: 15000 })


const existing = {
  id: 'a1',
  name: 'Casa',
  location: { country: 'RS', city: 'BG', address: 'Street', postalCode: '11000' },
  minGuests: 1,
  maxGuests: 3,
  description: 'Desc',
  autoConfirm: false,
  pricingMode: 'FIXED',
  urlPhotos: ['old.jpg'],
  amenities: [{ id: 'am1', name: 'Wifi' }],
}

describe('EditAccommodationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(amen.fetchAmenities).mockResolvedValue([{ id: 'am1', name: 'Wifi' }] as any)
    // JSDOM doesn’t have URL.createObjectURL
    ;(global.URL as any).createObjectURL = vi.fn(() => 'blob://test')
  })

  it('loads data, allows adding a photo and updates accommodation', async () => {
    vi.mocked(api.fetchAccommodationById).mockResolvedValue(existing as any)
    vi.mocked(api.uploadPhotoToCloudinary).mockResolvedValue('http://img/new.jpg')
    vi.mocked(api.updateAccommodation).mockResolvedValue(undefined as any)

    render(
      <MemoryRouter initialEntries={['/accommodations/a1/edit']}>
        <Routes>
          <Route path="/accommodations/:id/edit" element={<EditPage />} />
          <Route path="/accommodations/a1" element={<div>Details</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for accommodation to load
    expect(await screen.findByDisplayValue(/casa/i)).toBeInTheDocument()

    // Add a new file to upload
    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
    const input = screen.getByText(/drag & drop/i).parentElement!.querySelector('input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /update accommodation/i }))

    await waitFor(() => expect(api.uploadPhotoToCloudinary).toHaveBeenCalled())
    await waitFor(() => expect(api.updateAccommodation).toHaveBeenCalled())

    const [id, payload] = vi.mocked(api.updateAccommodation).mock.calls[0]
    expect(id).toBe('a1')
    expect(payload.photos).toContain('old.jpg')
    expect(payload.photos).toContain('http://img/new.jpg')

    // Snackbar appears and navigation to /a1 should eventually happen
    expect(await screen.findByText(/updated successfully/i)).toBeInTheDocument()
  })

  it('shows validation errors if required fields are empty', async () => {
    vi.mocked(api.fetchAccommodationById).mockResolvedValue({ ...existing, name: '' } as any)

    render(
      <MemoryRouter initialEntries={['/accommodations/a1/edit']}>
        <Routes>
          <Route path="/accommodations/:id/edit" element={<EditPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for preloaded form
    await screen.findByLabelText(/name/i)

    // Click update → triggers validation
    fireEvent.click(screen.getByRole('button', { name: /update accommodation/i }))
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('removes an existing photo and preserves remaining photos on submit', async () => {
    vi.mocked(api.fetchAccommodationById).mockResolvedValue({ ...existing, urlPhotos: ['one.jpg', 'two.jpg'] } as any)
    vi.mocked(api.uploadPhotoToCloudinary).mockResolvedValue('http://img/new.jpg')
    vi.mocked(api.updateAccommodation).mockResolvedValue(undefined as any)

    render(
      <MemoryRouter initialEntries={['/accommodations/a1/edit']}>
        <Routes>
          <Route path="/accommodations/:id/edit" element={<EditPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for loaded form
    await screen.findByDisplayValue(/casa/i)

    // Click the first ✕ to remove 'one.jpg'
    const removeButtons = await screen.findAllByRole('button', { name: '✕' })
    fireEvent.click(removeButtons[0])

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /update accommodation/i }))
    await waitFor(() => expect(api.updateAccommodation).toHaveBeenCalled())

    const [_id, payload] = vi.mocked(api.updateAccommodation).mock.calls[0]
    expect(payload.photos).toEqual(['two.jpg']) // only remaining one
  })

  it('covers all handler functions explicitly', async () => {
    vi.mocked(api.fetchAccommodationById).mockResolvedValue(existing as any)
    vi.mocked(api.updateAccommodation).mockResolvedValue(undefined as any)
    vi.mocked(api.uploadPhotoToCloudinary).mockResolvedValue('http://img/new.jpg')

    render(
        <MemoryRouter initialEntries={[{ pathname: '/accommodations/a1/edit' }] as any}>
        <Routes>
            <Route path="/accommodations/:id/edit" element={<EditPage />} />
        </Routes>
        </MemoryRouter>
    )

    // Wait for data to load
    const nameInput = await screen.findByDisplayValue(/casa/i)

    // handleChange
    fireEvent.change(nameInput, { target: { value: 'New name' } })

    // handleLocationChange for each location field
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Serbia' } })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Belgrade' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Main St' } })
    fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '11000' } })

    // handleFileDrop
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const fileInput = screen
        .getByText(/drag & drop or click to select photos/i)
        .parentElement!.querySelector('input') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: { 0: file, length: 1, item: () => file } } })

  // handleChange (min/max guests)
  fireEvent.change(screen.getByLabelText(/min guests/i), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText(/max guests/i), { target: { value: '4' } })
  // handleChange (pricing mode) via MUI Select interaction
  const pricingSelect = screen.getByRole('combobox', { name: /pricing mode/i })
  fireEvent.mouseDown(pricingSelect)
  const perNight = await screen.findByRole('option', { name: /per night/i })
  fireEvent.click(perNight)

    // handleChange (description)
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Nice place' } })

    // handleChange (autoConfirm toggle)
    fireEvent.click(screen.getByLabelText(/auto confirm/i))

    // Remove local photo (cover setLocalPhotos)
    await waitFor(() => {
        const removeBtns = screen.getAllByRole('button', { name: '✕' })
        fireEvent.click(removeBtns[removeBtns.length - 1])
    })

    // Submit (cover success + loading flow)
    fireEvent.click(screen.getByRole('button', { name: /update accommodation/i }))
    await waitFor(() => expect(api.updateAccommodation).toHaveBeenCalled())

    // Snackbar should show (covers success state)
    expect(await screen.findByText(/updated successfully/i)).toBeInTheDocument()
    })

})
