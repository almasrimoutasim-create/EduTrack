import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, ArrowLeft, MapPin, Mail, Phone, User, Building2, BookOpen, Shield, GraduationCap, AlertCircle, Award, Star, Upload, Calendar, Clock, Gift, CreditCard } from "lucide-react";

const SUBJECT_OPTIONS = [
  { id: "math", name: "الرياضيات", nameEn: "Mathematics" },
  { id: "arabic", name: "اللغة العربية", nameEn: "Arabic Language" },
  { id: "english", name: "اللغة الإنجليزية", nameEn: "English Language" },
  { id: "science", name: "العلوم", nameEn: "Science" },
  { id: "physics", name: "الفيزياء", nameEn: "Physics" },
  { id: "chemistry", name: "الكيمياء", nameEn: "Chemistry" },
  { id: "biology", name: "الأحياء", nameEn: "Biology" },
  { id: "history", name: "التاريخ", nameEn: "History" },
  { id: "geography", name: "الجغرافيا", nameEn: "Geography" },
  { id: "islamic", name: "التربية الإسلامية", nameEn: "Islamic Education" },
  { id: "ict", name: "landırıl المعلومات", nameEn: "ICT" },
  { id: "other", name: "أخرى", nameEn: "Other" },
];

export default function TeacherRegister() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    school_name: "",
    subjects: [],
    experience_years: "",
    bio: "",
    notes: "",
    subscription_plan: "free",
    receipt_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleSubject = (id) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(id)
        ? prev.subjects.filter(s => s !== id)
        : [...prev.subjects, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
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
        phone: form.phone.trim(),
        country: form.city.trim() || "السودان",
        plan: form.subscription_plan === "free" ? "teacher_free" : form.subscription_plan === "monthly" ? "teacher_monthly" : "teacher_yearly",
        role_requested: "teacher",
        school_name: form.school_name.trim() || null,
        subjects: form.subjects.join(", ") || null,
        experience_years: form.experience_years || null,
        bio: form.bio.trim() || null,
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
            <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "طلب التسجيل قيد المراجعة" : "Registration Request Under Review"}</h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-2">
              {isRTL ? "شكراً لتسجيلك كمعلم! سيتم مراجعة طلبك من قبل إدارة المنصة وإصدار حسابك الخاص." : "Thank you for registering as a teacher! Your request will be reviewed by platform admin and your account will be issued."}
            </p>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-right text-sm">
              <div className="flex items-center gap-2 text-indigo-800 mb-2">
                <Award size={16} />
                <span className="font-bold">{isRTL ? "ماذا يحصل الآن؟" : "What happens next?"}</span>
              </div>
              <ul className="space-y-1 text-stone-700">
                <li>✓ {isRTL ? "ستتم مراجعة بياناتك من قبل مؤسس المنصة" : "Your details will be reviewed by platform founder"}</li>
                <li>✓ {isRTL ? "سيتم إنشاء اسم مستخدم وكلمة مرور خاصة بك" : "A username and password will be created for you"}</li>
                <li>✓ {isRTL ? "ستصل بيانات الدخول عبر الواتساب أو البريد الإلكتروني" : "Login credentials sent via WhatsApp or Email"}</li>
                <li>✓ {isRTL ? "تستطيع استخدامها للدخول من بوابة المعلم على Landing Page" : "Use them to login from the Teacher Portal on the Landing Page"}</li>
              </ul>
            </div>
            <button onClick={() => window.location.href = "/"} className="w-full h-11 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black flex items-center justify-center gap-2">
              <ArrowLeft size={16} className={isRTL ? "" : "rotate-180"} />
              {isRTL ? "العودة للبوابات" : "Back to Portals"}
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
            <GraduationCap size={14} className="text-indigo-600"/> {isRTL ? "تسجيل معلم جديد" : "New Teacher Registration"}
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-3">{isRTL ? "سجّل كمعلم مستقل على EduTrack" : "Register as Independent Teacher on EduTrack"}</h1>
          <p className="text-sm text-stone-500 mt-1">{isRTL ? "املأ البيانات أدناه — سيتم مراجعة طلبك وإصدار حسابك الخاص لإدارة طلابك وواجباتهم وامتحاناتك" : "Fill details below — your request will be reviewed and your account will be issued to manage your students, assignments and exams"}</p>
        </div>

        <Card className="p-6 md:p-8 rounded-[28px] border-none shadow-lg bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 flex gap-2">
              <Shield size={16} className="shrink-0 mt-0.5"/> <span>{isRTL ? "بوابتك المستقلة لإدارة طلابك: واجبات، امتحانات، حصص مباشرة، فيديوهات يوتيوب. عند الموافقة، تحصل على اسم مستخدم وكلمة مرور للدخول من زر 'دخول' في قسم بوابة المعلم." : "Your independent portal to manage students: assignments, exams, live classes, YouTube videos. On approval, you get username/password to login via the 'Enter' button in the Teacher Portal section."}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><User size={12}/> {isRTL ? "الاسم الكامل *" : "Full name *"}</label>
                <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder={isRTL ? "مثال: محمد أحمد عبدالله" : "e.g. Mohamed Ahmed Abdullah"} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Mail size={12}/> {isRTL ? "البريد الإلكتروني *" : "Email *"}</label>
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="teacher@email.com" className="h-11 rounded-xl" required dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Phone size={12}/> {isRTL ? "رقم الهاتف *" : "Phone number *"}</label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder={isRTL ? "مع رمز البلد (مثال: 2499xxxxxxx)" : "With country code"} className="h-11 rounded-xl" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><MapPin size={12}/> {isRTL ? "المدينة / المنطقة" : "City / Area"}</label>
                <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder={isRTL ? "مثال: الخرطوم، أم درمان" : "e.g. Khartoum, Omdurman"} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Building2 size={12}/> {isRTL ? "اسم المدرسة الحالية (اختياري)" : "Current school name (optional)"}</label>
                <Input value={form.school_name} onChange={e => update("school_name", e.target.value)} placeholder={isRTL ? "مثال: مدرسة النور الأهلية" : "e.g. Al-Noor School"} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><BookOpen size={12}/> {isRTL ? "المواد التي تُدرّس" : "Subjects you teach"}</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.subjects.includes(s.id) ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"}`}>
                    {isRTL ? s.name : s.nameEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Star size={12}/> {isRTL ? "سنوات الخبرة" : "Years of experience"}</label>
              <Input type="number" min="0" max="50" value={form.experience_years} onChange={e => update("experience_years", e.target.value)} placeholder={isRTL ? "مثال: 5" : "e.g. 5"} className="h-11 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><User size={12}/> {isRTL ? "نبذة عنك (اختياري)" : "About you (optional)"}</label>
              <textarea value={form.bio} onChange={e => update("bio", e.target.value)} placeholder={isRTL ? "خبراتك، تخصصاتك، أسلوب التدريس..." : "Your experience, specializations, teaching style..."} rows={2} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><AlertCircle size={12}/> {isRTL ? "ملاحظات إضافية" : "Additional notes"}</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder={isRTL ? "أي معلومات إضافية تود مشاركتها..." : "Any additional information you'd like to share..."} rows={2} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10" />
            </div>

            {/* Subscription Plan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Star size={12}/> {isRTL ? "باقة الاشتراك" : "Subscription Plan"}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "free", label: isRTL ? "تجريبي مجاني" : "Free Trial", price: isRTL ? "مجاني لمدة شهر" : "Free for 1 month", desc: isRTL ? "شهر مجاني — بعد الموافقة يُفعّل حسابك" : "Free month — account activated after approval", color: "stone", icon: Gift },
                  { id: "monthly", label: isRTL ? "شهري" : "Monthly", price: "49,000 ج.س/شهر", desc: isRTL ? "اشتراك شهري — إدارة كاملة" : "Monthly subscription — full management", color: "indigo", icon: Calendar },
                  { id: "yearly", label: isRTL ? "سنوي" : "Yearly", price: "350,000 ج.س/سنة", desc: isRTL ? "خصم 41% — أفضل قيمة" : "41% discount — best value", color: "emerald", icon: Clock },
                ].map(plan => (
                  <button key={plan.id} type="button" onClick={() => update("subscription_plan", plan.id)}
                    className={`relative p-3 rounded-xl border-2 text-right transition-all ${form.subscription_plan === plan.id ? `border-${plan.color}-500 bg-${plan.color}-50` : "border-stone-200 bg-white hover:border-stone-300"}`}>
                    {plan.id === "yearly" && <span className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{isRTL ? "خصم 41%" : "41% OFF"}</span>}
                    {plan.id === "free" && <span className="absolute -top-2 -left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{isRTL ? "شهر مجاني" : "1 MONTH FREE"}</span>}
                    <div className="flex items-center gap-2 mb-1">
                      <plan.icon size={14} className={`text-${plan.color}-600`} />
                      <span className="font-black text-sm text-stone-900">{plan.label}</span>
                    </div>
                    <div className="text-xs font-bold text-indigo-600 mt-0.5">{plan.price}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{plan.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Receipt Upload */}
            {form.subscription_plan !== "free" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><CreditCard size={12}/> {isRTL ? "إيصال الدفع (مطلوب)" : "Payment Receipt (required)"}</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => update("receipt_file", e.target.files[0])}
                  className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-bold file:cursor-pointer" />
                <p className="text-[10px] text-stone-400">{isRTL ? "ارفع صورة أو PDF للإيصال — بدون إيصال لن يُفعّل الاشتراك" : "Upload receipt image or PDF — subscription won't activate without receipt"}</p>
              </div>
            )}

            {form.subscription_plan === "free" && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
                <Gift size={14} className="shrink-0 mt-0.5"/> <span>{isRTL ? "الباقة التجريبية المجانية: شهر كامل من الاستخدام — بعد الموافقة من المؤسس، يُفعّل حسابك مجاناً لمدة 30 يوماً." : "Free trial plan: 1 full month of usage — after founder approval, your account is activated free for 30 days."}</span>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
              <Award size={14} className="shrink-0 mt-0.5"/> <span>{isRTL ? "بعد الموافقة من إدارة المنصة، تحصل على: ① اسم مستخدم وكلمة مرور ② إدارة طلابك وتتبع تقدمهم ③ إنشاء واجبات وامتحانات ④ حصص مباشرة وفيديوهات يوتيوب ⑤ متابعة اشتراكات الطلاب" : "After platform approval, you get: ① Username & password ② Manage your students & track progress ③ Create assignments & exams ④ Live classes & YouTube videos ⑤ Student subscription management"}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => window.location.href = "/"} className="flex-1 h-11 rounded-xl border border-stone-200 bg-white font-bold text-sm hover:bg-stone-50">
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={loading} className="flex-[2] h-11 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (isRTL ? "جاري الإرسال..." : "Sending...") : (<><UserPlus size={16} />{isRTL ? "إرسال طلب التسجيل" : "Submit Registration"}</>)}
              </button>
            </div>
          </form>
        </Card>
        <p className="text-center text-xs text-stone-400 mt-4">{isRTL ? "ستتم مراجعة الطلب خلال 24 ساعة — بيانات الدخول ترسل عبر الواتساب أو البريد الإلكتروني" : "Request reviewed within 24h — login credentials sent via WhatsApp or Email"}</p>
      </div>
    </div>
  );
}
