import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Register from "../features/auth/pages/Register";
import AccommodationDashboard from "../features/accommodations/pages/AccommodationDashboard";
import NewAccommodationPage from "../features/accommodations/pages/NewAccommodationPage";
import NewAmenityPage from "../features/accommodations/pages/NewAmenityPage.tsx";
import EditAccommodationPage from "../features/accommodations/pages/EditAccommodationPage.tsx";
import AccommodationDetailsPage from "../features/accommodations/pages/AccommodationDetailsPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/auth/register",
    element: <Register />,
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

]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
