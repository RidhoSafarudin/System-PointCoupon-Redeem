import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, Ticket, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, rewards, coupons, redemptions] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("rewards").select("id", { count: "exact", head: true }),
        supabase.from("coupons").select("id", { count: "exact", head: true }),
        supabase.from("reward_redemptions").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: profiles.count ?? 0,
        rewards: rewards.count ?? 0,
        coupons: coupons.count ?? 0,
        redemptions: redemptions.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const statCards = [
    { label: "Total Users", value: stats?.users ?? 0, icon: Users, color: "text-primary" },
    { label: "Total Rewards", value: stats?.rewards ?? 0, icon: Gift, color: "text-accent" },
    { label: "Total Coupons", value: stats?.coupons ?? 0, icon: Ticket, color: "text-success" },
    { label: "Total Redemptions", value: stats?.redemptions ?? 0, icon: TrendingUp, color: "text-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-display mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold font-display mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
