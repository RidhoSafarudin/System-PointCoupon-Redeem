import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminUsers() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) return [];

      // Get reward redemption counts per user
      const { data: redemptions } = await supabase.from("reward_redemptions").select("user_id");
      const redemptionCounts: Record<string, number> = {};
      redemptions?.forEach((r) => {
        redemptionCounts[r.user_id] = (redemptionCounts[r.user_id] || 0) + 1;
      });

      return profiles.map((p) => ({
        ...p,
        total_redeemed: redemptionCounts[p.id] || 0,
      }));
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-display mb-6">User Management</h1>
        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Rewards Redeemed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : users && users.length > 0 ? (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{u.points_balance}</TableCell>
                        <TableCell className="text-right">{u.total_redeemed}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
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
