import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminRedemptions() {
  const { data: redemptions, isLoading } = useQuery({
    queryKey: ["admin-redemptions"],
    queryFn: async () => {
      const { data } = await supabase.from("reward_redemptions").select("*").order("redeemed_at", { ascending: false });
      if (!data) return [];
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => { profileMap[p.id] = p.name || p.email; });
      return data.map((r) => ({ ...r, user_name: profileMap[r.user_id] || "Unknown" }));
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-display mb-6">Redemption Monitoring</h1>
        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Points Spent</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : redemptions && redemptions.length > 0 ? (
                    redemptions.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.user_name}</TableCell>
                        <TableCell>{r.reward_name}</TableCell>
                        <TableCell>{r.points_spent}</TableCell>
                        <TableCell>{new Date(r.redeemed_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No redemptions yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
