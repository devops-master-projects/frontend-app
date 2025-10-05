import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
let AppRouter: React.ComponentType

// Router uses BrowserRouter internally; stub out createRoot target
beforeAll(() => {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
})

vi.mock('../../features/auth/pages/Login.tsx', () => ({ default: () => <div>Login Page</div> }))
vi.mock('../../features/auth/pages/Register.tsx', () => ({ default: () => <div>Register Page</div> }))
vi.mock('../../features/auth/pages/Profile.tsx', () => ({ default: () => <div>Profile Page</div> }))
vi.mock('../../features/accommodations/pages/AccommodationDashboard', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('../../features/accommodations/pages/NewAccommodationPage', () => ({ default: () => <div>New Accommodation</div> }))
vi.mock('../../features/accommodations/pages/NewAmenityPage.tsx', () => ({ default: () => <div>New Amenity</div> }))
vi.mock('../../features/accommodations/pages/EditAccommodationPage.tsx', () => ({ default: () => <div>Edit Accommodation</div> }))
vi.mock('../../features/accommodations/pages/AccommodationDetailsPage.tsx', () => ({ default: () => <div>Accommodation Details</div> }))
vi.mock('../../features/booking/pages/AvailabilityCalendarPage.tsx', () => ({ default: () => <div>Availability Calendar</div> }))
vi.mock('../../features/booking/pages/ReservationsCalendarPage.tsx', () => ({ default: () => <div>Reservations Calendar</div> }))
vi.mock('../../features/booking/pages/HostAccommodationRequestsPage.tsx', () => ({ default: () => <div>Host Requests</div> }))
vi.mock('../../features/accommodations/pages/SearchResultsPage.tsx', () => ({ default: () => <div>Search Results</div> }))
vi.mock('../../features/notifications/pages/NotificationDetailsPage.tsx', () => ({ default: () => <div>Notification Details</div> }))
vi.mock('../../features/notifications/pages/NotificationsPage.tsx', () => ({ default: () => <div>Notifications List</div> }))
vi.mock('../../app/App', () => ({ default: () => <div>Home Page</div> }))

describe('AppRouter', () => {
  beforeEach(() => {
    // Force fresh module load each test so the router reads current location
    vi.resetModules()
  })
  it('renders home route', () => {
    window.history.pushState({}, '', '/')
    return import('../../app/router').then(async (m) => {
      AppRouter = m.AppRouter
      render(<AppRouter />)
      await waitFor(() => expect(screen.getByText(/home page/i)).toBeInTheDocument())
    })
  })

  it('renders login route', () => {
    window.history.pushState({}, '', '/auth/login')
    return import('../../app/router').then(async (m) => {
      AppRouter = m.AppRouter
      render(<AppRouter />)
      await waitFor(() => expect(screen.getByText(/login page/i)).toBeInTheDocument())
    })
  })

  it('renders register route', () => {
    window.history.pushState({}, '', '/auth/register')
    return import('../../app/router').then(async (m) => {
      AppRouter = m.AppRouter
      render(<AppRouter />)
      await waitFor(() => expect(screen.getByText(/register page/i)).toBeInTheDocument())
    })
  })
})
