import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function SubjectFormDialog({ open, onClose, subject }) {
  const isEdit = !!subject;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(subject || {
    name: "", code: "", grade: "1", teacher_id: "", teacher_name: "", description: ""
  });

  useEffect(() => {
    setForm(subject || {
      name: "", code: "", grade: "1", teacher_id: "", teacher_name: "", description: ""
    });
  }, [subject]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.code || !form.grade) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.Subject.update(subject.id, form);
      } else {
        await base44.entities.Subject.create(form);
      }
      qc.invalidateQueries({ queryKey: ["subjects"] });
      onClose();
    } catch (err) {
      console.error("Failed to save subject:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject Name *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <Label>Subject Code *</Label>
              <Input value={form.code} onChange={e => update("code", e.target.value)} placeholder="e.g. MATH-101" />
            </div>
          </div>
          <div>
            <Label>Grade *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {grades.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update("grade", g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                    form.grade === g
                      ? "bg-primary text-primary-foreground"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teacher ID</Label>
              <Input value={form.teacher_id} onChange={e => update("teacher_id", e.target.value)} />
            </div>
            <div>
              <Label>Teacher Name</Label>
              <Input value={form.teacher_name} onChange={e => update("teacher_name", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} />
          </div>
          <button onClick={handleSave} disabled={saving || !form.name || !form.code || !form.grade} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Subject" : "Add Subject"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
