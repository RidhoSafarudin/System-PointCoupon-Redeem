import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!session) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
