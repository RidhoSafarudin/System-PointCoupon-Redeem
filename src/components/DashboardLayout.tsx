import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Gift, Ticket, History, Shield, LogOut, Menu, X, Star } from "lucide-react";
import { useState } from "react";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/redeem-coupon", label: "Redeem Coupon", icon: Ticket },
  { to: "/history", label: "History", icon: History },
];

const adminLinks = [
  { to: "/admin", label: "Admin Dashboard", icon: Shield },
  { to: "/admin/users", label: "Users", icon: LayoutDashboard },
  { to: "/admin/rewards", label: "Rewards", icon: Gift },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/redemptions", label: "Redemptions", icon: History },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const links = isAdminRoute ? adminLinks : userLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display text-sidebar-foreground">RewardHub</span>
          </Link>
        </div>

        {profile && (
          <div className="px-6 pb-4">
            <div className="p-3 rounded-lg bg-sidebar-accent">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.name || profile.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold text-accent">{profile.points_balance} pts</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-1">
          {isAdmin && !isAdminRoute && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
          {isAdminRoute && (
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              User Dashboard
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-display">RewardHub</span>
          </Link>
          <div className="flex items-center gap-2">
            {profile && <span className="points-badge"><Star className="w-3 h-3" />{profile.points_balance}</span>}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-b bg-card p-3 space-y-1 animate-fade-in">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {isAdmin && !isAdminRoute && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm">
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-destructive">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
