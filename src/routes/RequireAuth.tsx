import { type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function RequireAuth({ children }: { children: ReactElement }) {
  const { admin, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!admin) return <Navigate to="/login" replace />;

  return children;
}
