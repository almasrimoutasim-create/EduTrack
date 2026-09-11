import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, MapPin, Mail, Phone, User, Building2, BookOpen, GraduationCap, Loader2 } from "lucide-react";

const GRADE_OPTIONS = [
  { id: "1", name: "الصف الأول", nameEn: "Grade 1" },
  { id: "2", name: "الصف الثاني", nameEn: "Grade 2" },
  { id: "3", name: "الصف الثالث", nameEn: "Grade 3" },
  { id: "4", name: "الصف الرابع", nameEn: "Grade 4" },
  { id: "5", name: "الصف الخامس", nameEn: "Grade 5" },
  { id: "6", name: "الصف السادس", nameEn: "Grade 6" },
  { id: "7", name: "الصف السابع", nameEn: "Grade 7" },
  { id: "8", name: "الصف الثامن", nameEn: "Grade 8" },
  { id: "9", name: "الصف التاسع", nameEn: "Grade 9" },
  { id: "10", name: "الصف العاشر", nameEn: "Grade 10" },
  { id: "11", name: "الصف الحادي عشر", nameEn: "Grade 11" },
  { id: "12", name: "الصف الثاني عشر", nameEn: "Grade 12" },
];

export default function PublicStudentRegister() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    phone: "",
    grade: "",
    city: "",
    notes: "",
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
        if (data.success && data.school) {
          setSchool(data.school);
        } else {
          setSchoolError(data.error || "School not found");
        }
      } catch {
        setSchoolError("تعذر الاتصال بالخادم");
      } finally {
        setSchoolLoading(false);
      }
    };
    if (slug) fetchSchool();
  }, [slug]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.parent_name.trim() || !form.parent_phone.trim()) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const url = apiBase ? `${apiBase}/neon-db/public-register/student/${slug}` : `/neon-db/public-register/student/${slug}`;
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
    } finally {
      setLoading(false);
    }
  };

  if (schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (schoolError || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="p-8 text-center rounded-[32px] border-none shadow-xl bg-white max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
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
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "تم التسجيل بنجاح!" : "Registration Successful!"}</h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-4">
              {isRTL ? `تم تسجيل الطالب في ${success.school_name}` : `Student registered at ${success.school_name}`}
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 text-right text-sm">
              <p className="font-bold text-emerald-800 mb-1">{isRTL ? "بيانات الدخول:" : "Login Credentials:"}</p>
              <p className="text-stone-700">{isRTL ? "رقم الطالب:" : "Student ID:"} <span className="font-mono font-bold">{success.student_id}</span></p>
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
          {school.logo_url && (
            <div className="flex justify-center mb-4">
              <img src={school.logo_url} alt={school.name_ar || school.name} className="h-16 object-contain" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">{isRTL ? "تسجيل طالب جديد" : "Student Registration"}</h2>
              <p className="text-xs text-stone-500">{school.name_ar || school.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "اسم الطالب *" : "Student Name *"}</label>
              <div className="relative"><User size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                <input value={form.full_name} onChange={e => update("full_name", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left" placeholder={isRTL ? "أدخل اسم الطالب" : "Enter student name"} /></div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "اسم ولي الأمر *" : "Parent Name *"}</label>
              <div className="relative"><User size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                <input value={form.parent_name} onChange={e => update("parent_name", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left" placeholder={isRTL ? "أدخل اسم ولي الأمر" : "Enter parent name"} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "رقم هاتف ولي الأمر *" : "Parent Phone *"}</label>
                <div className="relative"><Phone size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                  <input value={form.parent_phone} onChange={e => update("parent_phone", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left" placeholder="0912345678" /></div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "رقم هاتف الطالب" : "Student Phone"}</label>
                <div className="relative"><Phone size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                  <input value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left" placeholder="0912345678" /></div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "البريد الإلكتروني لولي الأمر" : "Parent Email"}</label>
              <div className="relative"><Mail size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                <input type="email" value={form.parent_email} onChange={e => update("parent_email", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left" placeholder="parent@email.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "الصف الدراسي *" : "Grade *"}</label>
                <div className="relative"><GraduationCap size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                  <select value={form.grade} onChange={e => update("grade", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left appearance-none bg-white">
                    <option value="">{isRTL ? "اختر" : "Select"}</option>
                    {GRADE_OPTIONS.map(g => <option key={g.id} value={isRTL ? g.name : g.nameEn}>{isRTL ? g.name : g.nameEn}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "المدينة" : "City"}</label>
                <div className="relative"><MapPin size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400" />
                  <input value={form.city} onChange={e => update("city", e.target.value)} className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left" placeholder={isRTL ? "الخرطوم" : "Khartoum"} /></div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1 block">{isRTL ? "ملاحظات" : "Notes"}</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-blue-500 text-left resize-none" placeholder={isRTL ? "أي ملاحظات إضافية" : "Any additional notes"} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {isRTL ? "تسجيل" : "Register"}
            </button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
