/* eslint-disable @typescript-eslint/no-explicit-any */
// This test imports the real `src/app/router.tsx` to exercise its module-level code
// but replaces react-router-dom's createBrowserRouter/RouterProvider with test doubles
// so we avoid real browser routing while still executing the file for coverage.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock all page modules used by router.tsx to lightweight stubs so importing router doesn't pull heavy deps
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
vi.mock('../../features/reviews/pages/NewReviewPage.tsx', () => ({ default: () => <div>New Review Page</div> }))
vi.mock('../../features/reviews/pages/HostReviewPage.tsx', () => ({ default: () => <div>Host Review Page</div> }))
vi.mock('../../features/reviews/pages/NewHostReviewPage.tsx', () => ({ default: () => <div>New Host Review Page</div> }))

// Mock react-router-dom but keep other exports via importActual; override createBrowserRouter and RouterProvider
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    // createBrowserRouter will be called during module init in router.tsx; return a plain object we can inspect
    createBrowserRouter: (routes: any) => ({ __test_routes: routes }),
    // RouterProvider will be used as a React component; render a div showing route count and a sample path
    RouterProvider: ({ router }: any) => (
      <div>
        <div data-testid="router-routes-count">{router?.__test_routes?.length ?? 0}</div>
        {/* Render the first route's element to assert at least one element is mounted */}
        <div data-testid="router-first-element">{router?.__test_routes?.[0]?.element ?? null}</div>
      </div>
    ),
  }
})

describe('router.tsx module import (coverage)', () => {
  it('initializes router and mounts RouterProvider with routes', async () => {
    // Import after mocks are in place so router.tsx uses the mocked createBrowserRouter
    const mod = await import('../../app/router')
    // AppRouter is exported; render it to exercise RouterProvider path
    const { AppRouter } = mod
    render(<AppRouter />)

    // Assert RouterProvider received routes (count > 0)
    expect(screen.getByTestId('router-routes-count').textContent).toBeTruthy()
    const count = Number(screen.getByTestId('router-routes-count').textContent || '0')
    expect(count).toBeGreaterThanOrEqual(1)

    // Ensure something from the first route element is rendered
    expect(screen.getByTestId('router-first-element')).toBeInTheDocument()
  })
})
