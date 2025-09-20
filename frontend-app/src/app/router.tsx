import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Register from "../features/auth/pages/Register";
import AccommodationDashboard from "../features/accommodations/pages/AccommodationDashboard";


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
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
