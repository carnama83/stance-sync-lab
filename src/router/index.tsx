import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "@/pages/marketing/HomePage";
import NotFound from "@/pages/NotFound";
import Signup from "@/pages/auth/Signup";
import Profile from "@/pages/settings/Profile";
import AQPreview from "@/pages/ops/AQPreview";
import Feed from "@/pages/feed/Feed";
import QuestionDetail from "@/pages/question/QuestionDetail";
import Analytics from "@/pages/me/Analytics";
import Pulse from "@/pages/pulse/Pulse";

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
    path: "/feed",
    element: <Feed />,
  },
  {
    path: "/question/:id",
    element: <QuestionDetail />,
  },
  {
    path: "/me/analytics",
    element: <Analytics />,
  },
  {
    path: "/pulse",
    element: <Pulse />,
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