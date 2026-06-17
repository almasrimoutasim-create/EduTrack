import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { entities } from "@/api/dbClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function SubjectFormDialog({ open, onClose, subject }) {
  const isEdit = !!subject;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => entities.Teacher.list()
  });

  const [form, setForm] = useState({
    name: "", code: "", grade: "1", teacher_id: "", teacher_name: "", status: "active", description: ""
  });

  useEffect(() => {
    if (subject) {
      setForm({
        name: subject.name || "",
        code: subject.code || "",
        grade: subject.grade || "1",
        teacher_id: subject.teacher_id || "",
        teacher_name: subject.teacher_name || "",
        status: subject.status || "active",
        description: subject.description || ""
      });
    } else {
      setForm({
        name: "", code: "", grade: "1", teacher_id: "", teacher_name: "", status: "active", description: ""
      });
    }
  }, [subject, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTeacherChange = (teacherId) => {
    if (!teacherId || teacherId === "none") {
      setForm(f => ({ ...f, teacher_id: "", teacher_name: "" }));
    } else {
      const selected = teachers.find(t => t.id === teacherId);
      if (selected) {
        setForm(f => ({ 
          ...f, 
          teacher_id: selected.id, 
          teacher_name: selected.full_name || selected.name 
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.grade) return;
    setSaving(true);
    try {
      if (isEdit) {
        await entities.Subject.update(subject.id, form);
      } else {
        await entities.Subject.create(form);
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
        <DialogHeader className="text-right">
          <DialogTitle>{isEdit ? "تعديل المادة / Edit Subject" : "إضافة مادة / Add Subject"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اسم المادة / Subject Name *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <Label>رمز المادة / Subject Code *</Label>
              <Input value={form.code} onChange={e => update("code", e.target.value)} placeholder="e.g. MATH-101" />
            </div>
          </div>
          <div>
            <Label>الصف الدراسي / Grade *</Label>
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
              <Label>المعلم المرتبط / Related Teacher</Label>
              <Select value={form.teacher_id || "none"} onValueChange={handleTeacherChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر معلماً / Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون معلم / No Teacher</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name || t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>حالة المادة / Status</Label>
              <Select value={form.status || "active"} onValueChange={v => update("status", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط / Active</SelectItem>
                  <SelectItem value="inactive">غير نشط / Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>الوصف / Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} />
          </div>
          <button onClick={handleSave} disabled={saving || !form.name || !form.code || !form.grade} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "جاري الحفظ..." : isEdit ? "تحديث المادة / Update Subject" : "إضافة مادة / Add Subject"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

