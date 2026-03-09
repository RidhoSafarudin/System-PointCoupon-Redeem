import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Gift, PackageX } from "lucide-react";
import { useState } from "react";

export default function RewardsPage() {
  const { profile, refreshProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["all-rewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards").select("*").order("points_required");
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleRedeem = async (rewardId: string, name: string, pointsRequired: number) => {
    if (!profile || profile.points_balance < pointsRequired) {
      toast.error("Insufficient points!");
      return;
    }
    setRedeemingId(rewardId);
    try {
      const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
      if (error) throw error;
      const res = data as any;
      if (res.success) {
        toast.success(`You redeemed "${name}"! 🎁`);
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ["all-rewards"] });
        queryClient.invalidateQueries({ queryKey: ["reward-redemptions"] });
      } else {
        toast.error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">Rewards</h1>
            <p className="text-muted-foreground">Redeem your points for amazing rewards</p>
          </div>
          {profile && <span className="points-badge text-base"><Star className="w-4 h-4" />{profile.points_balance} pts</span>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card animate-pulse"><CardContent className="p-6 h-48" /></Card>
            ))}
          </div>
        ) : rewards && rewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canAfford = (profile?.points_balance ?? 0) >= reward.points_required;
              const outOfStock = reward.stock <= 0;
              return (
                <Card key={reward.id} className="glass-card overflow-hidden group">
                  {reward.image_url ? (
                    <div className="h-40 overflow-hidden">
                      <img src={reward.image_url} alt={reward.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-40 gradient-primary flex items-center justify-center">
                      <Gift className="w-12 h-12 text-primary-foreground/50" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold font-display">{reward.name}</h3>
                    {reward.description && <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="points-badge"><Star className="w-3 h-3" />{reward.points_required} pts</span>
                      <span className="text-xs text-muted-foreground">{reward.stock} left</span>
                    </div>
                    {outOfStock ? (
                      <Button disabled className="w-full" variant="outline">
                        <PackageX className="w-4 h-4 mr-2" /> Out of Stock
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={!canAfford || redeemingId === reward.id}
                        onClick={() => handleRedeem(reward.id, reward.name, reward.points_required)}
                      >
                        {redeemingId === reward.id ? "Redeeming..." : !canAfford ? "Not Enough Points" : "Redeem Reward"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg">No Rewards Available</h3>
              <p className="text-muted-foreground mt-2">Check back later for exciting rewards!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
