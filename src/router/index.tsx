import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "@/pages/marketing/HomePage";
import NotFound from "@/pages/NotFound";
import Signup from "@/pages/auth/Signup";
import Profile from "@/pages/settings/Profile";
import Privacy from "@/pages/settings/Privacy";
import Notifications from "@/pages/settings/Notifications";
import AccountSettings from "@/pages/settings/Account";
import AQPreview from "@/pages/ops/AQPreview";
import Feed from "@/pages/feed/Feed";
import QuestionDetail from "@/pages/question/QuestionDetail";
import Analytics from "@/pages/me/Analytics";
import Pulse from "@/pages/pulse/Pulse";
import ModerationQueue from "@/pages/ops/moderation/Queue";
import Inbox from "@/pages/inbox/Inbox";
import IngestionSettings from "@/pages/admin/ingestion/Settings";
import Exports from "@/pages/research/Exports";

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
    path: "/settings/account",
    element: <AccountSettings />,
  },
  {
    path: "/settings/privacy",
    element: <Privacy />,
  },
  {
    path: "/settings/notifications",
    element: <Notifications />,
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
    path: "/ops/moderation",
    element: <ModerationQueue />,
  },
  {
    path: "/inbox",
    element: <Inbox />,
  },
  {
    path: "/admin/ingestion",
    element: <IngestionSettings />,
  },
  {
    path: "/research/exports",
    element: <Exports />,
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