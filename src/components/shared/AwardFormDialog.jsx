import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { entities } from "@/api/dbClient";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

const icons = [
  { value: "trophy", label: "🏆 Trophy" },
  { value: "star", label: "⭐ Star" },
  { value: "medal", label: "🎖️ Medal" },
  { value: "crown", label: "👑 Crown" },
  { value: "award", label: "🎯 Award" },
  { value: "zap", label: "⚡ Zap" },
  { value: "heart", label: "❤️ Heart" },
  { value: "flame", label: "🔥 Flame" },
];

const colors = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "red", label: "Red" },
];

export default function AwardFormDialog({ open, onClose, award }) {
  const isEdit = !!award;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(award || {
    student_id: "", student_name: "", title: "",
    description: "", icon: "trophy", color: "gold",
    awarded_by: "", awarded_date: new Date().toISOString().split("T")[0]
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-for-award"],
    queryFn: () => entities.Student.list("-created_date", 200),
    enabled: open,
  });

  useEffect(() => {
    setForm(award || {
      student_id: "", student_name: "", title: "",
      description: "", icon: "trophy", color: "gold",
      awarded_by: "", awarded_date: new Date().toISOString().split("T")[0]
    });
  }, [award]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleStudentSelect = (studentId) => {
    const student = students.find(s => s.id === studentId);
    update("student_id", studentId);
    update("student_name", student?.full_name || "");
  };

  const handleSave = async () => {
    if (!form.student_id || !form.student_name || !form.title) return;
    setSaving(true);
    try {
      if (isEdit) {
        await entities.StudentAward.update(award.id, form);
      } else {
        await entities.StudentAward.create(form);
      }
      qc.invalidateQueries({ queryKey: ["awards-list"] });
      onClose();
    } catch (err) {
      console.error("Failed to save award:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Award" : "Grant Award"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Student *</Label>
            <Select value={form.student_id} onValueChange={handleStudentSelect}>
              <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name || s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Award Title *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Student of the Month" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Select value={form.icon} onValueChange={v => update("icon", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {icons.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <Select value={form.color} onValueChange={v => update("color", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {colors.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Awarded By</Label>
              <Input value={form.awarded_by} onChange={e => update("awarded_by", e.target.value)} />
            </div>
            <div>
              <Label>Date</Label>
              <DatePicker value={form.awarded_date} onChange={val => update("awarded_date", val)} />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.student_id || !form.title} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Award" : "Grant Award"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
