import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Building2, CheckCircle, ArrowLeft, MapPin, Mail, Phone, User, Crown, Zap, Shield, FileText } from "lucide-react";

const PLAN_OPTIONS = [
  { id: "starter", name: "Starter", price: 49, icon: Shield, descAr: "مدرسة صغيرة حتى 200 طالب", descEn: "Small school up to 200 students", color: "border-slate-300" },
  { id: "professional", name: "Professional", price: 99, icon: Zap, descAr: "الأكثر طلباً — كل الميزات", descEn: "Most popular — all features", color: "border-blue-300", popular: true },
  { id: "enterprise", name: "Enterprise", price: 199, icon: Crown, descAr: "شبكة مدارس بلا حدود", descEn: "Unlimited network", color: "border-violet-300" },
];

const BILLING_CYCLES = [
  { id: "monthly", nameAr: "شهري", nameEn: "Monthly", descAr: "دفع شهري", descEn: "Pay monthly" },
  { id: "yearly", nameAr: "سنوي (توفير 20%)", nameEn: "Yearly (Save 20%)", descAr: "دفع سنوي مع خصم", descEn: "Annual payment with discount" },
];

export default function PublicRegistration() {
  const { language } = useLanguage();
  const { appPublicSettings } = useAuth();
  const isRTL = language === "ar";
  const settings = appPublicSettings?.public_settings || {};
  const schoolName = isRTL ? (settings.school_name_ar || "EduTrack") : (settings.school_name_en || "EduTrack");

  const [form, setForm] = useState({
    school_name: "",
    director_name: "",
    email: "",
    phone: "",
    country: "السودان",
    plan: "",
    billing_cycle: "monthly",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.school_name.trim() || !form.director_name.trim() || !form.email.trim() || !form.phone.trim() || !form.plan) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة واختيار الباقة" : "Please fill all required fields and pick a plan");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(isRTL ? "صيغة البريد غير صحيحة" : "Invalid email format");
      return;
    }
    setLoading(true);
    try {
      await entities.RegistrationRequest.create({
        // حقول جديدة متوافقة مع لوحة المؤسس
        school_name: form.school_name.trim(),
        director_name: form.director_name.trim(),
        full_name: form.director_name.trim(), // توافق خلفي
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: form.country.trim() || "السودان",
        plan: form.plan,
        billing_cycle: form.billing_cycle,
        role_requested: form.plan, // توافق خلفي مع الجدول القديم
        notes: form.notes.trim() || null,
        status: "pending",
      });
      setSuccess(true);
      toast.success(isRTL ? "تم إرسال طلب التسجيل بنجاح" : "Registration request sent");
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
              {isRTL ? "شكراً لتسجيل مدرستكم! تم إرسال طلبكم إلى مالك المنصة وسيتم مراجعته قريباً." : "Thanks for registering your school! Your request has been sent to the platform owner."}
            </p>
            <p className="text-xs text-stone-400 bg-stone-50 rounded-xl p-3 mb-6">
              {isRTL ? "ستظهر مدرستكم في لوحة تحكم المؤسس وسيتم تفعيل اشتراككم بعد الموافقة. سيتواصل معكم فريق EduTrack عبر البريد والهاتف." : "Your school will appear in the founder dashboard and will be activated after approval. EduTrack will contact you by email/phone."}
            </p>
            <button onClick={() => window.location.href = "/gateway"} className="w-full h-11 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black flex items-center justify-center gap-2">
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
            <Building2 size={14} className="text-blue-600"/> {schoolName} — {isRTL ? "تسجيل مدرسة جديدة" : "Register your school"}
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-3">{isRTL ? "تسجيل مدرسة جديدة" : "Register a new school"}</h1>
          <p className="text-sm text-stone-500 mt-1">{isRTL ? "املأ بيانات مدرستك واختر الباقة — يصل الطلب مباشرة إلى لوحة تحكم المؤسس للموافقة" : "Fill your school data and pick a plan — request goes directly to founder dashboard for approval"}</p>
        </div>

        <Card className="p-6 md:p-8 rounded-[28px] border-none shadow-lg bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Building2 size={12}/> {isRTL ? "اسم المدرسة *" : "School name *"}</label>
                <Input value={form.school_name} onChange={e => update("school_name", e.target.value)} placeholder={isRTL ? "مثال: مدارس النور الأهلية" : "e.g. Al-Noor Private Schools"} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><User size={12}/> {isRTL ? "اسم المسؤول *" : "Director name *"}</label>
                <Input value={form.director_name} onChange={e => update("director_name", e.target.value)} placeholder={isRTL ? "الاسم الكامل للمسؤول" : "Full name"} className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><MapPin size={12}/> {isRTL ? "البلد" : "Country"}</label>
                <Input value={form.country} onChange={e => update("country", e.target.value)} placeholder="السودان" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Mail size={12}/> {isRTL ? "البريد الإلكتروني *" : "Email *"}</label>
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="school@email.com" className="h-11 rounded-xl" required dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><Phone size={12}/> {isRTL ? "رقم الهاتف *" : "Phone *"}</label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder={isRTL ? "مع رمز البلد" : "With country code"} className="h-11 rounded-xl" dir="ltr" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "اختر الباقة المطلوبة *" : "Choose plan *"}</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLAN_OPTIONS.map(opt => {
                  const active = form.plan === opt.id;
                  return (
                    <button key={opt.id} type="button" onClick={() => update("plan", opt.id)}
                      className={`relative p-4 rounded-2xl border-2 text-center transition-all ${active ? "border-stone-900 bg-stone-900 text-white shadow-lg" : "border-stone-200 bg-stone-50 hover:bg-white text-stone-700"} ${opt.popular && !active ? opt.color : ""}`}>
                      {opt.popular && <span className={`absolute -top-2 ${isRTL ? "left-3" : "right-3"} bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full`}>{isRTL ? "الأكثر طلباً" : "Popular"}</span>}
                      <opt.icon size={20} className={`mx-auto mb-1.5 ${active ? "text-white" : "text-stone-600"}`} />
                      <div className="text-sm font-black">{opt.name}</div>
                      <div className="text-lg font-extrabold">${opt.price}<span className="text-xs font-normal opacity-70">/شهر</span></div>
                      <div className={`text-[11px] mt-1 ${active ? "text-white/70" : "text-stone-400"}`}>{isRTL ? opt.descAr : opt.descEn}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "دورة الفوترة" : "Billing cycle"}</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BILLING_CYCLES.map(opt => {
                  const active = form.billing_cycle === opt.id;
                  return (
                    <button key={opt.id} type="button" onClick={() => update("billing_cycle", opt.id)}
                      className={`relative p-4 rounded-2xl border-2 text-center transition-all ${active ? "border-stone-900 bg-stone-900 text-white shadow-lg" : "border-stone-200 bg-stone-50 hover:bg-white text-stone-700"}`}>
                      <div className="text-sm font-black">{isRTL ? opt.nameAr : opt.nameEn}</div>
                      <div className={`text-[11px] mt-1 ${active ? "text-white/70" : "text-stone-400"}`}>{isRTL ? opt.descAr : opt.descEn}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><FileText size={12}/> {isRTL ? "ملاحظات" : "Notes"}</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder={isRTL ? "أي معلومات إضافية عن المدرسة..." : "Any extra info..."} rows={2} className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 flex gap-2">
              <Shield size={14} className="shrink-0 mt-0.5"/> <span>{isRTL ? "بعد الإرسال، يظهر طلبك فوراً في لوحة تحكم المؤسس (طلبات التسجيل) مع زر قبول/رفض/تعليق. عند القبول يُنشأ حساب مدرستك تلقائياً." : "After submit, your request appears instantly in founder dashboard (Registration Requests) with Accept/Reject/Hold. On accept, your school account is auto-created."}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => window.location.href = "/gateway"} className="flex-1 h-11 rounded-xl border border-stone-200 bg-white font-bold text-sm hover:bg-stone-50">
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={loading} className="flex-[2] h-11 rounded-xl bg-stone-900 text-white font-black text-sm hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (isRTL ? "جاري الإرسال..." : "Sending...") : (<><Building2 size={16} />{isRTL ? "إرسال طلب التسجيل" : "Submit Registration"}</>)}
              </button>
            </div>
          </form>
        </Card>
        <p className="text-center text-xs text-stone-400 mt-4">{isRTL ? "جميع الحقول تحفظ وترتبط مباشرة بلوحة المؤسس" : "All fields are saved and linked directly to founder panel"}</p>
      </div>
    </div>
  );
}
