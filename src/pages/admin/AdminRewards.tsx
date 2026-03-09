import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Reward = Tables<"rewards">;

export default function AdminRewards() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState({ name: "", description: "", points_required: "", stock: "", image_url: "" });

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", points_required: "", stock: "", image_url: "" });
    setEditing(null);
  };

  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({
      name: r.name,
      description: r.description || "",
      points_required: String(r.points_required),
      stock: String(r.stock),
      image_url: r.image_url || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.points_required) {
      toast.error("Name and points required are mandatory");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      points_required: parseInt(form.points_required),
      stock: parseInt(form.stock) || 0,
      image_url: form.image_url.trim(),
    };

    try {
      if (editing) {
        const { error } = await supabase.from("rewards").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Reward updated!");
      } else {
        const { error } = await supabase.from("rewards").insert(payload);
        if (error) throw error;
        toast.success("Reward created!");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reward?")) return;
    const { error } = await supabase.from("rewards").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Reward deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display">Reward Management</h1>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Reward</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">{editing ? "Edit Reward" : "Add Reward"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reward name" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Points Required</Label>
                    <Input type="number" value={form.points_required} onChange={(e) => setForm({ ...form, points_required: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Reward</Button>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : rewards && rewards.length > 0 ? (
                    rewards.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.points_required}</TableCell>
                        <TableCell>{r.stock}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No rewards yet</TableCell></TableRow>
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
