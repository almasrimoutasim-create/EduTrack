import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function StudentFormDialog({ open, onClose, student }) {
  const isEdit = !!student;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(student || {
    full_name: "", student_id: "", grade: "1", section: "A",
    date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
    address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active"
  });

  useEffect(() => {
    setForm(student || {
      full_name: "", student_id: "", grade: "1", section: "A",
      date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
      address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active"
    });
  }, [student]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    if (isEdit) {
      await base44.entities.Student.update(student.id, form);
    } else {
      await base44.entities.Student.create(form);
    }
    qc.invalidateQueries({ queryKey: ["students"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} />
            </div>
            <div>
              <Label>Student ID *</Label>
              <Input value={form.student_id} onChange={e => update("student_id", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Grade *</Label>
              <Select value={form.grade} onValueChange={v => update("grade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{grades.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section</Label>
              <Input value={form.section} onChange={e => update("section", e.target.value)} />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => update("date_of_birth", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Parent Name</Label>
              <Input value={form.parent_name} onChange={e => update("parent_name", e.target.value)} />
            </div>
            <div>
              <Label>Parent Phone</Label>
              <Input value={form.parent_phone} onChange={e => update("parent_phone", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Parent Email</Label>
            <Input value={form.parent_email} onChange={e => update("parent_email", e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={e => update("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Card Balance ($)</Label>
              <Input type="number" value={form.card_balance} onChange={e => update("card_balance", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Switch checked={form.bus_registered} onCheckedChange={v => update("bus_registered", v)} />
            <Label>Bus Registered</Label>
            {form.bus_registered && (
              <Input className="ml-auto w-40" placeholder="Bus route" value={form.bus_route} onChange={e => update("bus_route", e.target.value)} />
            )}
          </div>
          <Button onClick={handleSave} disabled={saving || !form.full_name || !form.student_id} className="w-full">
            {saving ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}