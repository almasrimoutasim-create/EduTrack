import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, ArrowLeft, MapPin, Mail, Phone, User, Building2, BookOpen, Shield, GraduationCap, AlertCircle } from "lucide-react";

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

export default function StudentRegister() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [form, setForm] = useState({
    student_name: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    grade: "",
    school_name: "",
    city: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.parent_name.trim() || !form.parent_email.trim() || !form.parent_phone.trim() || !form.grade) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parent_email)) {
      toast.error(isRTL ? "صيغة البريد غير صحيحة" : "Invalid email format");
      return;
    }
    setLoading(true);
    try {
      await entities.RegistrationRequest.create({
        full_name: form.student_name.trim(),
        director_name: form.parent_name.trim(),
        email: form.parent_email.trim().toLowerCase(),
        phone: form.parent_phone.trim(),
        country: form.city.trim() || "السودان",
        plan: "student_free",
        role_requested: "student",
        grade: form.grade,
        school_name: form.school_name.trim() || null,
        notes: form.notes.trim() || null,
        status: "pending",
      });
      setSuccess(true);
      toast.success(isRTL ? "تم إرسال طلب التسجيل بنجاح" : "Registration request sent successfully");
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
            <p className="text-sm text-stone-500 leading-relaxed mb-2">
              {isRTL ? "شكراً لتسجيل طالبك! تم إرسال طلبكم إلى إدارة المنصة وسيتم تفعيل الحساب قريباً." : "Thanks for registering your student! Your request has been sent to platform admin and will be activated soon."}
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 text-right text-sm">
              <div className="flex items-center gap-2 text-emerald-800 mb-2">
                <BookOpen size={16} />
                <span className="font-bold">{isRTL ? "ماذا يحصل الآن؟" : "What happens next?"}</span>
              </div>
              <ul className="space-y-1 text-stone-700">
                <li>✓ {isRTL ? "سيتم إنشاء حساب الطالب مع اسم مستخدم وكلمة مرور" : "Student account with username/password will be created"}</li>
                <li>✓ {isRTL ? "الوصول الفوري لكتب المنهج السوداني المجانية" : "Instant free access to Sudanese curriculum books"}</li>
                <li>✓ {isRTL ? "إمكانية طلب اشتراك مع معلم خاص للدروس المباشرة" : "Can request subscription with private teacher for live classes"}</li>
                <li>✓ {isRTL ? "ستصل بيانات الدخول عبر الواتساب/البريد الإلكتروني" : "Login credentials sent via WhatsApp/Email"}</li>
              </ul>
            </div>
            <button onClick={() => window.location.href = "/"} className="w-full h-11 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black flex items-center justify-center gap-2">
              <ArrowLeft size={16} className={isRTL ? "" : "rotate-180"} />
              {isRTL ? "العودة للرئيسية" : "Back to Home"}
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
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-1.5 text-xs font-bold text-stone-600 shadow-sm">
            <GraduationCap size={14} className="text-emerald-600"/> {isRTL ? "تسجيل طالب جديد مجاني" : "Free Student Registration"}
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-3">{isRTL ? "تسجيل طالب جديد في EduTrack" : "Register New Student"}</h1>
          <p className="text-sm text-stone-500 mt-1">{isRTL ? "املأ البيانات أدناه — يحصل الطالب على وصول فوري لكتب المنهج السوداني، ويمكنه لاحقاً طلب الاشتراك مع معلم خاص" : "Fill details below — student gets instant access to Sudanese curriculum books, can later request private teacher subscription"}</p>
        </div>

        <Card className="p-6 md:p-8 rounded-[28px] border-none shadow-lg bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800 flex gap-2">
              <Shield size={16} className="shrink-0 mt-0.5"/> <span>{isRTL ? "التسجيل مجاني — يحصل الطالب على كتب المنهج السوداني، الواجبات، ومتابعة التقديرات. للاشتراك مع معلم خاص (دروس مباشرة، فيديوهات)، يرسل طلب من داخل البوابة." : "Free registration — student gets Sudanese curriculum books, assignments, grade tracking. For private teacher (live classes, videos), sends subscription request from portal."}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><User size={12}/> {isRTL ? "اسم الطالب الكامل *" : "Student full name *"}</label>
                <Input value={form.student_name} onChange={e => update("student_name", e.target.value)} placeholder={isRTL ? "مثال: أحمد محمد علي" : "e.g. Ahmed Mohamed Ali"} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><User size={12}/> {isRTL ? "اسم ولي الأمر *" : "Parent name *"}</label>
                <Input value={form.parent_name} onChange={e => update("parent_name", e.target.value)} placeholder={isRTL ? "الاسم الكامل لولي الأمر" : "Parent full name"} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Building2 size={12}/> {isRTL ? "الصف الدراسي *" : "Grade *"}</label>
                <select value={form.grade} onChange={e => update("grade", e.target.value)} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                  <option value="">{isRTL ? "اختر الصف" : "Select grade"}</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g.id} value={g.id}>{isRTL ? g.name : g.nameEn}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><MapPin size={12}/> {isRTL ? "المدينة / المنطقة" : "City / Area"}</label>
                <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder={isRTL ? "مثال: الخرطوم، أم درمان" : "e.g. Khartoum, Omdurman"} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Mail size={12}/> {isRTL ? "بريد ولي الأمر الإلكتروني *" : "Parent email *"}</label>
                <Input type="email" value={form.parent_email} onChange={e => update("parent_email", e.target.value)} placeholder="parent@email.com" className="h-11 rounded-xl" required dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Phone size={12}/> {isRTL ? "هاتف ولي الأمر *" : "Parent phone *"}</label>
                <Input value={form.parent_phone} onChange={e => update("parent_phone", e.target.value)} placeholder={isRTL ? "مع رمز البلد (مثال: 2499xxxxxxx)" : "With country code"} className="h-11 rounded-xl" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Building2 size={12}/> {isRTL ? "اسم المدرسة الحالية (اختياري)" : "Current school name (optional)"}</label>
                <Input value={form.school_name} onChange={e => update("school_name", e.target.value)} placeholder={isRTL ? "مثال: مدرسة النور الأهلية" : "e.g. Al-Noor School"} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><AlertCircle size={12}/> {isRTL ? "ملاحظات إضافية" : "Additional notes"}</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder={isRTL ? "أي معلومات طبية، حساسية، احتياجات خاصة، أو ملاحظات..." : "Medical info, allergies, special needs..."} rows={2} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10" />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 flex gap-2">
              <BookOpen size={14} className="shrink-0 mt-0.5"/> <span>{isRTL ? "بعد الإرسال، يحصل الطالب على: ① كتب المنهج السوداني مجاناً ② إمكانية حل الواجبات والامتحانات ③ متابعة التقديرات ④ زر 'طلب اشتراك مع معلم' للدروس المباشرة والفيديوهات" : "After submit, student gets: ① Free Sudanese curriculum books ② Assignments & exams ③ Grade tracking ④ 'Request Teacher Subscription' for live classes & videos"}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => window.location.href = "/"} className="flex-1 h-11 rounded-xl border border-stone-200 bg-white font-bold text-sm hover:bg-stone-50">
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={loading} className="flex-[2] h-11 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (isRTL ? "جاري الإرسال..." : "Sending...") : (<><UserPlus size={16} />{isRTL ? "إرسال طلب التسجيل" : "Submit Registration"}</>)}
              </button>
            </div>
          </form>
        </Card>
        <p className="text-center text-xs text-stone-400 mt-4">{isRTL ? "سيتم مراجعة الطلب وتفعيل الحساب خلال 24 ساعة — بيانات الدخول ترسل لولي الأمر" : "Request reviewed within 24h — login credentials sent to parent"}</p>
      </div>
    </div>
  );
}