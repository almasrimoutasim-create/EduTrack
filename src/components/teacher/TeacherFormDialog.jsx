import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function TeacherFormDialog({ open, onClose, teacher }) {
  const isEdit = !!teacher;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(teacher || {
    full_name: "", employee_id: "", email: "", phone: "",
    subject: "", subjects: "", photo_url: "", bio: "", salary: 0, status: "active"
  });

  useEffect(() => {
    setForm(teacher || {
      full_name: "", employee_id: "", email: "", phone: "",
      subject: "", subjects: "", photo_url: "", bio: "", salary: 0, status: "active"
    });
  }, [teacher]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.full_name || !form.employee_id) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.Teacher.update(teacher.id, form);
      } else {
        await base44.entities.Teacher.create(form);
      }
      qc.invalidateQueries({ queryKey: ["teachers"] });
      onClose();
    } catch (err) {
      console.error("Failed to save teacher:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="e.g. Ahmed Hassan" />
            </div>
            <div>
              <Label>Employee ID *</Label>
              <Input value={form.employee_id} onChange={e => update("employee_id", e.target.value)} placeholder="e.g. TCH-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Primary Subject</Label>
            <Input value={form.subject} onChange={e => update("subject", e.target.value)} placeholder="e.g. Mathematics" />
          </div>
          <div>
            <Label>All Subjects (comma separated)</Label>
            <Input value={form.subjects} onChange={e => update("subjects", e.target.value)} placeholder="e.g. Math, Physics" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={e => update("bio", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Salary</Label>
              <Input type="number" value={form.salary} onChange={e => update("salary", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !form.full_name || !form.employee_id} className="w-full">
            {saving ? "Saving..." : isEdit ? "Update Teacher" : "Add Teacher"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
