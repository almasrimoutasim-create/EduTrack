import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export default function TeacherFormDialog({ open, onClose, teacher }) {
  const isEdit = !!teacher;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list()
  });

  const [form, setForm] = useState({
    full_name: "", employee_id: "", email: "", phone: "",
    subject: "", subjects: "", photo_url: "", bio: "", salary: 0, status: "active", portal_password: ""
  });

  useEffect(() => {
    setForm(teacher || {
      full_name: "", employee_id: "", email: "", phone: "",
      subject: "", subjects: "", photo_url: "", bio: "", salary: 0, status: "active", portal_password: ""
    });
  }, [teacher, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubjectCheckboxChange = (subjectName, checked) => {
    const currentSubjects = form.subjects 
      ? form.subjects.split(",").map(s => s.trim()).filter(Boolean) 
      : [];
    
    let updatedSubjects;
    if (checked) {
      if (!currentSubjects.includes(subjectName)) {
        updatedSubjects = [...currentSubjects, subjectName];
      } else {
        updatedSubjects = currentSubjects;
      }
    } else {
      updatedSubjects = currentSubjects.filter(s => s !== subjectName);
    }
    
    update("subjects", updatedSubjects.join(", "));
  };

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

  // Filter only active subjects for selection
  const activeSubjects = subjects.filter(s => s.status !== "inactive");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle>{isEdit ? "تعديل بيانات المعلم / Edit Teacher" : "إضافة معلم جديد / Add Teacher"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4 text-right" dir="rtl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الاسم الكامل / Full Name *</Label>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="مثال: أحمد حسن" className="text-right" />
            </div>
            <div>
              <Label>الرقم الوظيفي / Employee ID *</Label>
              <Input value={form.employee_id} onChange={e => update("employee_id", e.target.value)} placeholder="مثال: TCH-001" className="text-right" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>البريد الإلكتروني / Email</Label>
              <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="text-right num-en" />
            </div>
            <div>
              <Label>رقم الهاتف / Phone</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} className="text-right num-en" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>المادة الأساسية / Primary Subject</Label>
              <Select value={form.subject || "none"} onValueChange={v => update("subject", v === "none" ? "" : v)}>
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue placeholder="اختر المادة الأساسية" />
                </SelectTrigger>
                <SelectContent className="text-right" dir="rtl">
                  <SelectItem value="none">بدون مادة أساسية</SelectItem>
                  {activeSubjects.map(s => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>كلمة مرور البوابة / Portal Password</Label>
              <Input 
                type="password" 
                value={form.portal_password || ""} 
                onChange={e => update("portal_password", e.target.value)} 
                placeholder={isEdit ? "اتركها فارغة للإبقاء على الحالية" : "••••••••"} 
                className="text-right"
              />
            </div>
          </div>
          
          <div>
            <Label className="block mb-2">المواد التي يدرسها المعلم / Subjects Taught</Label>
            <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 max-h-40 overflow-y-auto space-y-2">
              {activeSubjects.length === 0 ? (
                <p className="text-xs text-stone-400 text-center">لا توجد مواد نشطة متاحة حالياً</p>
              ) : (
                activeSubjects.map(s => {
                  const currentSubjects = form.subjects 
                    ? form.subjects.split(",").map(item => item.trim()).filter(Boolean) 
                    : [];
                  const isChecked = currentSubjects.includes(s.name);
                  return (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={e => handleSubjectCheckboxChange(s.name, e.target.checked)}
                        className="rounded border-stone-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{s.name} ({s.code})</span>
                    </label>
                  );
                })
              )}
            </div>
            <Input 
              value={form.subjects} 
              onChange={e => update("subjects", e.target.value)} 
              placeholder="أو اكتب المواد يدوياً مفصولة بفاصلة" 
              className="text-right mt-2 text-xs" 
            />
          </div>

          <div>
            <Label>نبذة تعريفية / Bio</Label>
            <Textarea value={form.bio} onChange={e => update("bio", e.target.value)} rows={2} className="text-right" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الراتب / Salary</Label>
              <Input type="number" value={form.salary} onChange={e => update("salary", parseFloat(e.target.value) || 0)} className="text-right num-en" />
            </div>
            <div>
              <Label>الحالة / Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger className="w-full text-right" dir="rtl"><SelectValue /></SelectTrigger>
                <SelectContent className="text-right" dir="rtl">
                  <SelectItem value="active">نشط / Active</SelectItem>
                  <SelectItem value="on_leave">إجازة / On Leave</SelectItem>
                  <SelectItem value="resigned">مستقيل / Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.full_name || !form.employee_id} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "جاري الحفظ..." : isEdit ? "تحديث المعلم / Update Teacher" : "إضافة معلم / Add Teacher"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

