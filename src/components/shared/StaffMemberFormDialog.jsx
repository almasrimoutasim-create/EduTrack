import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { entities } from "@/api/dbClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "sonner";
import { FileText, Upload, Eye, Trash2, Award, Loader2 } from "lucide-react";

function parseStaffCertificates(raw) {
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
      if (s.startsWith("data:") || s.startsWith("http") || s.startsWith("/")) return [s];
      return [];
    }
  }
  return [];
}

export default function StaffMemberFormDialog({ open, onClose, member }) {
  const isEdit = !!member;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const cvInputRef = useRef(null);
  const certInputRef = useRef(null);
  const [form, setForm] = useState(member ? {
    ...member,
    salary: member.salary !== undefined && member.salary !== null ? Number(member.salary) : 4000,
    cv_document_url: member.cv_document_url || "",
    certificates_urls: parseStaffCertificates(member.certificates_urls)
  } : {
    full_name: "", employee_id: "", role: "bus_supervisor",
    email: "", phone: "", portal_password: "", status: "active", notes: "", salary: 4000,
    cv_document_url: "", certificates_urls: []
  });

  useEffect(() => {
    if (member) {
      setForm({
        ...member,
        portal_password: "",
        salary: member.salary !== undefined && member.salary !== null ? Number(member.salary) : 4000,
        cv_document_url: member.cv_document_url || "",
        certificates_urls: parseStaffCertificates(member.certificates_urls)
      });
    } else {
      setForm({
        full_name: "", employee_id: "", role: "bus_supervisor",
        email: "", phone: "", portal_password: "", status: "active", notes: "", salary: 4000,
        cv_document_url: "", certificates_urls: []
      });
    }
  }, [member]);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? "حجم الملف كبير جداً (الحد الأقصى 5MB)" : "File is too large (max 5MB)");
      return;
    }
    setUploadingCv(true);
    try {
      const url = await uploadFileToServer(file);
      update("cv_document_url", url);
      toast.success(isRTL ? "تم إرفاق السيرة الذاتية" : "CV attached");
    } finally {
      setUploadingCv(false);
    }
  };

  const handleCertUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? "حجم الملف كبير جداً (الحد الأقصى 5MB)" : "File is too large (max 5MB)");
      return;
    }
    setUploadingCert(true);
    try {
      const url = await uploadFileToServer(file);
      setForm(f => ({ ...f, certificates_urls: [...parseStaffCertificates(f.certificates_urls), url] }));
      toast.success(isRTL ? "تمت إضافة الشهادة" : "Certificate added");
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCertificate = (idx) => {
    setForm(f => ({ ...f, certificates_urls: parseStaffCertificates(f.certificates_urls).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.full_name) {
      toast.error(isRTL ? "يرجى إدخال الاسم الكامل للموظف" : "Please enter the employee's full name");
      return;
    }
    if (!form.role) {
      toast.error(isRTL ? "يرجى تحديد دور الموظف" : "Please select the employee's role");
      return;
    }
    if (form.salary === "" || form.salary === undefined || form.salary === null) {
      toast.error(isRTL ? "يرجى تحديد الراتب للموظف" : "Please specify the employee's salary");
      return;
    }
    setSaving(true);
    try {
      const certs = parseStaffCertificates(form.certificates_urls);
      const payload = {
        ...form,
        certificates_urls: certs.length > 0 ? JSON.stringify(certs) : null,
        cv_document_url: form.cv_document_url || null
      };
      if (!payload.portal_password) {
        delete payload.portal_password;
      }

      if (isEdit) {
        await entities.StaffMember.update(member.id, payload);
        toast.success(isRTL ? "تم تحديث بيانات الموظف بنجاح" : "Staff member updated successfully");
      } else {
        await entities.StaffMember.create(payload);
        toast.success(isRTL ? "تم إضافة الموظف الجديد بنجاح" : "New staff member added successfully");
      }
      qc.invalidateQueries({ queryKey: ["staff-members"] });
      onClose();
    } catch (err) {
      console.error("Failed to save staff member:", err);
      toast.error(isRTL ? `فشل حفظ البيانات: ${err.message}` : `Failed to save: ${err.message}`);
    }
    setSaving(false);
  };

  const roles = [
    { value: "bus_supervisor", label: isRTL ? "مشرف حافلة" : "Bus Supervisor" },
    { value: "store_keeper", label: isRTL ? "أمين مستودع" : "Store Keeper" },
    { value: "security", label: isRTL ? "حارس أمن" : "Security" },
    { value: "Admin", label: isRTL ? "مدير نظام" : "Admin" },
    { value: "HR", label: isRTL ? "موارد بشرية" : "HR" },
    { value: "Accountant", label: isRTL ? "محاسب" : "Accountant" },
    { value: "Registrar", label: isRTL ? "مسجل" : "Registrar" },
    { value: "counselor", label: isRTL ? "مرشد طلابي" : "Counselor" },
    { value: "support", label: isRTL ? "الدعم الفني" : "Technical Support" },
  ];

  const statuses = [
    { value: "active", label: isRTL ? "نشط" : "Active" },
    { value: "on_leave", label: isRTL ? "في إجازة" : "On Leave" },
    { value: "suspended", label: isRTL ? "موقوف" : "Suspended" },
    { value: "terminated", label: isRTL ? "منتهي الخدمة" : "Terminated" },
  ];

  const t = {
    titleAdd: isRTL ? "إضافة موظف جديد" : "Add Staff Member",
    titleEdit: isRTL ? "تعديل بيانات الموظف" : "Edit Staff Member",
    fullName: isRTL ? "الاسم الكامل *" : "Full Name *",
    employeeId: isRTL ? "الرقم الوظيفي" : "Employee ID",
    role: isRTL ? "الدور / المسمى الوظيفي *" : "Role *",
    email: isRTL ? "البريد الإلكتروني" : "Email",
    phone: isRTL ? "رقم الهاتف" : "Phone",
    password: isRTL ? "كلمة مرور البوابة" : "Portal Password",
    passwordPlaceholder: isRTL 
      ? (isEdit ? "اتركه فارغاً للاحتفاظ بالحالي" : "تعيين كلمة مرور البوابة") 
      : (isEdit ? "Leave blank to keep current" : "Set portal password"),
    status: isRTL ? "الحالة" : "Status",
    notes: isRTL ? "ملاحظات" : "Notes",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    save: isRTL ? "إضافة موظف" : "Add Staff Member",
    update: isRTL ? "تحديث البيانات" : "Update Staff"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className="">
          <DialogTitle className="font-display text-xl text-stone-900 font-bold">
            {isEdit ? t.titleEdit : t.titleAdd}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.fullName}</Label>
              <Input 
                value={form.full_name} 
                onChange={e => update("full_name", e.target.value)} 
                placeholder={isRTL ? "مثال: عمر خالد" : "e.g. Omar Khalid"} 
                className="mt-1 rounded-lg border-stone-200"
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.employeeId}</Label>
              <Input 
                value={form.employee_id} 
                onChange={e => update("employee_id", e.target.value)} 
                placeholder={isRTL ? "مثال: STF-001" : "e.g. STF-001"} 
                className="mt-1 rounded-lg border-stone-200 num-en"
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.role}</Label>
            <Select value={form.role} onValueChange={v => update("role", v)}>
              <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.email}</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={e => update("email", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="staff@edutrack.com"
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.phone}</Label>
              <Input 
                value={form.phone} 
                onChange={e => update("phone", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="+971 50 000 0000"
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.password}</Label>
            <Input 
              type="password" 
              value={form.portal_password || ""} 
              onChange={e => update("portal_password", e.target.value)} 
              placeholder={t.passwordPlaceholder} 
              className="mt-1 rounded-lg border-stone-200 num-en"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.status}</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{isRTL ? "الراتب الأساسي (ريال) *" : "Basic Salary (SAR) *"}</Label>
              <Input 
                type="number"
                value={form.salary !== undefined && form.salary !== null ? form.salary : ""} 
                onChange={e => update("salary", e.target.value !== "" ? Number(e.target.value) : "")} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "مثال: 5000" : "e.g. 5000"}
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.notes}</Label>
            <Textarea 
              value={form.notes || ""} 
              onChange={e => update("notes", e.target.value)} 
              rows={2} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "أية ملاحظات إضافية..." : "Any additional notes..."}
            />
          </div>
          {/* مستندات الموظف: السيرة الذاتية + الشهادات */}
          <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-3">
            <Label className="block font-bold">{isRTL ? "مستندات الموظف" : "Staff Documents"}</Label>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRTL ? "مستند السيرة الذاتية (صورة أو PDF)" : "CV Document (Image or PDF)"}</Label>
              <input type="file" ref={cvInputRef} accept="image/*,application/pdf" onChange={e => { handleCvUpload(e.target.files?.[0]); e.target.value = ""; }} className="hidden" />
              {form.cv_document_url ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                    <p className="text-xs font-bold text-stone-800 truncate">{isRTL ? "تم إرفاق السيرة الذاتية" : "CV attached"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={form.cv_document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors" title={isRTL ? "معاينة" : "Preview"}><Eye size={15} /></a>
                    <button type="button" onClick={() => update("cv_document_url", "")} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title={isRTL ? "حذف" : "Remove"}><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : (
                <div onClick={() => cvInputRef.current?.click()} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-white cursor-pointer transition-all">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">{uploadingCv ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-700 truncate">{isRTL ? "انقر لاختيار ملف السيرة الذاتية" : "Click to select CV file"}</p>
                    <p className="text-[10px] text-stone-400">{isRTL ? "صورة أو PDF (الحد الأقصى 5MB)" : "Image or PDF (Max 5MB)"}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRTL ? "مستندات الشهادات (يمكن رفع أكثر من شهادة)" : "Certificates (multiple allowed)"}</Label>
              <input type="file" ref={certInputRef} accept="image/*,application/pdf" onChange={e => { handleCertUpload(e.target.files?.[0]); e.target.value = ""; }} className="hidden" />
              {parseStaffCertificates(form.certificates_urls).length > 0 && (
                <div className="space-y-2">
                  {parseStaffCertificates(form.certificates_urls).map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0"><Award size={15} /></div>
                        <p className="text-xs font-bold text-stone-800 truncate">{isRTL ? `الشهادة ${idx + 1}` : `Certificate ${idx + 1}`}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors" title={isRTL ? "معاينة" : "Preview"}><Eye size={15} /></a>
                        <button type="button" onClick={() => removeCertificate(idx)} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title={isRTL ? "حذف" : "Remove"}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => certInputRef.current?.click()} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-white cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">{uploadingCert ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-700 truncate">{isRTL ? "انقر لإضافة شهادة" : "Click to add certificate"}</p>
                  <p className="text-[10px] text-stone-400">{isRTL ? "يمكنك إضافة عدة شهادات - صورة أو PDF لكل شهادة" : "You can add multiple certificates - image or PDF each"}</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
