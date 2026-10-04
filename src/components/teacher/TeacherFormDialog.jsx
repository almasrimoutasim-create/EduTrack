import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { entities } from "@/api/dbClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { FileText, Upload, Eye, Trash2, Award, Loader2 } from "lucide-react";

function parseCertificates(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === "string" && parsed) return [parsed];
    } catch {
      // Not JSON — could be a single URL stored as plain text
      if (s.startsWith("data:") || s.startsWith("http") || s.startsWith("/")) return [s];
      return [];
    }
  }
  return [];
}

export default function TeacherFormDialog({ open, onClose, teacher }) {
  const isEdit = !!teacher;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const cvInputRef = useRef(null);
  const certInputRef = useRef(null);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => entities.Subject.list()
  });

  const [form, setForm] = useState({
    full_name: "", employee_id: "", email: "", phone: "",
    subject: "", subjects: "", photo_url: "", bio: "", salary: 0, status: "active", portal_password: "",
    cv_document_url: "", certificates_urls: []
  });

  useEffect(() => {
    if (teacher) {
      setForm({
        ...teacher,
        portal_password: "",
        cv_document_url: teacher.cv_document_url || "",
        certificates_urls: parseCertificates(teacher.certificates_urls)
      });
    } else {
      setForm({
        full_name: "", employee_id: "", email: "", phone: "",
        subject: "", subjects: "", photo_url: "", bio: "", salary: 0, status: "active", portal_password: "",
        cv_document_url: "", certificates_urls: []
      });
    }
  }, [teacher, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const uploadFileToServer = async (file) => {
    const reader = new FileReader();
    const dataUri = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    let finalUrl = dataUri;
    try {
      const base64Data = typeof dataUri === "string" ? dataUri.split(",")[1] : null;
      if (base64Data) {
        const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
        const uploadUrl = apiBase ? `${apiBase}/neon-db/upload` : "/neon-db/upload";
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileData: base64Data })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.fileUrl) finalUrl = data.fileUrl;
        }
      }
    } catch (err) {
      console.warn("Upload endpoint failed, falling back to data URI:", err);
    }
    return finalUrl;
  };

  const handleCvUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploadingCv(true);
    try {
      const url = await uploadFileToServer(file);
      update("cv_document_url", url);
    } finally {
      setUploadingCv(false);
    }
  };

  const handleCertUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploadingCert(true);
    try {
      const url = await uploadFileToServer(file);
      setForm(f => ({ ...f, certificates_urls: [...parseCertificates(f.certificates_urls), url] }));
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCertificate = (idx) => {
    setForm(f => ({ ...f, certificates_urls: parseCertificates(f.certificates_urls).filter((_, i) => i !== idx) }));
  };

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
      const certs = parseCertificates(form.certificates_urls);
      const payload = { ...form, certificates_urls: certs.length > 0 ? JSON.stringify(certs) : null };
      if (!payload.portal_password) {
        delete payload.portal_password;
      }
      if (!payload.cv_document_url) {
        payload.cv_document_url = null;
      }

      if (isEdit) {
        await entities.Teacher.update(teacher.id, payload);
      } else {
        await entities.Teacher.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["teachers"] });
      onClose();
    } catch (err) {
      console.error("Failed to save teacher:", err);
    }
    setSaving(false);
  };

  // Filter only active subjects for selection (يجب أن تعرض فقط المواد التي أضافها مدير النظام)
  const activeSubjects = subjects
    .filter(s => s.status !== "inactive")
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

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
                  <SelectValue placeholder={subjectsLoading ? "جاري التحميل..." : activeSubjects.length === 0 ? "لا توجد مواد — أضف مادة أولاً" : "اختر المادة الأساسية"} />
                </SelectTrigger>
                <SelectContent className="text-right" dir="rtl">
                  <SelectItem value="none">بدون مادة أساسية</SelectItem>
                  {activeSubjects.map(s => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}{s.code ? ` (${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subjectsLoading ? (
                <p className="text-[11px] text-stone-400 mt-1">جاري تحميل المواد...</p>
              ) : activeSubjects.length === 0 ? (
                <p className="text-[11px] text-amber-600 mt-1">لا توجد مواد نشطة. يرجى إضافة المواد من صفحة <a href="/subjects" className="underline font-bold">المواد الدراسية</a> أولاً.</p>
              ) : (
                <p className="text-[11px] text-stone-400 mt-1">{activeSubjects.length} مادة متاحة من إدارة النظام</p>
              )}
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
              {subjectsLoading ? (
                <p className="text-xs text-stone-400 text-center">جاري تحميل المواد...</p>
              ) : activeSubjects.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-xs text-amber-600 font-medium">لا توجد مواد نشطة متاحة حالياً</p>
                  <p className="text-[11px] text-stone-400 mt-1">قم بإضافة المواد من <a href="/subjects" className="text-primary underline font-bold">إدارة المواد الدراسية</a> وسيظهر هنا تلقائياً</p>
                </div>
              ) : (
                activeSubjects.map(s => {
                  const currentSubjects = form.subjects 
                    ? form.subjects.split(",").map(item => item.trim()).filter(Boolean) 
                    : [];
                  const isChecked = currentSubjects.includes(s.name);
                  const cbId = `teacher-subject-${s.id}`;
                  return (
                    <label htmlFor={cbId} key={s.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700">
                      <input id={cbId} name={cbId} aria-label={s.name} 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={e => handleSubjectCheckboxChange(s.name, e.target.checked)}
                        className="rounded border-stone-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{s.name}{s.code ? ` (${s.code})` : ""}</span>
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
          {/* مستندات المعلم: السيرة الذاتية + الشهادات (من التسجيل العام) */}
          <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-3">
            <Label className="block font-bold">مستندات المعلم / Documents</Label>
            {/* السيرة الذاتية */}
            <div className="space-y-1.5">
              <Label className="text-xs">مستند السيرة الذاتية (صورة أو PDF)</Label>
              <input type="file" ref={cvInputRef} accept="image/*,application/pdf" onChange={e => { handleCvUpload(e.target.files?.[0]); e.target.value = ""; }} className="hidden" />
              {form.cv_document_url ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                    <p className="text-xs font-bold text-stone-800 truncate">تم إرفاق السيرة الذاتية</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={form.cv_document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors" title="معاينة"><Eye size={15} /></a>
                    <button type="button" onClick={() => update("cv_document_url", "")} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title="حذف"><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : (
                <div onClick={() => cvInputRef.current?.click()} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-white cursor-pointer transition-all">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">{uploadingCv ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-700 truncate">انقر لاختيار ملف السيرة الذاتية</p>
                    <p className="text-[10px] text-stone-400">صورة أو PDF (الحد الأقصى 5MB)</p>
                  </div>
                </div>
              )}
            </div>
            {/* الشهادات */}
            <div className="space-y-1.5">
              <Label className="text-xs">مستندات الشهادات (يمكن رفع أكثر من شهادة)</Label>
              <input type="file" ref={certInputRef} accept="image/*,application/pdf" onChange={e => { handleCertUpload(e.target.files?.[0]); e.target.value = ""; }} className="hidden" />
              {parseCertificates(form.certificates_urls).length > 0 && (
                <div className="space-y-2">
                  {parseCertificates(form.certificates_urls).map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0"><Award size={15} /></div>
                        <p className="text-xs font-bold text-stone-800 truncate">الشهادة {idx + 1}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors" title="معاينة"><Eye size={15} /></a>
                        <button type="button" onClick={() => removeCertificate(idx)} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title="حذف"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => certInputRef.current?.click()} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-white cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">{uploadingCert ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-700 truncate">انقر لإضافة شهادة</p>
                  <p className="text-[10px] text-stone-400">يمكنك إضافة عدة شهادات - صورة أو PDF لكل شهادة</p>
                </div>
              </div>
            </div>
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

