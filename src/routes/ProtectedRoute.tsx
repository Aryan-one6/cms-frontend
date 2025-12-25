import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";

export default function ProtectedRoute({
  children,
}: {
  children: ReactElement;
}) {
  const { admin, loading } = useAuth();
  const { activeSite, loading: siteLoading, sites } = useSite();

  if (loading) return <p>Loading...</p>;
  if (!admin) return <Navigate to="/login" replace />;
  if (siteLoading) return <p>Loading sites…</p>;
  if (!activeSite && sites.length === 0) {
    return <p>No sites configured yet. Create a site to continue.</p>;
  }

  return children;
}
