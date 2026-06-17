import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ZapOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BulkFineDialog({ students, onDone }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const [form, setForm] = useState({
    amount: "",
    reason: "Missing library books",
    category: "other",
    issued_by: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const [selectedIds, setSelectedIds] = useState(new Set());

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleStudent = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one student");
      return;
    }
    if (!form.amount || !form.reason) {
      toast.error("Fill in all fields");
      return;
    }

    setSaving(true);
    const fines = Array.from(selectedIds).map(sid => {
      const student = students.find(s => s.id === sid);
      return {
        student_id: sid,
        student_name: student?.full_name || "",
        student_card_id: student?.student_id || "",
        amount: parseFloat(form.amount),
        reason: form.reason,
        category: form.category,
        issued_by: form.issued_by,
        status: "pending",
        date: form.date,
      };
    });

    try {
      for (const fine of fines) {
        await entities.Fine.create(fine);
      }
      qc.invalidateQueries({ queryKey: ["fines"] });
      setSaving(false);
      setOpen(false);
      setSelectedIds(new Set());
      setForm({ amount: "", reason: "Missing library books", category: "other", issued_by: "", date: format(new Date(), "yyyy-MM-dd") });
      toast.success(`${fines.length} fine${fines.length > 1 ? "s" : ""} issued successfully`);
      onDone?.();
    } catch (err) {
      setSaving(false);
      toast.error("Error issuing fines");
    }
  };

  const activeStudents = students.filter(s => s.status === "active");

  return (
    <>
      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 gap-1.5" onClick={() => setOpen(true)}>
        <ZapOff className="h-4 w-4" />Bulk Issue Fine
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Issue Fine to Multiple Students</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.amount}
                  onChange={e => upd("amount", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => upd("category", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="uniform">Uniform</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reason *</Label>
              <Input
                value={form.reason}
                onChange={e => upd("reason", e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issued By</Label>
                <Input value={form.issued_by} onChange={e => upd("issued_by", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <DatePicker value={form.date} onChange={val => upd("date", val)} className="mt-1" />
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-semibold mb-2">Select Students ({selectedIds.size})</p>
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                {activeStudents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No active students</p>
                ) : (
                  activeStudents.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleStudent(s.id)}
                      />
                      <span>{s.full_name} · Grade {s.grade}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4"
              onClick={handleSubmit}
              disabled={saving || selectedIds.size === 0 || !form.amount || !form.reason}
            >
              {saving ? "Issuing..." : `Issue to ${selectedIds.size}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}