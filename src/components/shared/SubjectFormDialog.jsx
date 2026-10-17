import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { entities } from "@/api/dbClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

/**
 * Automatically generates the next unique subject code
 * based on the school's existing subject codes pattern (e.g. T001..T013 -> T014)
 */
export function generateNextSubjectCode(existingSubjects = []) {
  if (!Array.isArray(existingSubjects) || existingSubjects.length === 0) {
    return "T001";
  }

  // Check T### pattern (used across the system)
  let maxT = 0;
  for (const s of existingSubjects) {
    if (s?.code) {
      const match = String(s.code).trim().match(/^T(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxT) maxT = n;
      }
    }
  }

  if (maxT > 0) {
    return `T${String(maxT + 1).padStart(3, "0")}`;
  }

  // Fallback: check SUB-### pattern
  let maxSub = 0;
  for (const s of existingSubjects) {
    if (s?.code) {
      const match = String(s.code).trim().match(/^SUB-(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxSub) maxSub = n;
      }
    }
  }

  if (maxSub > 0) {
    return `SUB-${String(maxSub + 1).padStart(3, "0")}`;
  }

  return `T${String(existingSubjects.length + 1).padStart(3, "0")}`;
}

export default function SubjectFormDialog({ open, onClose, subject }) {
  const isEdit = !!subject;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => entities.Teacher.list()
  });

  const { data: existingSubjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => entities.Subject.list()
  });

  const [form, setForm] = useState({
    name: "", code: "", grade: "1", teacher_id: "", teacher_name: "", status: "active", description: ""
  });

  // Automatically generate next code when dialog opens for new subject
  useEffect(() => {
    if (open) {
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
        const nextCode = generateNextSubjectCode(existingSubjects);
        setForm({
          name: "",
          code: nextCode,
          grade: "1",
          teacher_id: "",
          teacher_name: "",
          status: "active",
          description: ""
        });
      }
    }
  }, [subject, open, existingSubjects]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegenerateCode = () => {
    const nextCode = generateNextSubjectCode(existingSubjects);
    update("code", nextCode);
    toast.success(`تم توليد رمز المادة تلقائياً: ${nextCode}`);
  };

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
        toast.success("تم تحديث بيانات المادة بنجاح");
      } else {
        await entities.Subject.create(form);
        toast.success("تمت إضافة المادة بنجاح");
      }
      qc.invalidateQueries({ queryKey: ["subjects"] });
      onClose();
    } catch (err) {
      console.error("Failed to save subject:", err);
      toast.error("فشل حفظ بيانات المادة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl p-6 bg-white" dir="rtl">
        <DialogHeader className="text-right pb-2 border-b border-stone-100">
          <DialogTitle className="text-lg font-black text-stone-900">
            {isEdit ? "تعديل المادة / Edit Subject" : "إضافة مادة / Add Subject"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-stone-700 mb-1.5 block">
                اسم المادة / Subject Name *
              </Label>
              <Input
                value={form.name}
                onChange={e => update("name", e.target.value)}
                placeholder="e.g. Mathematics / الرياضيات"
                className="h-10 text-sm rounded-xl border-stone-200"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-stone-700">
                  رمز المادة / Subject Code *
                </Label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors"
                    title="إعادة توليد الرمز تلقائياً"
                  >
                    <Sparkles size={12} />
                    <span>توليد تلقائي</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  value={form.code}
                  onChange={e => update("code", e.target.value)}
                  placeholder="e.g. T014"
                  className="h-10 text-sm rounded-xl border-stone-200 font-mono font-bold ps-3 pe-8"
                  dir="ltr"
                />
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    title="تحديث الرمز التلقائي"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-stone-700 mb-1.5 block">
              الصف الدراسي / Grade *
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {grades.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update("grade", g)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    form.grade === g
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-600/25"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  الصف {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-stone-700 mb-1.5 block">
                المعلم المرتبط / Related Teacher
              </Label>
              <Select value={form.teacher_id || "none"} onValueChange={handleTeacherChange}>
                <SelectTrigger className="w-full h-10 text-xs rounded-xl border-stone-200">
                  <SelectValue placeholder="اختر معلماً / Select a teacher" />
                </SelectTrigger>
                <SelectContent dir="rtl">
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
              <Label className="text-xs font-bold text-stone-700 mb-1.5 block">
                حالة المادة / Status
              </Label>
              <Select value={form.status || "active"} onValueChange={v => update("status", v)}>
                <SelectTrigger className="w-full h-10 text-xs rounded-xl border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="active">نشط / Active</SelectItem>
                  <SelectItem value="inactive">غير نشط / Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-stone-700 mb-1.5 block">
              الوصف / Description
            </Label>
            <Textarea
              value={form.description}
              onChange={e => update("description", e.target.value)}
              rows={3}
              placeholder="وصف مختصر لمفردات المنهج وأهدافه..."
              className="text-sm rounded-xl border-stone-200"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name || !form.code || !form.grade}
            className="inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-black transition-all bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11 mt-2"
          >
            {saving ? "جاري الحفظ..." : isEdit ? "تحديث المادة / Update Subject" : "إضافة مادة / Add Subject"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
