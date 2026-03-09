import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function RedeemCoupon() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { refreshProfile, user } = useAuth();
  const queryClient = useQueryClient();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc("redeem_coupon", { p_coupon_code: code.trim() });
      if (error) throw error;

      const res = data as any;
      if (res.success) {
        setResult({ success: true, message: `+${res.points_earned} points earned!` });
        toast.success(`You earned ${res.points_earned} points! 🎉`);
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ["coupon-redemptions"] });
        setCode("");
      } else {
        setResult({ success: false, message: res.error });
        toast.error(res.error);
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message });
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-display mb-6">Redeem Coupon</h1>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" /> Enter Coupon Code
            </CardTitle>
            <CardDescription>Enter your coupon code below to earn points</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REWARD100"
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={50}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
                {loading ? "Redeeming..." : "Redeem Code"}
              </Button>
            </form>

            {result && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-center gap-3 animate-scale-in ${
                  result.success
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{result.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
