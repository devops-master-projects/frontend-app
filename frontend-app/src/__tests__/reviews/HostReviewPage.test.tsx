/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mocks for modules used by HostReviewPage
const mockedNavigate = vi.fn()
const hostState = { firstName: 'Alice', lastName: 'Host', email: 'a@h.com' }

// Synchronous mock for react-router-dom hooks used by the component.
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
  useParams: () => ({ id: 'h1' }),
  useLocation: () => ({ state: { host: hostState } }),
}))

vi.mock('../../features/reviews/api/reviewApi', () => ({
  getHostReviews: vi.fn(),
  deleteHostReview: vi.fn(),
}))

vi.mock('../../features/auth/api/authApi', () => ({
  getRole: vi.fn(),
  getUserId: vi.fn(),
}))

vi.mock('../../features/booking/api/bookingApi', () => ({
  canGuestRateHost: vi.fn(),
}))

// Lightweight MUI stubs to avoid pulling the full library into the test worker.
// Synchronous mock that returns only components used by the page.
vi.mock('@mui/material', () => {
  const Box = (props: any) => <div {...props}>{props.children}</div>
  const Typography = (props: any) => <div {...props}>{props.children}</div>
  const Rating = (props: any) => <div>Rating:{props.value}</div>
  const Paper = (props: any) => <div {...props}>{props.children}</div>
  const Divider = (props: any) => <hr {...props} />
  const Pagination = (props: any) => <div {...props}>{props.children}</div>
  const Grid = (props: any) => <div {...props}>{props.children}</div>
  const Button = (props: any) => <button {...props}>{props.children}</button>
  const IconButton = (props: any) => <button {...props}>{props.children}</button>
  const Dialog = ({ open, children, ...props }: any) =>
  open ? <div {...props}>{children}</div> : null
  const DialogTitle = (props: any) => <div {...props}>{props.children}</div>
  const DialogContent = (props: any) => <div {...props}>{props.children}</div>
  const DialogActions = (props: any) => <div {...props}>{props.children}</div>
  const Container = (props: any) => <div {...props}>{props.children}</div>

  return {
    Box,
    Typography,
    Rating,
    Paper,
    Divider,
    Pagination,
    Grid,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Container,
  }
})

// Lightweight navbar stubs to avoid rendering large UI (mock both specifier patterns)
vi.mock('../../features/accommodations/navbar/GuestNavbar.tsx', () => ({ default: () => <div>GuestNavbar</div> }))
vi.mock('../../features/accommodations/navbar/HostNavbar.tsx', () => ({ default: () => <div>HostNavbar</div> }))
vi.mock('../../features/accommodations/navbar/Navbar.tsx', () => ({ default: () => <div>MainNavbar</div> }))
vi.mock('../../accommodations/navbar/GuestNavbar.tsx', () => ({ default: () => <div>GuestNavbar</div> }))
vi.mock('../../accommodations/navbar/HostNavbar.tsx', () => ({ default: () => <div>HostNavbar</div> }))
vi.mock('../../accommodations/navbar/Navbar.tsx', () => ({ default: () => <div>MainNavbar</div> }))

// MUI icons (Edit/Delete) used inside component
vi.mock('@mui/icons-material/Edit', () => ({ default: () => <span>EditIcon</span> }))
vi.mock('@mui/icons-material/Delete', () => ({ default: () => <span>DeleteIcon</span> }))

import * as reviewApi from '../../features/reviews/api/reviewApi'
import * as authApi from '../../features/auth/api/authApi'
import * as bookingApi from '../../features/booking/api/bookingApi'
import HostReviewPage from '../../features/reviews/pages/HostReviewPage'

describe('HostReviewPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows empty state and average when no reviews', async () => {
    ;(reviewApi.getHostReviews as any).mockResolvedValue({ content: [], totalPages: 1, averageRating: 0 })
    ;(authApi.getRole as any).mockReturnValue('')

    render(<HostReviewPage />)

    expect(screen.getByText(/Average Rating/i)).toBeInTheDocument()
    expect(screen.getByText(/0.0 \/ 5/)).toBeInTheDocument()
  })

  it('renders reviews and allows delete for owner, refreshes list after delete', async () => {
    const initial = {
      content: [
        {
          id: 'r1', guestId: 'g1', hostId: 'h1', rating: 4, comment: 'Great host', createdAt: new Date().toISOString(), guestFirstName: 'G', guestLastName: 'One'
        }
      ],
      totalPages: 1,
      averageRating: 4,
    }
    const afterDelete = { content: [], totalPages: 1, averageRating: 0 }

    // getHostReviews called twice: initial load and after delete
    ;(reviewApi.getHostReviews as any).mockResolvedValueOnce(initial).mockResolvedValueOnce(afterDelete)
    ;(authApi.getRole as any).mockReturnValue('GUEST')
    ;(authApi.getUserId as any).mockReturnValue('g1')
    ;(bookingApi.canGuestRateHost as any).mockResolvedValue(false)
    ;(reviewApi.deleteHostReview as any).mockResolvedValue({})

  render(<HostReviewPage />)

    // initial review shown
    const paper = await screen.findByText(/Great host/)
    expect(paper).toBeInTheDocument()

    // Click delete icon button rendered for this review (by accessible name from our stub)
    const deleteBtn = screen.getByRole('button', { name: /DeleteIcon/i })
    await userEvent.click(deleteBtn)

    // confirm dialog appears
    expect(await screen.findByText(/Confirm Delete/i)).toBeInTheDocument()

  // click the Delete button in dialog (exact match, not DeleteIcon)
  await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }))

    // wait for refresh; afterDelete has no reviews
    await waitFor(() => expect(screen.getByText(/No reviews yet for this host/i)).toBeInTheDocument())

    expect(reviewApi.deleteHostReview).toHaveBeenCalledWith('r1')
  })

  it('shows Leave a Review when guest can rate and navigates on click', async () => {
    ;(reviewApi.getHostReviews as any).mockResolvedValue({ content: [], totalPages: 1, averageRating: 0 })
    ;(authApi.getRole as any).mockReturnValue('GUEST')
    ;(authApi.getUserId as any).mockReturnValue('g2')
    ;(bookingApi.canGuestRateHost as any).mockResolvedValue(true)

    render(<HostReviewPage />)

    const leave = await screen.findByRole('button', { name: /Leave a Review/i })
    expect(leave).toBeInTheDocument()

    await userEvent.click(leave)
    expect(mockedNavigate).toHaveBeenCalledWith('/hosts/h1/reviews/new', expect.any(Object))
  })
})
