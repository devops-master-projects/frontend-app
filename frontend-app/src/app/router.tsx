import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Register from "../features/auth/pages/Register";
import AccommodationDashboard from "../features/accommodations/pages/AccommodationDashboard";
import NewAccommodationPage from "../features/accommodations/pages/NewAccommodationPage";
import NewAmenityPage from "../features/accommodations/pages/NewAmenityPage.tsx";

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
    path: "/accommodations/amenity/new",
    element: <NewAmenityPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
