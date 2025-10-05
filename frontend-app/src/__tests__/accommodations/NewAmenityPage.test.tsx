import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as amen from '../../features/accommodations/api/amenitiesApi'
import NewAmenityPage from '../../features/accommodations/pages/NewAmenityPage'

vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => null }))
vi.mock('../../features/accommodations/api/amenitiesApi', () => ({ createAmenity: vi.fn() }))

describe('NewAmenityPage', () => {
  it('validates inputs and submits successfully', async () => {
    vi.mocked(amen.createAmenity).mockResolvedValue(undefined as any)

    render(
      <MemoryRouter initialEntries={[{ pathname: '/amenities/new' }] as any}>
        <Routes>
          <Route path="/amenities/new" element={<NewAmenityPage />} />
          <Route path="/accommodations" element={<div>Dash</div>} />
        </Routes>
      </MemoryRouter>
    )

    // First click without filling -> shows validation
  await userEvent.click(screen.getByRole('button', { name: /save amenity/i }))
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/description is required/i)).toBeInTheDocument()

    // Fill and submit
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Pool' } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Outdoor pool' } })
  await userEvent.click(screen.getByRole('button', { name: /save amenity/i }))

    // Assert API called
    expect(amen.createAmenity).toHaveBeenCalledWith({ name: 'Pool', description: 'Outdoor pool' })
  })
})
