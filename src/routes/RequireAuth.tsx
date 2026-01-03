import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import AuthLoader from "@/components/AuthLoader";

export default function RequireAuth({ children }: { children: ReactElement }) {
  const { admin, loading } = useAuth();

  if (loading) return <AuthLoader />;
  if (!admin) return <Navigate to="/login" replace />;

  return children;
}
