import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "@/pages/marketing/HomePage";
import NotFound from "@/pages/NotFound";
import Signup from "@/pages/auth/Signup";
import Profile from "@/pages/settings/Profile";
import AQPreview from "@/pages/ops/AQPreview";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/auth/signup",
    element: <Signup />,
  },
  {
    path: "/settings/profile",
    element: <Profile />,
  },
  {
    path: "/ops/aq-preview",
    element: <AQPreview />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;