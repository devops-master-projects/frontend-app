import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Register from "../features/auth/pages/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/auth/register",
    element: <Register />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
