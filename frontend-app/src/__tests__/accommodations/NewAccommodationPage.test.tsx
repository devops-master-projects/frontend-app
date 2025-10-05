import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as api from '../../features/accommodations/api/accommodationsApi'
import * as amen from '../../features/accommodations/api/amenitiesApi'
import NewPage from '../../features/accommodations/pages/NewAccommodationPage'

vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => null }))
vi.mock('../../features/accommodations/api/accommodationsApi', () => ({
  createAccommodation: vi.fn(),
  uploadPhotoToCloudinary: vi.fn()
}))
vi.mock('../../features/accommodations/api/amenitiesApi', () => ({ fetchAmenities: vi.fn() }))
vi.setConfig({ testTimeout: 15000 })

describe('NewAccommodationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(amen.fetchAmenities).mockResolvedValue([{ id: 'am1', name: 'Wifi' }] as any)
    ;(global.URL as any).createObjectURL = vi.fn(() => 'blob://test')
  })

  it('validates required fields and does not submit without photo', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/accommodations/new' }] as any}>
        <Routes>
          <Route path="/accommodations/new" element={<NewPage />} />
        </Routes>
      </MemoryRouter>
    )

  await userEvent.click(screen.getByRole('button', { name: /save accommodation/i }))
  expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  // Photo validation helper text may not render as visible text always; ensure create isn't called
    expect(api.createAccommodation).not.toHaveBeenCalled()
  })

  it('submits when valid: uploads photo and creates accommodation', async () => {
    vi.mocked(api.uploadPhotoToCloudinary).mockResolvedValue('http://img/p1.jpg')
    vi.mocked(api.createAccommodation).mockResolvedValue(undefined as any)

    render(
      <MemoryRouter initialEntries={[{ pathname: '/accommodations/new' }] as any}>
        <Routes>
          <Route path="/accommodations/new" element={<NewPage />} />
          <Route path="/accommodations" element={<div>List</div>} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Cabin' } })
    fireEvent.change(screen.getByLabelText(/^country$/i), { target: { value: 'Serbia' } })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Belgrade' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Main' } })
    fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '11000' } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Nice' } })

    // Add one file
  const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
  const uploader = screen.getByRole('button', { name: /drag & drop or click to select photos/i })
  const input = uploader.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: { 0: file, length: 1, item: () => file } } })

  await userEvent.click(screen.getByRole('button', { name: /save accommodation/i }))

    // Wait for the async pipeline to call the API
    await waitFor(() => expect(api.createAccommodation).toHaveBeenCalled(), { timeout: 4000 })
  })
})
