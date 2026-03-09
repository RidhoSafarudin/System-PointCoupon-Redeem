import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import RewardsPage from "./pages/RewardsPage";
import RedeemCoupon from "./pages/RedeemCoupon";
import HistoryPage from "./pages/HistoryPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRewards from "./pages/admin/AdminRewards";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminRedemptions from "./pages/admin/AdminRedemptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (session) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AuthGate />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
            <Route path="/redeem-coupon" element={<ProtectedRoute><RedeemCoupon /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/rewards" element={<AdminRoute><AdminRewards /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/redemptions" element={<AdminRoute><AdminRedemptions /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
