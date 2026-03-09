import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", points_value: "", expiration_date: "" });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      // Get profiles for redeemed_by
      const userIds = data?.filter((c) => c.redeemed_by).map((c) => c.redeemed_by!) ?? [];
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
        profs?.forEach((p) => { profiles[p.id] = p.name || p.email; });
      }
      return (data ?? []).map((c) => ({ ...c, redeemed_by_name: c.redeemed_by ? profiles[c.redeemed_by] || "Unknown" : null }));
    },
  });

  const handleCreate = async () => {
    if (!form.code || !form.points_value || !form.expiration_date) {
      toast.error("All fields are required");
      return;
    }
    try {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.trim().toUpperCase(),
        points_value: parseInt(form.points_value),
        expiration_date: new Date(form.expiration_date).toISOString(),
      });
      if (error) throw error;
      toast.success("Coupon created!");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setOpen(false);
      setForm({ code: "", points_value: "", expiration_date: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display">Coupon Management</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Create Coupon</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Create Coupon</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. REWARD100" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Points Value</Label>
                  <Input type="number" value={form.points_value} onChange={(e) => setForm({ ...form, points_value: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Coupon</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Redeemed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : coupons && coupons.length > 0 ? (
                    coupons.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium">{c.code}</TableCell>
                        <TableCell>{c.points_value}</TableCell>
                        <TableCell>{new Date(c.expiration_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{c.redeemed_by_name || "—"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No coupons yet</TableCell></TableRow>
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
