import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Gift, Ticket, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { profile, user } = useAuth();

  const { data: rewardRedemptions } = useQuery({
    queryKey: ["reward-redemptions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reward_redemptions")
        .select("*")
        .order("redeemed_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: couponRedemptions } = useQuery({
    queryKey: ["coupon-redemptions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("coupon_redemptions")
        .select("*")
        .order("redeemed_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: rewards } = useQuery({
    queryKey: ["available-rewards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rewards")
        .select("*")
        .gt("stock", 0)
        .order("points_required", { ascending: true })
        .limit(3);
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">
            Welcome back, {profile?.name || "there"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your rewards overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card overflow-hidden">
            <div className="gradient-accent absolute inset-0 opacity-10" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Points Balance</p>
                  <p className="text-3xl font-bold font-display text-accent mt-1">{profile?.points_balance ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rewards Redeemed</p>
                  <p className="text-3xl font-bold font-display mt-1">{rewardRedemptions?.length ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Coupons Used</p>
                  <p className="text-3xl font-bold font-display mt-1">{couponRedemptions?.length ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Redeem a Coupon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Have a coupon code? Enter it to earn points instantly.
              </p>
              <Link to="/redeem-coupon">
                <Button>Enter Coupon Code</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-accent" /> Browse Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Check out the latest rewards available for you.
              </p>
              <Link to="/rewards">
                <Button variant="outline">View Rewards</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Available Rewards Preview */}
        {rewards && rewards.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Available Rewards</CardTitle>
              <Link to="/rewards" className="text-sm text-primary hover:underline">See all →</Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="rounded-lg border p-4 space-y-2">
                    {reward.image_url && (
                      <img src={reward.image_url} alt={reward.name} className="w-full h-32 object-cover rounded-md" />
                    )}
                    <h3 className="font-semibold text-sm">{reward.name}</h3>
                    <span className="points-badge"><Star className="w-3 h-3" />{reward.points_required} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {couponRedemptions && couponRedemptions.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Recent Coupon Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {couponRedemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">Code: {r.coupon_code}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleDateString()}</p>
                    </div>
                    <span className="points-badge">+{r.points_earned} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
