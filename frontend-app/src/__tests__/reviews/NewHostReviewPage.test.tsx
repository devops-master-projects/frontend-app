/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Router mocks
const mockedNavigate = vi.fn()
const hostState = { firstName: 'Alice', lastName: 'Host' }
let params: { id?: string; reviewId?: string } = {}
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
  useParams: () => params,
  useLocation: () => ({ state: { host: hostState } }),
}))

// API mocks
const createHostReview = vi.fn()
const getHostReviewById = vi.fn()
const updateHostReview = vi.fn()
vi.mock('../../features/reviews/api/reviewApi', () => ({
  createHostReview: (...args: unknown[]) => createHostReview(...args),
  getHostReviewById: (...args: unknown[]) => getHostReviewById(...args),
  updateHostReview: (...args: unknown[]) => updateHostReview(...args),
}))

// MUI lightweight stubs
vi.mock('@mui/material', () => {
  const Box = (p: any) => <div {...p}>{p.children}</div>
  const Container = (p: any) => <div {...p}>{p.children}</div>
  const Paper = (p: any) => <div {...p}>{p.children}</div>
  const Typography = (p: any) => <div {...p}>{p.children}</div>
  // Render a simple slider-like control with buttons 1..5 for rating
  const Rating = (p: any) => (
    <div>
      Rating:{p.value}
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} aria-label={`rate-${n}`} onClick={() => p.onChange?.(null, n)}>
          {n}
        </button>
      ))}
    </div>
  )
  const TextField = (p: any) => (
    <input
      aria-label={p.label || 'input'}
      value={p.value}
      onChange={(e) => p.onChange?.({ target: { value: (e.target as HTMLInputElement).value } })}
    />
  )
  const Button = (p: any) => <button {...p}>{p.children}</button>
  return { Box, Container, Paper, Typography, Rating, TextField, Button }
})

// Navbar stub
vi.mock('../../features/accommodations/navbar/GuestNavbar.tsx', () => ({ default: () => <div>GuestNavbar</div> }))

import NewHostReviewPage from '../../features/reviews/pages/NewHostReviewPage'

describe('NewHostReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    params = { id: 'h1' } // default create mode
  })

  it('shows validation error when submitting without rating', async () => {
    createHostReview.mockResolvedValue(undefined)

    render(<NewHostReviewPage />)

    // Submit without changing rating (initial 0)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/please provide a rating/i)).toBeInTheDocument()
    expect(createHostReview).not.toHaveBeenCalled()
  })

  it('creates a new review and navigates on success', async () => {
    createHostReview.mockResolvedValue(undefined)

    render(<NewHostReviewPage />)

  // Set rating to 4
  await userEvent.click(screen.getByRole('button', { name: /rate-4/i }))
    // Type comment
    const comment = screen.getByLabelText(/your comment/i)
    await userEvent.clear(comment)
    await userEvent.type(comment, 'Great stay!')

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(createHostReview).toHaveBeenCalledWith({ hostId: 'h1', rating: 4, comment: 'Great stay!' })
    expect(mockedNavigate).toHaveBeenCalledWith('/hosts/h1')
  })

  it('prefills fields and updates review in edit mode', async () => {
    params = { id: 'h1', reviewId: 'r1' }
    getHostReviewById.mockResolvedValue({ rating: 3, comment: 'Old' })
    updateHostReview.mockResolvedValue(undefined)

    render(<NewHostReviewPage />)

    // Prefill loads
    const comment = await screen.findByLabelText(/your comment/i)
    expect((comment as HTMLInputElement).value).toBe('Old')
    // Rating value displayed as 3 initially
    expect(screen.getByText(/Rating:3/)).toBeInTheDocument()

  // Change rating to 5 and update comment
  await userEvent.click(screen.getByRole('button', { name: /rate-5/i }))
    await userEvent.clear(comment)
    await userEvent.type(comment, 'New Comment')

    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    expect(updateHostReview).toHaveBeenCalledWith('r1', { hostId: 'h1', rating: 5, comment: 'New Comment' })
    expect(mockedNavigate).toHaveBeenCalledWith('/hosts/h1')
  })

  it('shows error when API call fails', async () => {
    createHostReview.mockRejectedValue(new Error('boom'))

    render(<NewHostReviewPage />)

  await userEvent.click(screen.getByRole('button', { name: /rate-4/i }))
    const comment = screen.getByLabelText(/your comment/i)
    await userEvent.type(comment, 'X')

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/failed to submit review/i)).toBeInTheDocument()
    expect(mockedNavigate).not.toHaveBeenCalledWith('/hosts/h1')
  })

  it('cancel navigates back', async () => {
    render(<NewHostReviewPage />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockedNavigate).toHaveBeenCalledWith(-1)
  })
})
