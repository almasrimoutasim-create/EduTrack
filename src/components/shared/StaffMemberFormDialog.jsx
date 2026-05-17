import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const roles = [
  { value: "bus_supervisor", label: "Bus Supervisor" },
  { value: "store_keeper", label: "Store Keeper" },
  { value: "security", label: "Security" },
];

const statuses = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "suspended", label: "Suspended" },
  { value: "terminated", label: "Terminated" },
];

export default function StaffMemberFormDialog({ open, onClose, member }) {
  const isEdit = !!member;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(member || {
    full_name: "", employee_id: "", role: "bus_supervisor",
    email: "", phone: "", portal_password: "", status: "active", notes: ""
  });

  useEffect(() => {
    setForm(member || {
      full_name: "", employee_id: "", role: "bus_supervisor",
      email: "", phone: "", portal_password: "", status: "active", notes: ""
    });
  }, [member]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.full_name || !form.employee_id || !form.role) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.StaffMember.update(member.id, form);
      } else {
        await base44.entities.StaffMember.create(form);
      }
      qc.invalidateQueries({ queryKey: ["staff-members"] });
      onClose();
    } catch (err) {
      console.error("Failed to save staff member:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="e.g. Omar Khalid" />
            </div>
            <div>
              <Label>Employee ID *</Label>
              <Input value={form.employee_id} onChange={e => update("employee_id", e.target.value)} placeholder="e.g. STF-001" />
            </div>
          </div>
          <div>
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={v => update("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
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
            <Label>Portal Password</Label>
            <Input type="password" value={form.portal_password} onChange={e => update("portal_password", e.target.value)} placeholder={isEdit ? "Leave blank to keep current" : "Set portal password"} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} />
          </div>
          <button onClick={handleSave} disabled={saving || !form.full_name || !form.employee_id || !form.role} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Staff" : "Add Staff Member"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
