import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, Building2, Phone, Mail, BookOpen, Loader2 } from "lucide-react";

export default function PublicTeacherRegister() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState(null);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", subjects: "", experience_years: "", bio: "", city: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error(isRTL ? "الاسم الكامل مطلوب" : "Full name is required"); return; }
    setLoading(true);
    try {
      const url = apiBase ? `${apiBase}/neon-db/public-register/teacher/${slug}` : `/neon-db/public-register/teacher/${slug}`;
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
              <p className="text-stone-700">{isRTL ? "رقم الموظف:" : "Employee ID:"} <span className="font-mono font-bold">{success.employee_id}</span></p>
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
          {school.logo_url && <div className="flex justify-center mb-4"><img src={school.logo_url} alt={school.name_ar || school.name} className="h-16 object-contain" /></div>}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600"><UserPlus size={24} /></div>
            <div>
              <h2 className="text-lg font-black text-stone-900">{isRTL ? "تسجيل معلم جديد" : "Teacher Registration"}</h2>
              <p className="text-xs text-stone-500">{school.name_ar || school.name}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="field-publicteacherregister-full-name" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "الاسم الكامل *" : "Full Name *"}</label>
              <input id="field-publicteacherregister-full-name" name="full_name" aria-label="full name" value={form.full_name} onChange={e => update("full_name", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left" placeholder={isRTL ? "أدخل اسمك الكامل" : "Enter your full name"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-publicteacherregister-email" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "البريد الإلكتروني" : "Email"}</label>
                <input id="field-publicteacherregister-email" name="email" aria-label="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left" placeholder="teacher@email.com" />
              </div>
              <div>
                <label htmlFor="field-publicteacherregister-phone" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "رقم الهاتف" : "Phone"}</label>
                <input id="field-publicteacherregister-phone" name="phone" aria-label="phone" value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left" placeholder="0912345678" />
              </div>
            </div>
            <div>
              <label htmlFor="field-publicteacherregister-subjects" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "المادة الدراسية" : "Subjects"}</label>
              <input id="field-publicteacherregister-subjects" name="subjects" aria-label="subjects" value={form.subjects} onChange={e => update("subjects", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left" placeholder={isRTL ? "مثال: رياضيات، علوم" : "e.g. Math, Science"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-publicteacherregister-experience-years" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "سنوات الخبرة" : "Experience Years"}</label>
                <input id="field-publicteacherregister-experience-years" name="experience_years" aria-label="experience years" type="number" min="0" value={form.experience_years} onChange={e => update("experience_years", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left" placeholder="5" />
              </div>
              <div>
                <label htmlFor="field-publicteacherregister-city" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "المدينة" : "City"}</label>
                <input id="field-publicteacherregister-city" name="city" aria-label="city" value={form.city} onChange={e => update("city", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left" placeholder={isRTL ? "الخرطوم" : "Khartoum"} />
              </div>
            </div>
            <div>
              <label htmlFor="field-publicteacherregister-bio" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "نبذة عنك" : "Bio"}</label>
              <textarea id="field-publicteacherregister-bio" name="bio" aria-label="bio" value={form.bio} onChange={e => update("bio", e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left resize-none" placeholder={isRTL ? "خبراتك التعليمية..." : "Your teaching experience..."} />
            </div>
            <div>
              <label htmlFor="field-publicteacherregister-notes" className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "ملاحظات" : "Notes"}</label>
              <textarea id="field-publicteacherregister-notes" name="notes" aria-label="notes" value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-purple-500 text-left resize-none" placeholder={isRTL ? "ملاحظات إضافية" : "Additional notes"} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {isRTL ? "تسجيل" : "Register"}
            </button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
