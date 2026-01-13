import { type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import AuthLoader from "@/components/AuthLoader";

export default function ProtectedRoute({
  children,
}: {
  children: ReactElement;
}) {
  const { admin, loading } = useAuth();
  const { activeSite, loading: siteLoading, sites } = useSite();
  const location = useLocation();

  if (loading) return <AuthLoader />;
  if (!admin) return <Navigate to="/login" replace />;
  if (admin.role === "SUPER_ADMIN" && location.pathname !== "/super-admin") {
    return <Navigate to="/super-admin" replace />;
  }
  if (admin.hasPassword === false) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/set-password?next=${encodeURIComponent(nextPath)}`} replace />;
  }
  if (siteLoading) return <AuthLoader />;
  if (!activeSite && sites.length === 0) {
    return <p>No sites configured yet. Create a site to continue.</p>;
  }

  return children;
}
