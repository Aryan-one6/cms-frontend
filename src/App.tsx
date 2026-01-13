import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import PostsPage from "./pages/PostsPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PostCreatePage from "./pages/PostCreatePage";
import PostEditPage from "./pages/PostEditPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import LandingPage from "./pages/LandingPage";
import SitesPage from "./pages/SitesPage";
import NewSitePage from "./pages/NewSitePage";
import SuperAdminPage from "./pages/SuperAdminPage";
import PostViewPage from "./pages/PostViewPage";
import PricingPage from "./pages/PricingPage";
import AccountPage from "./pages/AccountPage";
import RequireAuth from "./routes/RequireAuth";
import { SiteProvider } from "./lib/site";

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/set-password"
            element={
              <RequireAuth>
                <SetPasswordPage />
              </RequireAuth>
            }
          />

          <Route path="/" element={<LandingPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/posts"
            element={
              <ProtectedRoute>
                <PostsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/posts/new"
            element={
              <ProtectedRoute>
                <PostCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/posts/:id/edit"
            element={
              <ProtectedRoute>
                <PostEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <PostViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sites"
            element={
              <ProtectedRoute>
                <SitesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sites/new"
            element={
              <ProtectedRoute>
                <NewSitePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />
       

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SiteProvider>
    </AuthProvider>
  );
}
