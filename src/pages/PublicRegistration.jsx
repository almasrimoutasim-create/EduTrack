import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, ArrowLeft, GraduationCap, Users, BookOpen, Briefcase, Heart } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "admin", labelAr: "مدير مدرسة", labelEn: "School Manager", icon: GraduationCap, desc: "إدارة كاملة للنظام" },
  { value: "teacher", labelAr: "معلم", labelEn: "Teacher", icon: BookOpen, desc: "إدارة الصفوف والدرجات" },
  { value: "student", labelAr: "طالب", labelEn: "Student", icon: Users, desc: "متابعة الدراسة والنتائج" },
  { value: "staff", labelAr: "موظف", labelEn: "Staff", icon: Briefcase, desc: "الخدمات الإدارية" },
  { value: "parent", labelAr: "ولي أمر", labelEn: "Parent", icon: Heart, desc: "متابعة أبنائكم" },
];

export default function PublicRegistration() {
  const { language } = useLanguage();
  const { appPublicSettings } = useAuth();
  const isRTL = language === "ar";
  const settings = appPublicSettings?.public_settings || {};
  const schoolName = isRTL ? (settings.school_name_ar || "مدارس إديوتراك") : (settings.school_name_en || "EduTrack");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    role_requested: "",
    grade: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.role_requested) {
      toast.error(isRTL ? "يرجى ملء الاسم والبريد واختيار الصفة" : "Please fill name, email and role");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(isRTL ? "صيغة البريد غير صحيحة" : "Invalid email format");
      return;
    }
    setLoading(true);
    try {
      await entities.RegistrationRequest.create({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        id_number: form.id_number.trim() || null,
        role_requested: form.role_requested,
        grade: form.grade.trim() || null,
        notes: form.notes.trim() || null,
        status: "pending",
      });
      setSuccess(true);
      toast.success(isRTL ? "تم إرسال الطلب بنجاح" : "Request sent successfully");
    } catch (err) {
      toast.error(err.message || (isRTL ? "فشل إرسال الطلب" : "Failed to send request"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="p-8 text-center rounded-[32px] border-none shadow-xl bg-white">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "الطلب قيد المراجعة" : "Request Under Review"}</h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              {isRTL ? "شكراً لتسجيلك! تم إرسال طلبك إلى إدارة المدرسة وسيتم مراجعته قريباً. سيتواصل معك مدير النظام بعد الموافقة لتزويدك باسم المستخدم وكلمة المرور." : "Thanks for registering! Your request has been sent and is under review. Admin will contact you with credentials after approval."}
            </p>
            <button onClick={() => window.location.href = "/"} className="w-full h-11 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={16} className={isRTL ? "" : "rotate-180"} />
              {isRTL ? "العودة للبوابة" : "Back to Gateway"}
            </button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-stone-900">{isRTL ? "تسجيل جديد" : "New Registration"}</h1>
          <p className="text-sm text-stone-500 mt-1">{schoolName} — {isRTL ? "املأ بياناتك واختر صفتك" : "Fill your data and choose your role"}</p>
        </div>

        <Card className="p-6 md:p-8 rounded-[28px] border-none shadow-lg bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600">{isRTL ? "الاسم الكامل *" : "Full Name *"}</label>
                <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder={isRTL ? "محمد أحمد علي" : "Full name"} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600">{isRTL ? "البريد الإلكتروني *" : "Email *"}</label>
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="example@email.com" className="h-11 rounded-xl" required dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600">{isRTL ? "رقم الجوال" : "Phone"}</label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder={isRTL ? "05xxxxxxxx" : "Phone"} className="h-11 rounded-xl" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600">{isRTL ? "رقم الهوية / الإقامة" : "ID Number"}</label>
                <Input value={form.id_number} onChange={e => update("id_number", e.target.value)} placeholder={isRTL ? "اختياري" : "Optional"} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "اختر صفتك *" : "Choose your role *"}</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ROLE_OPTIONS.map(opt => {
                  const active = form.role_requested === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => update("role_requested", opt.value)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${active ? "border-stone-900 bg-stone-900 text-white shadow-lg" : "border-stone-200 bg-stone-50 hover:bg-white text-stone-700"}`}>
                      <opt.icon size={20} className={`mx-auto mb-1.5 ${active ? "text-white" : "text-stone-600"}`} />
                      <div className="text-xs font-black">{isRTL ? opt.labelAr : opt.labelEn}</div>
                      <div className={`text-[10px] mt-0.5 ${active ? "text-white/70" : "text-stone-400"}`}>{isRTL ? opt.desc : opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.role_requested === "student" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600">{isRTL ? "الصف الدراسي" : "Grade"}</label>
                <Input value={form.grade} onChange={e => update("grade", e.target.value)} placeholder={isRTL ? "مثال: الثالث المتوسط" : "e.g. Grade 9"} className="h-11 rounded-xl" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "ملاحظات إضافية" : "Notes"}</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder={isRTL ? "أي معلومات إضافية..." : "Any extra info..."} rows={3} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => window.location.href = "/"} className="flex-1 h-11 rounded-xl border border-stone-200 bg-white font-bold text-sm hover:bg-stone-50">
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={loading} className="flex-[2] h-11 rounded-xl bg-stone-900 text-white font-black text-sm hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (isRTL ? "جاري الإرسال..." : "Sending...") : (<><UserPlus size={16} />{isRTL ? "حفظ وإرسال" : "Save & Send"}</>)}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
