/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Lightweight MUI stubs
vi.mock('@mui/material', () => {
  type DivProps = React.ComponentProps<'div'>
  type ButtonProps = React.ComponentProps<'button'>
  const Box = (props: DivProps) => <div {...props} />
  const Typography = (props: DivProps) => <div {...props} />
  const Paper = (props: DivProps) => <div {...props} />
  const Container = (props: DivProps) => <div {...props} />
  const Button = ({ children, ...rest }: ButtonProps) => <button {...rest}>{children}</button>
  const Rating = ({ value = 0, onChange }: { value?: number; onChange?: (e: unknown, v: number) => void }) => (
    <div>
      Rating: {value}
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} aria-label={`rate-${n}`} onClick={() => onChange?.(null, n)}>
          {n}
        </button>
      ))}
    </div>
  )
  const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }) => (
    <input aria-label={label} value={value} onChange={onChange} />
  )
  return { Box, Typography, Paper, Container, Button, Rating, TextField }
})

// Stub GuestNavbar
vi.mock('../../features/accommodations/navbar/GuestNavbar', () => ({ default: () => <div>GuestNavbar</div> }))
vi.mock('../../features/accommodations/navbar/GuestNavbar.tsx', () => ({ default: () => <div>GuestNavbar</div> }))

// Router mocks
const navigateMock = vi.fn()
let params: { id?: string; reviewId?: string } = {}
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => params,
}))

// API mocks
const createAccommodationReview = vi.fn()
const getReviewById = vi.fn()
const updateReview = vi.fn()
vi.mock('../../features/reviews/api/reviewApi', () => ({
  createAccommodationReview,
  getReviewById,
  updateReview,
}))
vi.mock('../../features/reviews/api/reviewApi.ts', () => ({
  createAccommodationReview,
  getReviewById,
  updateReview,
}))

import NewReviewPage from '../../features/reviews/pages/NewReviewPage'

describe('NewReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    params = { id: 'acc1' }
  })

  it('shows validation error when submitting without rating', async () => {
    render(<NewReviewPage />)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/please provide a rating/i)).toBeInTheDocument()
    expect(createAccommodationReview).not.toHaveBeenCalled()
    expect(updateReview).not.toHaveBeenCalled()
  })

  it('creates a new review and navigates on success', async () => {
    createAccommodationReview.mockResolvedValueOnce({ id: 'new' })

    render(<NewReviewPage />)

    // Set rating to 4 and type comment
    await userEvent.click(screen.getByRole('button', { name: /rate-4/i }))
    const comment = screen.getByLabelText(/your comment/i)
    await userEvent.type(comment, 'Nice stay')

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(createAccommodationReview).toHaveBeenCalledWith({ accommodationId: 'acc1', rating: 4, comment: 'Nice stay' })
    })
    expect(navigateMock).toHaveBeenCalledWith('/accommodations/acc1')
  })

  it('prefills fields and updates review in edit mode', async () => {
    params = { id: 'acc1', reviewId: 'rev1' }
    getReviewById.mockResolvedValueOnce({ id: 'rev1', rating: 3, comment: 'Old' })
    updateReview.mockResolvedValueOnce({ id: 'rev1', rating: 5, comment: 'New' })

    render(<NewReviewPage />)

    // Prefilled state visible
    await screen.findByText(/edit review/i)
    expect(screen.getByText(/Rating:\s*3/)).toBeInTheDocument()
    const comment = await screen.findByLabelText(/your comment/i)
    expect((comment as HTMLInputElement).value).toBe('Old')

    // Update
    await userEvent.click(screen.getByRole('button', { name: /rate-5/i }))
    await userEvent.clear(comment)
    await userEvent.type(comment, 'New')
    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(updateReview).toHaveBeenCalledWith('rev1', { accommodationId: 'acc1', rating: 5, comment: 'New' })
    })
    expect(navigateMock).toHaveBeenCalledWith('/accommodations/acc1')
  })

  it('shows error when API call fails', async () => {
    createAccommodationReview.mockRejectedValueOnce(new Error('Oops'))

    render(<NewReviewPage />)
    await userEvent.click(screen.getByRole('button', { name: /rate-4/i }))
    const comment = screen.getByLabelText(/your comment/i)
    await userEvent.type(comment, 'X')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/failed to submit review/i)).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('cancel navigates back', async () => {
    render(<NewReviewPage />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })
})
