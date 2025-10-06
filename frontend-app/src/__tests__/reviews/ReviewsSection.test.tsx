/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {render, screen, waitFor, within} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

// Lightweight MUI stubs to avoid heavy imports and CSS
vi.mock('@mui/material', () => {
  type DivProps = React.ComponentProps<'div'>
  type ButtonProps = React.ComponentProps<'button'>
  const Box = (props: DivProps) => <div {...props} />
  const Typography = (props: DivProps) => <div {...props} />
  const Paper = (props: DivProps) => <div {...props} />
  const Divider = () => null
  const Grid = ({ children, ...rest }: DivProps & { children?: React.ReactNode }) => (
    <div {...rest}>{children}</div>
  )
  const Button = ({ children, onClick, ...rest }: ButtonProps) => (
    <button onClick={onClick} {...rest}>{children}</button>
  )
  const IconButton = ({ children, onClick, 'aria-label': ariaLabel, ...rest }: ButtonProps & { 'aria-label'?: string }) => (
    <button aria-label={ariaLabel} onClick={onClick} {...rest}>{children}</button>
  )
  const Dialog = ({ open, children }: { open: boolean; children?: React.ReactNode }) => (open ? <div role="dialog">{children}</div> : null)
  const DialogTitle = (props: DivProps) => <div {...props} />
  const DialogContent = (props: DivProps) => <div {...props} />
  const DialogActions = (props: DivProps) => <div {...props} />
  const Rating = ({ value }: { value: number }) => <div>Rating: {value}</div>
  const Pagination = ({ count, page, onChange }: { count: number; page: number; onChange?: (e: unknown, v: number) => void }) => (
    <div>
      <div>Pagination count: {count}, page: {page}</div>
      {Array.from({ length: count }, (_, i) => (
        <button key={i + 1} onClick={() => onChange?.({}, i + 1)}>Page {i + 1}</button>
      ))}
    </div>
  )
  return {
    Box,
    Typography,
    Rating,
    Paper,
    Divider,
    Pagination,
    Grid,
    IconButton,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Dialog,
  }
})

// Stub icons
vi.mock('@mui/icons-material/Delete', () => ({ default: () => <span>DeleteIcon</span> }))
vi.mock('@mui/icons-material/Edit', () => ({ default: () => <span>EditIcon</span> }))

// Router hooks
const navigateMock = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

// API mocks (hoisted)
const apiMocks = vi.hoisted(() => ({
  getAccommodationReviews: vi.fn(),
  deleteReview: vi.fn(),
}))
vi.mock('../../features/reviews/api/reviewApi', () => apiMocks)
vi.mock('../../features/reviews/api/reviewApi.ts', () => apiMocks)

// Auth mock
vi.mock('../../features/auth/api/authApi', () => ({
  getUserId: () => 'me',
}))
vi.mock('../../features/auth/api/authApi.ts', () => ({
  getUserId: () => 'me',
}))

import { ReviewsSection } from '../../features/reviews/pages/ReviewsSection'

describe('ReviewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
  })

  it('renders average rating and reviews, and shows edit/delete only for own review', async () => {
  apiMocks.getAccommodationReviews.mockResolvedValueOnce({
      content: [
        { id: 'r1', guestId: 'me', guestFirstName: 'Me', guestLastName: 'User', rating: 4, comment: 'Mine', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'r2', guestId: 'other', guestFirstName: 'Other', guestLastName: 'User', rating: 3, comment: 'Other', createdAt: '2025-01-02T00:00:00Z' },
      ],
      totalPages: 1,
      averageRating: 3.5,
    })

    render(<ReviewsSection accommodationId="acc1" />)

    await screen.findByText(/Average Rating/i)
    expect(screen.getByText('3.5 / 5')).toBeInTheDocument()
    expect(screen.getByText('Mine')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()

  // Buttons should be present only for own review

    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Edit/i })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /Delete/i })).toHaveLength(1)


  })

  it('navigates to edit page when Edit icon is clicked for own review', async () => {
  apiMocks.getAccommodationReviews.mockResolvedValueOnce({
      content: [
        { id: 'r1', guestId: 'me', guestFirstName: 'Me', guestLastName: 'User', rating: 4, comment: 'Mine', createdAt: '2025-01-01T00:00:00Z' },
      ],
      totalPages: 1,
      averageRating: 4,
    })

    render(<ReviewsSection accommodationId="acc1" />)
    await screen.findByText(/Average Rating/i)


    await userEvent.click(screen.getByRole('button', { name: /Edit/i }))


    expect(navigateMock).toHaveBeenCalledWith('/accommodations/acc1/reviews/r1/edit')
  })

  it('opens confirm dialog and deletes review, then refreshes list and closes dialog', async () => {
    // First fetch: two reviews
  apiMocks.getAccommodationReviews.mockResolvedValueOnce({
      content: [
        { id: 'r1', guestId: 'me', guestFirstName: 'Me', guestLastName: 'User', rating: 4, comment: 'Mine', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'r2', guestId: 'other', guestFirstName: 'Other', guestLastName: 'User', rating: 3, comment: 'Other', createdAt: '2025-01-02T00:00:00Z' },
      ],
      totalPages: 1,
      averageRating: 3.5,
    })
    // After delete: only other remains
  apiMocks.getAccommodationReviews.mockResolvedValueOnce({
      content: [
        { id: 'r2', guestId: 'other', guestFirstName: 'Other', guestLastName: 'User', rating: 3, comment: 'Other', createdAt: '2025-01-02T00:00:00Z' },
      ],
      totalPages: 1,
      averageRating: 3,
    })
  apiMocks.deleteReview.mockResolvedValueOnce(undefined)

    render(<ReviewsSection accommodationId="acc1" />)
    await screen.findByText(/Average Rating/i)

    await userEvent.click(screen.getByRole('button', { name: /Delete/i }))

    // Dialog opens
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Confirm Delete/i)).toBeInTheDocument()

    // Confirm delete

    const dialog = screen.getByRole('dialog')
    await userEvent.click(
        within(dialog).getByRole('button', { name: /^Delete$/i })
    )


  await waitFor(() => expect(apiMocks.deleteReview).toHaveBeenCalledWith('r1'))
    // List refreshed: only "Other" remains, and average updated
    await screen.findByText('3.0 / 5')
    expect(screen.getByText('Other')).toBeInTheDocument()
    expect(screen.queryByText('Mine')).toBeNull()

    // Dialog closed
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('changes page via Pagination and fetches new page', async () => {
    // Page 1
    apiMocks.getAccommodationReviews.mockResolvedValueOnce({
      content: [
        { id: 'r1', guestId: 'me', guestFirstName: 'Me', guestLastName: 'User', rating: 4, comment: 'Page1', createdAt: '2025-01-01T00:00:00Z' },
      ],
      totalPages: 2,
      averageRating: 4,
    })
    // Page 2
    apiMocks.getAccommodationReviews.mockResolvedValueOnce({
      content: [
        { id: 'r2', guestId: 'other', guestFirstName: 'Other', guestLastName: 'User', rating: 3, comment: 'Page2', createdAt: '2025-01-02T00:00:00Z' },
      ],
      totalPages: 2,
      averageRating: 3.5,
    })

    render(<ReviewsSection accommodationId="acc1" />)
    await screen.findByText(/Average Rating/i)
  expect(screen.getByText(/Page1/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Page 2/i }))

    await screen.findByText('Page2')
    expect(screen.queryByText('Page1')).toBeNull()
  })
})
