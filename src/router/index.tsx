import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/marketing/HomePage";
import NotFound from "@/pages/NotFound";
import Signup from "@/pages/auth/Signup";
import SignIn from "@/pages/auth/SignIn";
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
import AdminLogin from "@/pages/admin/Login";
import AdminPortal from "@/pages/admin/Index";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/settings/profile" element={<Profile />} />
      <Route path="/settings/account" element={<AccountSettings />} />
      <Route path="/settings/privacy" element={<Privacy />} />
      <Route path="/settings/notifications" element={<Notifications />} />
      <Route path="/ops/aq-preview" element={<AQPreview />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/question/:id" element={<QuestionDetail />} />
      <Route path="/me/analytics" element={<Analytics />} />
      <Route path="/pulse" element={<Pulse />} />
      <Route path="/ops/moderation" element={<ModerationQueue />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/admin/ingestion" element={<IngestionSettings />} />
      <Route path="/research/exports" element={<Exports />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;