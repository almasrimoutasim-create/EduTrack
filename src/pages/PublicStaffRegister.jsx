import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, Building2, Phone, Mail, Shield, Loader2, FileText, Upload, Eye, Trash2, Award, Calendar, Briefcase } from "lucide-react";

const STAFF_ROLES = [
  { value: "staff", name: "موظف عام", nameEn: "General Staff" },
  { value: "admin", name: "مدير", nameEn: "Administrator" },
  { value: "accountant", name: "محاسب", nameEn: "Accountant" },
  { value: "hr", name: "موارد بشرية", nameEn: "HR" },
  { value: "it", name: "تقنية المعلومات", nameEn: "IT" },
  { value: "security_guard", name: "حارس امن", nameEn: "Security Guard" },
  { value: "transport_supervisor", name: "مشرف ترحيل", nameEn: "Transport Supervisor" },
  { value: "student_counselor", name: "مرشد طلابي", nameEn: "Student Counselor" },
  { value: "driver", name: "سائق", nameEn: "Driver" },
  { value: "technician", name: "فني تقني", nameEn: "Technician" },
];

export default function PublicStaffRegister() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState(null);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", role: "staff", notes: "",
    date_of_birth: "", specialty: "", cv_document_url: "", certificates_urls: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const cvInputRef = useRef(null);
  const certInputRef = useRef(null);

  const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const url = apiBase ? `${apiBase}/neon-db/public-school/${slug}` : `/neon-db/public-school/${slug}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.school) { setSchool(data.school); }
        else { setSchoolError(data.error || "School not found"); }
      } catch { setSchoolError("تعذر الاتصال بالخادم"); }
      finally { setSchoolLoading(false); }
    };
    if (slug) fetchSchool();
  }, [slug]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCvUpload = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(isRTL ? "حجم الملف كبير جداً (الحد الأقصى 5MB)" : "File is too large (max 5MB)"); return; }
    setUploadingCv(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullDataUri = event.target.result;
      let finalUrl = fullDataUri;
      try {
        const base64Data = typeof fullDataUri === "string" ? fullDataUri.split(",")[1] : null;
        if (base64Data) {
          const url = apiBase ? `${apiBase}/neon-db/upload` : "/neon-db/upload";
          const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, fileData: base64Data }) });
          if (res.ok) { const data = await res.json(); if (data.fileUrl) finalUrl = data.fileUrl; }
        }
      } catch (err) { console.warn("Upload fallback:", err); }
      update("cv_document_url", finalUrl);
      setUploadingCv(false);
      toast.success(isRTL ? "تم إرفاق السيرة الذاتية" : "CV attached");
    };
    reader.onerror = () => { toast.error(isRTL ? "فشل قراءة الملف" : "Failed to read file"); setUploadingCv(false); };
    reader.readAsDataURL(file);
  };

  const handleCertificateUpload = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(isRTL ? "حجم الملف كبير جداً (الحد الأقصى 5MB)" : "File is too large (max 5MB)"); return; }
    setUploadingCert(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullDataUri = event.target.result;
      let finalUrl = fullDataUri;
      try {
        const base64Data = typeof fullDataUri === "string" ? fullDataUri.split(",")[1] : null;
        if (base64Data) {
          const url = apiBase ? `${apiBase}/neon-db/upload` : "/neon-db/upload";
          const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, fileData: base64Data }) });
          if (res.ok) { const data = await res.json(); if (data.fileUrl) finalUrl = data.fileUrl; }
        }
      } catch (err) { console.warn("Upload fallback:", err); }
      setForm(prev => ({ ...prev, certificates_urls: [...(prev.certificates_urls || []), finalUrl] }));
      setUploadingCert(false);
      toast.success(isRTL ? "تمت إضافة الشهادة" : "Certificate added");
    };
    reader.onerror = () => { toast.error(isRTL ? "فشل قراءة الملف" : "Failed to read file"); setUploadingCert(false); };
    reader.readAsDataURL(file);
  };

  const removeCertificate = (idx) => {
    setForm(prev => ({ ...prev, certificates_urls: prev.certificates_urls.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error(isRTL ? "الاسم الكامل مطلوب" : "Full name is required"); return; }
    setLoading(true);
    try {
      const url = apiBase ? `${apiBase}/neon-db/public-register/staff/${slug}` : `/neon-db/public-register/staff/${slug}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(data);
      toast.success(isRTL ? "تم التسجيل بنجاح" : "Registration successful");
    } catch (err) {
      toast.error(err.message || (isRTL ? "فشل التسجيل" : "Registration failed"));
    } finally { setLoading(false); }
  };

  if (schoolLoading) {
    return (<div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}><Loader2 className="animate-spin text-emerald-600" size={32} /></div>);
  }
  if (schoolError || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="p-8 text-center rounded-[32px] border-none shadow-xl bg-white max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4"><Building2 size={32} /></div>
          <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "المدرسة غير موجودة" : "School Not Found"}</h2>
          <p className="text-sm text-stone-500">{schoolError || "هذا الرابط غير صالح"}</p>
        </Card>
      </div>
    );
  }
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="p-8 text-center rounded-[32px] border-none shadow-xl bg-white">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
            <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "تم التسجيل بنجاح!" : "Registration Successful!"}</h2>
            <p className="text-sm text-stone-500 mb-4">{isRTL ? `تم التسجيل في ${success.school_name}` : `Registered at ${success.school_name}`}</p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 text-right text-sm">
              <p className="font-bold text-emerald-800 mb-1">{isRTL ? "بيانات الدخول:" : "Login Credentials:"}</p>
              <p className="text-stone-700">{isRTL ? "رقم الموظف:" : "Staff ID:"} <span className="font-mono font-bold">{success.staff_id}</span></p>
              <p className="text-stone-700">{isRTL ? "كلمة المرور:" : "Password:"} <span className="font-mono font-bold">{success.portal_password}</span></p>
            </div>
            <p className="text-xs text-stone-400">{isRTL ? "احفظ هذه البيانات لتسجيل الدخول" : "Keep these credentials for login"}</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg">
        <Card className="p-6 md:p-8 rounded-[32px] border-none shadow-xl bg-white">
          {school.logo_url && <div className="flex justify-center mb-2"><img src={school.logo_url} alt={school.name_ar || school.name} className="h-20 md:h-24 max-w-[220px] object-contain mx-auto" /></div>}
          <div className="flex flex-col items-center justify-center text-center gap-1 mb-6">
            <h2 className="text-xl md:text-2xl font-black text-stone-900">{isRTL ? "تسجيل موظف جديد" : "Staff Registration"}</h2>
            <p className="text-sm text-stone-500">{school.name_ar || school.name}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="field-publicstaffregister-full-name" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "الاسم الكامل *" : "Full Name *"}</label>
              <input id="field-publicstaffregister-full-name" name="full_name" aria-label="full name" value={form.full_name} onChange={e => update("full_name", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500 text-left" placeholder={isRTL ? "أدخل اسمك الكامل" : "Enter your full name"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-publicstaffregister-email" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "البريد الإلكتروني" : "Email"}</label>
                <input id="field-publicstaffregister-email" name="email" aria-label="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500 text-left" placeholder="staff@email.com" />
              </div>
              <div>
                <label htmlFor="field-publicstaffregister-phone" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "رقم الهاتف" : "Phone"}</label>
                <input id="field-publicstaffregister-phone" name="phone" aria-label="phone" value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500 text-left" placeholder="0912345678" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "تاريخ الميلاد" : "Date of Birth"}</label>
                <DatePicker value={form.date_of_birth} onChange={val => update("date_of_birth", val)} placeholder="mm/dd/yyyy" className="rounded-xl border-stone-200 h-[42px] focus-visible:ring-amber-500/20" />
              </div>
              <div>
                <label htmlFor="field-publicstaffregister-specialty" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "التخصص" : "Specialty"}</label>
                <div className="relative">
                  <Briefcase size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-stone-400`} />
                  <input id="field-publicstaffregister-specialty" name="specialty" aria-label="specialty" value={form.specialty} onChange={e => update("specialty", e.target.value)} className={`w-full ${isRTL ? 'pr-9' : 'pl-9'} pr-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500`} placeholder={isRTL ? "مثال: كهرباء، حاسوب، سائق" : "e.g. Electrical, IT, Driver"} />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="field-publicstaffregister-role" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "الدور" : "Role"}</label>
              <div className="relative"><Shield size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                <select id="field-publicstaffregister-role" name="role" aria-label="role" value={form.role} onChange={e => update("role", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500 text-left appearance-none bg-white">
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{isRTL ? r.name : r.nameEn}</option>)}
                </select>
              </div>
            </div>

            {/* مستند السيرة الذاتية */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">{isRTL ? "مستند السيرة الذاتية (صورة أو PDF)" : "CV Document (Image or PDF)"}</label>
              <input type="file" ref={cvInputRef} accept="image/*,application/pdf" onChange={e => handleCvUpload(e.target.files?.[0])} className="hidden" />
              {form.cv_document_url ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                    <p className="text-xs font-bold text-stone-800 truncate">{isRTL ? "تم إرفاق السيرة الذاتية" : "CV attached"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={form.cv_document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors"><Eye size={15} /></a>
                    <button type="button" onClick={() => update("cv_document_url", "")} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : (
                <div onClick={() => cvInputRef.current?.click()} className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/50 bg-stone-50/50 cursor-pointer transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">{uploadingCv ? <Loader2 size={15} className="animate-spin text-amber-600" /> : <Upload size={15} />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-700 truncate">{isRTL ? "انقر لاختيار ملف السيرة الذاتية" : "Click to select CV file"}</p>
                    <p className="text-[10px] text-stone-400">{isRTL ? "صورة أو PDF (الحد الأقصى 5MB)" : "Image or PDF (Max 5MB)"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* مستندات الشهادات - متعدد */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">{isRTL ? "مستندات الشهادات (يمكن رفع أكثر من شهادة)" : "Certificates (multiple allowed)"}</label>
              <input type="file" ref={certInputRef} accept="image/*,application/pdf" onChange={e => { handleCertificateUpload(e.target.files?.[0]); e.target.value = ""; }} className="hidden" />
              {form.certificates_urls?.length > 0 && (
                <div className="space-y-2">
                  {form.certificates_urls.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0"><Award size={15} /></div>
                        <p className="text-xs font-bold text-stone-800 truncate">{isRTL ? `الشهادة ${idx + 1}` : `Certificate ${idx + 1}`}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors"><Eye size={15} /></a>
                        <button type="button" onClick={() => removeCertificate(idx)} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => certInputRef.current?.click()} className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/50 bg-stone-50/50 cursor-pointer transition-all">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">{uploadingCert ? <Loader2 size={15} className="animate-spin text-amber-600" /> : <Upload size={15} />}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-700 truncate">{isRTL ? "انقر لإضافة شهادة" : "Click to add certificate"}</p>
                  <p className="text-[10px] text-stone-400">{isRTL ? "يمكنك إضافة عدة شهادات - صورة أو PDF لكل شهادة" : "You can add multiple certificates - image or PDF each"}</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="field-publicstaffregister-notes" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "ملاحظات" : "Notes"}</label>
              <textarea id="field-publicstaffregister-notes" name="notes" aria-label="notes" value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500 text-left resize-none" placeholder={isRTL ? "ملاحظات إضافية" : "Additional notes"} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {isRTL ? "تسجيل" : "Register"}
            </button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
