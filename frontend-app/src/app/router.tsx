import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Register from "../features/auth/pages/Register";
import AccommodationDashboard from "../features/accommodations/pages/AccommodationDashboard";
import NewAccommodationPage from "../features/accommodations/pages/NewAccommodationPage";
import NewAmenityPage from "../features/accommodations/pages/NewAmenityPage.tsx";
import EditAccommodationPage from "../features/accommodations/pages/EditAccommodationPage.tsx";
import AccommodationDetailsPage from "../features/accommodations/pages/AccommodationDetailsPage.tsx";
import AvailabilityCalendarPage from "../features/booking/pages/AvailabilityCalendarPage.tsx";
import ReservationsCalendarPage from "../features/booking/pages/ReservationsCalendarPage.tsx";
import HostAccommodationRequestsPage from "../features/booking/pages/HostAccommodationRequestsPage.tsx";
import Login from "../features/auth/pages/Login.tsx";
import SearchResultsPage from "../features/accommodations/pages/SearchResultsPage.tsx";
import Profile from "../features/auth/pages/Profile.tsx";
import NotificationDetailsPage from "../features/notifications/pages/NotificationDetailsPage.tsx";
import NotificationsPage from "../features/notifications/pages/NotificationsPage.tsx";

import NewReviewPage from "../features/reviews/pages/NewReviewPage.tsx";
import HostReviewPage from "../features/reviews/pages/HostReviewPage.tsx";
import NewHostReviewPage from "../features/reviews/pages/NewHostReviewPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/auth/register",
    element: <Register />,
  },
  {
    path: "/auth/profile",
    element: <Profile />,
  },
  {
    path: "/accommodations",
    element: <AccommodationDashboard />,
  },
  {
    path: "/accommodations/new",
    element: <NewAccommodationPage />,
  },
  {
    path: "/accommodations/:id",
    element: <AccommodationDetailsPage />,
  },
  {
    path: "/accommodations/:id/edit",
    element: <EditAccommodationPage />,
  },
  {
    path: "/accommodations/amenity/new",
    element: <NewAmenityPage />,
  },
  {
    path: "/accommodations/:id/availability/new",
    element: <AvailabilityCalendarPage />,
  },
  {
    path: "/accommodations/:id/reservations/new",
    element: <ReservationsCalendarPage />,
  },
  {
    path: "/accommodations/:id/requests",
    element: <HostAccommodationRequestsPage />,
  },
  {
    path: "/search-results",
    element: <SearchResultsPage />,
  },
  {
    path: "/notifications",
    element: <NotificationsPage />,
  },
  {
    path: "/notifications/:id",
    element: <NotificationDetailsPage />,
  },

  {
    path: "/accommodations/:id/reviews/new",
    element: <NewReviewPage />,
  },
  {
    path: "/accommodations/:id/reviews/:reviewId/edit",
    element: <NewReviewPage />,
  },
  {
    path: "/hosts/:id",
    element: <HostReviewPage />,
  },
  {
    path: "/hosts/:id/reviews/new",
    element: <NewHostReviewPage />,
  },
  {
    path: "/hosts/:id/reviews/:reviewId/edit",
    element: <NewHostReviewPage />,
  },

]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
