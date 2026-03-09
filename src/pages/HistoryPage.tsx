import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Ticket, Star } from "lucide-react";

export default function HistoryPage() {
  const { user } = useAuth();

  const { data: rewardHistory } = useQuery({
    queryKey: ["reward-redemptions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("reward_redemptions").select("*").order("redeemed_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: couponHistory } = useQuery({
    queryKey: ["coupon-redemptions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("coupon_redemptions").select("*").order("redeemed_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-display mb-6">History</h1>

        <Tabs defaultValue="coupons">
          <TabsList className="mb-4">
            <TabsTrigger value="coupons" className="gap-2"><Ticket className="w-4 h-4" /> Coupons</TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2"><Gift className="w-4 h-4" /> Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <Card className="glass-card">
              <CardHeader><CardTitle className="font-display text-lg">Coupon Redemptions</CardTitle></CardHeader>
              <CardContent>
                {couponHistory && couponHistory.length > 0 ? (
                  <div className="space-y-3">
                    {couponHistory.map((r) => (
                      <div key={r.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm font-mono">{r.coupon_code}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleString()}</p>
                        </div>
                        <span className="points-badge">+{r.points_earned} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No coupon redemptions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <Card className="glass-card">
              <CardHeader><CardTitle className="font-display text-lg">Reward Redemptions</CardTitle></CardHeader>
              <CardContent>
                {rewardHistory && rewardHistory.length > 0 ? (
                  <div className="space-y-3">
                    {rewardHistory.map((r) => (
                      <div key={r.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{r.reward_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleString()}</p>
                        </div>
                        <span className="text-sm font-semibold text-destructive">-{r.points_spent} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No reward redemptions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
