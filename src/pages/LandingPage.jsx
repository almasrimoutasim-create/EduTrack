import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "sonner";

import {
  GraduationCap, ShieldCheck, Users, Wallet, ClipboardCheck, BarChart3,
  Award, BookOpen, Lock, MessageCircle, Phone, CheckCircle2, Star, Sparkles, X, UserPlus, Mail, Video,
  LogIn, UserCheck, KeyRound, Eye, EyeOff, CreditCard, Upload, Calendar, Clock, Gift
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const WHATSAPP_NUMBER = "249969814088";
const WHATSAPP_MSG = encodeURIComponent("مرحباً، أرغب في طلب نسخة من منصة EduTrack لإدارة مدرستنا. يرجى تزويدي بالتفاصيل والأسعار.");

export default function LandingPage() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [teacherLoginOpen, setTeacherLoginOpen] = useState(false);
  const [studentLoginOpen, setStudentLoginOpen] = useState(false);
  const [teacherLoginForm, setTeacherLoginForm] = useState({ username: "", password: "" });
  const [studentLoginForm, setStudentLoginForm] = useState({ email: "", password: "" });
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [teacherLoginLoading, setTeacherLoginLoading] = useState(false);
  const [studentLoginLoading, setStudentLoginLoading] = useState(false);
  const navigate = useNavigate();

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    if (!teacherLoginForm.username.trim() || !teacherLoginForm.password.trim()) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    setTeacherLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: teacherLoginForm.username.trim(), password: teacherLoginForm.password, role: "teacher" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Portal session keys (same as AuthContext.login) so /teacher-panel recognizes the session
      const tu = data.user || {};
      localStorage.setItem("portal_role", tu.role || "teacher");
      localStorage.setItem("portal_user", JSON.stringify(tu));
      localStorage.setItem("portal_user_id", tu.id || "");
      localStorage.setItem("portal_user_name", tu.full_name || "");
      localStorage.setItem("portal_is_auth", "true");
      if (tu.school_id) localStorage.setItem("portal_school_id", tu.school_id);
      if (data.token) localStorage.setItem("portal_jwt_token", data.token);
      toast.success(isRTL ? "تم تسجيل الدخول بنجاح" : "Login successful");
      setTeacherLoginOpen(false);
      navigate("/teacher-panel");
    } catch (err) {
      toast.error(err.message || (isRTL ? "فشل تسجيل الدخول" : "Login failed"));
    } finally {
      setTeacherLoginLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!studentLoginForm.email.trim() || !studentLoginForm.password.trim()) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    setStudentLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: studentLoginForm.email.trim(), password: studentLoginForm.password, role: "student" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Portal session keys (same as AuthContext.login) so /student-panel recognizes the session
      const su = data.user || {};
      localStorage.setItem("portal_role", su.role || "student");
      localStorage.setItem("portal_user", JSON.stringify(su));
      localStorage.setItem("portal_user_id", su.id || "");
      localStorage.setItem("portal_user_name", su.full_name || "");
      localStorage.setItem("portal_is_auth", "true");
      if (su.school_id) localStorage.setItem("portal_school_id", su.school_id);
      if (data.token) localStorage.setItem("portal_jwt_token", data.token);
      toast.success(isRTL ? "تم تسجيل الدخول بنجاح" : "Login successful");
      setStudentLoginOpen(false);
      navigate("/student-panel");
    } catch (err) {
      toast.error(err.message || (isRTL ? "فشل تسجيل الدخول" : "Login failed"));
    } finally {
      setStudentLoginLoading(false);
    }
  };

  const features = [
    {
      icon: Award,
      title: isRTL ? "إدارة النتائج والشهادات السودانية" : "Sudanese Results & Certificates",
      desc: isRTL ? "كشف درجات أفقي وعمودي مطابق للمعايير السودانية، مع طباعة احترافية وختم وتقديرات." : "Landscape & portrait marksheets per Sudanese standards with professional print.",
      longDesc: isRTL ? "نظام متكامل لإدارة نتائج الطلاب وفق المعايير السودانية المعتمدة من وزارة التربية والتعليم. يدعم الكشف الأفقي البانورامي والشهادة العمودية الرسمية مع تفقيط الدرجات، حساب النسبة والتقدير تلقائياً، وطباعة احترافية بجودة الوزارة تشمل الختم والشعار والحدود المزخرفة." : "Complete results management per Sudanese Ministry standards. Supports landscape marksheet and portrait certificate with tafqeet, auto percentage and grade, and ministry-grade print.",
      points: isRTL ? ["كشف أفقي وعمودي بأبعاد A4 دقيقة", "تفقيط تلقائي وحساب النسبة والتقدير", "طباعة بجودة وزارية مع شعار وختم", "أرشيف نتائج وبحث سريع"] : ["Landscape & portrait A4 precise", "Auto tafqeet and grade", "Ministry-grade print with logo & stamp", "Archive and quick search"],
      images: ["https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop"],
    },
    {
      icon: Users,
      title: isRTL ? "شؤون الطلاب" : "Student Affairs",
      desc: isRTL ? "تسجيل، ملفات أكاديمية، أرشيف، وإدارة شاملة لبيانات الطلاب." : "Enrollment, academic files, archive and full student data management.",
      longDesc: isRTL ? "إدارة شاملة لدورة حياة الطالب من التسجيل وحتى الأرشفة. يشمل تسجيل الطلاب الجدد، إدارة الملفات الأكاديمية، الأرشيف الرقمي، البحث المتقدم، وربط الطلاب بالصفوف والشعب مع إمكانية الاستيراد الجماعي." : "Full student lifecycle from enrollment to archive. Includes new registration, academic files, digital archive and advanced search.",
      points: isRTL ? ["تسجيل فردي وجماعي", "ملفات أكاديمية منظمة", "أرشيف رقمي آمن", "بحث وفلترة متقدمة"] : ["Individual & bulk enrollment", "Organized academic files", "Secure digital archive", "Advanced search"],
      images: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop"],
    },
    {
      icon: Wallet,
      title: isRTL ? "الرسوم المالية" : "Fees & Finance",
      desc: isRTL ? "هيكلة رسوم، محافظ، مدفوعات، إيرادات ومصروفات بتقارير دقيقة." : "Fee structures, wallets, payments and accurate financial reports.",
      longDesc: isRTL ? "نظام مالي متكامل لإدارة رسوم الطلاب، المحافظ الإلكترونية، المدفوعات والإيصالات، مع متابعة الإيرادات والمصروفات وتقارير مالية دقيقة تساعد الإدارة في اتخاذ القرار." : "Integrated financial system for fees, wallets, payments and receipts with revenue/expense tracking.",
      points: isRTL ? ["هيكلة رسوم مرنة", "محافظ طلاب إلكترونية", "إيصالات ومدفوعات فورية", "تقارير إيرادات ومصروفات"] : ["Flexible fee structures", "Student e-wallets", "Instant receipts & payments", "Revenue/expense reports"],
      images: ["https://images.unsplash.com/photo-1554224155-6726b3196a58?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop"],
    },
    {
      icon: ClipboardCheck,
      title: isRTL ? "الحضور والغياب" : "Attendance",
      desc: isRTL ? "تتبع يومي وأسبوعي للحضور مع سجلات وتحليلات." : "Daily & weekly attendance tracking with logs and analytics.",
      longDesc: isRTL ? "متابعة دقيقة لحضور الطلاب والمعلمين يومياً وأسبوعياً مع سجلات مفصلة، تنبيهات للغياب المتكرر، وتحليلات تساعد في تحسين الانضباط ومتابعة أولياء الأمور." : "Precise daily & weekly attendance for students and teachers with logs and analytics.",
      points: isRTL ? ["تسجيل يومي وأسبوعي", "تنبيهات غياب", "تقارير حضور مفصلة", "ربط مع أولياء الأمور"] : ["Daily & weekly logs", "Absence alerts", "Detailed reports", "Parent linkage"],
      images: ["https://images.unsplash.com/photo-1509062522246-3755977927d?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?q=80&w=800&auto=format&fit=crop"],
    },
    {
      icon: ShieldCheck,
      title: isRTL ? "الأمان وسجلات التدقيق" : "Security & Audit",
      desc: isRTL ? "صلاحيات دقيقة، سجل تدقيق كامل، وتشفير لحماية البيانات." : "Fine-grained permissions, full audit log and data encryption.",
      longDesc: isRTL ? "حماية متكاملة للبيانات مع صلاحيات دقيقة لكل دور (مدير، معلم، طالب...)، سجل تدقيق يوثق كل عملية، وتشفير كامل للبيانات الحساسة لضمان الخصوصية والامتثال." : "Complete data protection with role permissions, full audit log and encryption.",
      points: isRTL ? ["صلاحيات لكل دور", "سجل تدقيق شامل", "تشفير البيانات", "نسخ احتياطي آمن"] : ["Role-based permissions", "Full audit log", "Data encryption", "Secure backup"],
      images: ["https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop"],
    },
    {
      icon: BarChart3,
      title: isRTL ? "التقارير والتحليلات" : "Reports & Analytics",
      desc: isRTL ? "لوحات متابعة، تقارير مالية وأكاديمية لدعم القرار." : "Dashboards and academic/financial reports for decision making.",
      longDesc: isRTL ? "لوحات تحكم تفاعلية وتقارير ذكية تعرض الأداء الأكاديمي والمالي في رسوم بيانية واضحة، مع إمكانية التصدير والمشاركة لدعم قرارات الإدارة بسرعة ودقة." : "Interactive dashboards and smart reports with clear charts for academic and financial performance.",
      points: isRTL ? ["لوحات تفاعلية", "رسوم بيانية واضحة", "تصدير PDF/Excel", "تحليلات تنبؤية"] : ["Interactive dashboards", "Clear charts", "PDF/Excel export", "Predictive analytics"],
      images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900" dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md">
              <GraduationCap size={20} />
            </div>
            <span className="font-black text-lg tracking-tight">Edu<span className="text-emerald-600">Track</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
            <a href="#features" className="text-stone-600 hover:text-stone-900">{isRTL ? "مميزات المنصة" : "Features"}</a>
            <a href="#plans" className="text-stone-600 hover:text-stone-900">{isRTL ? "الباقات والأسعار" : "Pricing"}</a>
            <a href="#contact" className="text-stone-600 hover:text-stone-900">{isRTL ? "تواصل معنا" : "Contact"}</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex h-9 px-4 rounded-xl bg-stone-800 text-white text-xs font-black hover:bg-stone-900 items-center gap-1.5 shadow-sm">
              <MessageCircle size={14} />{isRTL ? "استفسار واتساب" : "WhatsApp"}
            </a>
            <Link to="/register" className="h-9 px-5 rounded-xl bg-stone-900 text-white text-xs font-black hover:bg-black inline-flex items-center gap-1.5 shadow-md">
              <Sparkles size={13} className="text-amber-400" />
              {isRTL ? "طلب نسخة تجريبية" : "Request Demo"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50" />
        <div className="absolute -top-24 -right-24 h-96 w-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-sky-100/40 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-white border border-stone-100 rounded-full px-3 py-1.5 shadow-sm text-xs font-bold text-stone-600">
                <Sparkles size={14} className="text-amber-500" />{isRTL ? "نظام شامل لإدارة المدارس الذكية" : "All-in-one Smart School Management"}
              </div>
              <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">
                {isRTL ? "إدارة مدرستك" : "Manage your school"} <span className="text-emerald-600">{isRTL ? "بذكاء" : "smartly"}</span><br />
                {isRTL ? "من مكان واحد" : "from one place"}
              </h1>
              <p className="mt-3 text-stone-600 leading-relaxed text-sm md:text-base">
                {isRTL ? "منصة EduTrack تغطي النتائج والشهادات السودانية، شؤون الطلاب، الرسوم، الحضور، والمزيد — بواجهة عربية احترافية وطباعة بجودة الوزارة." : "EduTrack covers results & Sudanese certificates, students, fees, attendance and more — with Arabic UI and ministry-grade print."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register" className="h-11 px-6 rounded-xl bg-stone-900 text-white font-black text-sm hover:bg-black inline-flex items-center gap-2 shadow-lg">
                  <Sparkles size={16} />{isRTL ? "طلب نسخة تجريبية" : "Request Demo"}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-stone-500">
                <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" />{isRTL ? "دعم فني مخصص" : "Local support"}</span>
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-sky-500" />{isRTL ? "آمن ومشفّر" : "Secure"}</span>
              </div>
            </motion.div>
            {(() => {
              const slides = [
                { img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop", caption: isRTL ? "أثناء الدرس المباشر" : "During live lesson" },
                { img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop", caption: isRTL ? "العمل الجماعي في الفصل" : "Group work in class" },
                { img: "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=800&auto=format&fit=crop", caption: isRTL ? "أثناء أداء الواجب" : "Doing homework" },
                { img: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?q=80&w=800&auto=format&fit=crop", caption: isRTL ? "المراجعة والتحضير" : "Review & preparation" },
              ];
              const [idx, setIdx] = useState(0);
              useEffect(() => {
                const id = setInterval(() => setIdx((p) => (p + 1) % slides.length), 2800);
                return () => clearInterval(id);
              }, []);
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
                  <div className="bg-white rounded-[28px] shadow-2xl border border-stone-100 overflow-hidden">
                    <div className="relative h-64 md:h-72 overflow-hidden bg-stone-100">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={idx}
                          src={slides[idx].img}
                          alt={slides[idx].caption}
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop"; }}
                          initial={{ opacity: 0, scale: 1.04 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.02 }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="bg-white/90 backdrop-blur text-stone-900 text-xs font-black px-3 py-1.5 rounded-full shadow">{slides[idx].caption}</span>
                        <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">{idx + 1} / {slides.length}</span>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-center gap-1.5 bg-white">
                      {slides.map((_, i) => (
                        <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-stone-900" : "w-1.5 bg-stone-200"}`} aria-label={`slide ${i + 1}`} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black">{isRTL ? "مميزات المنصة" : "Platform Features"}</h2>
          <p className="text-stone-500 mt-2 text-sm">{isRTL ? "كل ما تحتاجه المدرسة السودانية في مكان واحد" : "Everything a Sudanese school needs in one place"}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {features.map((f) => (
            <button key={f.title} onClick={() => setSelectedFeature(f)} className="text-right bg-white rounded-2xl border border-stone-100 p-5 shadow-sm hover:shadow-lg hover:border-stone-200 hover:-translate-y-1 transition-all text-start w-full group">
              <div className="h-10 w-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <f.icon size={18} />
              </div>
              <h3 className="font-black text-sm">{f.title}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{f.desc}</p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">{isRTL ? "اعرف المزيد" : "Learn more"} →</span>
            </button>
          ))}
        </div>

        <Dialog open={!!selectedFeature} onOpenChange={(o) => !o && setSelectedFeature(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[24px] p-0" dir={isRTL ? "rtl" : "ltr"}>
            {selectedFeature && (
              <div>
                <div className="p-6 pb-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-lg font-black">
                      <span className="h-10 w-10 rounded-xl bg-stone-900 text-white flex items-center justify-center"><selectedFeature.icon size={18} /></span>
                      {selectedFeature.title}
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-stone-600 leading-relaxed mt-3">{selectedFeature.longDesc}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-6">
                  {selectedFeature.images?.map((src, i) => (
                    <img key={i} src={src} alt={selectedFeature.title} className="h-36 w-full object-cover rounded-2xl border border-stone-100" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop"; }} />
                  ))}
                </div>
                <div className="px-6 pb-2">
                  <ul className="space-y-2">
                    {selectedFeature.points?.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-stone-700 font-medium">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-4 flex gap-2">
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-1.5">
                    <MessageCircle size={16} />{isRTL ? "تواصل للاشتراك" : "Contact Sales"}
                  </a>
                  <button onClick={() => setSelectedFeature(null)} className="h-10 px-5 rounded-xl border border-stone-200 bg-white font-bold text-sm hover:bg-stone-50">{isRTL ? "إغلاق" : "Close"}</button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* School Registration CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-stone-800 via-stone-900 to-black rounded-[28px] p-6 md:p-8 text-white shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-bold">
                <ShieldCheck size={16} /> {isRTL ? "بوابة المدرسة" : "School Portal"}
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight">
                {isRTL ? "أدر مدرستك بالكامل — نتائج، رسوم، حضور، وتقارير" : "Manage your entire school — results, fees, attendance & reports"}
              </h3>
              <p className="mt-2 text-white/90 leading-relaxed">
                {isRTL ? "لوحة تحكم شاملة للمديرين: إدارة الطلاب والمعلمين، النتائج والشهادات السودانية، الرسوم المالية، الحضور والغياب، والتقارير الذكية. كل ما تحتاجه لإدارة مدرستك في مكان واحد." : "Comprehensive admin dashboard: manage students & teachers, Sudanese results & certificates, financial fees, attendance, and smart reports. Everything you need in one place."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/register" className="h-11 px-6 rounded-xl bg-white text-stone-900 font-black text-sm hover:bg-white/90 inline-flex items-center gap-2 shadow-lg">
                  <Sparkles size={16} /> {isRTL ? "طلب نسخة تجريبية" : "Request Demo"}
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="h-11 px-6 rounded-xl bg-white/20 border border-white/30 text-white font-black text-sm hover:bg-white/30 inline-flex items-center gap-2">
                  <MessageCircle size={16} /> {isRTL ? "استفسار عبر الواتساب" : "WhatsApp Inquiry"}
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur rounded-[24px] p-2 border border-white/20">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Award, label: isRTL ? "النتائج والشهادات" : "Results & Certificates" },
                    { icon: Users, label: isRTL ? "إدارة الطلاب والمعلمين" : "Students & Teachers" },
                    { icon: Wallet, label: isRTL ? "الرسوم المالية" : "Financial Fees" },
                    { icon: ClipboardCheck, label: isRTL ? "الحضور والغياب" : "Attendance" },
                    { icon: BarChart3, label: isRTL ? "التقارير الذكية" : "Smart Reports" },
                    { icon: Lock, label: isRTL ? "أمان وصلاحيات" : "Security & Roles" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center mx-auto mb-2">
                        <item.icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-white/90">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Teacher Registration CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-[28px] p-6 md:p-8 text-white shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-bold">
                <GraduationCap size={16} /> {isRTL ? "بوابة المعلم المستقل" : "Independent Teacher Portal"}
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight">
                {isRTL ? "ادَرْ فصلك بذكاء — وواجبات، امتحانات، وبث مباشر" : "Manage your class smartly — assignments, exams & live classes"}
              </h3>
              <p className="mt-2 text-white/90 leading-relaxed">
                {isRTL ? "أي معلم يمكنه التسجيل لإدارة طلابه وواجباتهم وامتحاناتهم بشكل مستقل. أنشئ حصص مباشرة، ارفع فيديوهات يوتيوب التعليمية، وتابع تقدم كل طالب. مجاني للمعلمين الأفراد." : "Any teacher can register to manage students, assignments, and exams independently. Create live classes, upload YouTube teaching videos, and track each student's progress. Free for individual teachers."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => setTeacherLoginOpen(true)} className="h-11 px-6 rounded-xl bg-white text-indigo-700 font-black text-sm hover:bg-white/90 inline-flex items-center gap-2 shadow-lg">
                  <LogIn size={16} /> {isRTL ? "دخول بوابة المعلم" : "Teacher Login"}
                </button>
                <Link to="/teacher-register" className="h-11 px-6 rounded-xl bg-white/20 border border-white/30 text-white font-black text-sm hover:bg-white/30 inline-flex items-center gap-2">
                  <UserPlus size={16} /> {isRTL ? "تسجيل جديد كمعلم" : "Register as Teacher"}
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("مرحباً، أريد التسجيل كمعلم في منصة EduTrack.")}`} target="_blank" rel="noopener noreferrer" className="h-11 px-6 rounded-xl bg-white/20 border border-white/30 text-white font-black text-sm hover:bg-white/30 inline-flex items-center gap-2">
                  <MessageCircle size={16} /> {isRTL ? "استفسار عبر الواتساب" : "WhatsApp"}
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur rounded-[24px] p-2 border border-white/20">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Users, label: isRTL ? "إدارة طلابي" : "My Students" },
                    { icon: ClipboardCheck, label: isRTL ? "واجبات ذكية" : "Smart Assignments" },
                    { icon: BarChart3, label: isRTL ? "امتحانات وتقييم" : "Exams & Grading" },
                    { icon: Video, label: isRTL ? "حصص مباشرة" : "Live Classes" },
                    { icon: Star, label: isRTL ? "فيديوهات يوتيوب" : "YouTube Videos" },
                    { icon: ShieldCheck, label: isRTL ? "مستقل وخالص" : "Fully Independent" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center mx-auto mb-2">
                        <item.icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-white/90">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pricing badge */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center border border-white/30">
                  <Gift size={16} className="mx-auto mb-1 text-white" />
                  <div className="text-xs font-black text-white">{isRTL ? "شهر مجاني" : "Free Month"}</div>
                  <div className="text-[10px] text-white/70">{isRTL ? "تجربة بدون دفع" : "No payment"}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center border border-white/30">
                  <CreditCard size={16} className="mx-auto mb-1 text-white" />
                  <div className="text-xs font-black text-white">49,000 ج.س</div>
                  <div className="text-[10px] text-white/70">{isRTL ? "شهرياً" : "Monthly"}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center border border-white/30 relative">
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">41% OFF</span>
                  <Award size={16} className="mx-auto mb-1 text-white" />
                  <div className="text-xs font-black text-white">350,000 ج.س</div>
                  <div className="text-[10px] text-white/70">{isRTL ? "سنوياً" : "Yearly"}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Student Registration CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 rounded-[28px] p-6 md:p-8 text-white shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-bold">
                <UserPlus size={16} /> {isRTL ? "بوابة الطالب المستقل" : "Independent Student Portal"}
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight">
                {isRTL ? "سجل طالبك الآن — وصول فوري للمنهج السوداني" : "Register your student — Instant access to Sudanese curriculum"}
              </h3>
              <p className="mt-2 text-white/90 leading-relaxed">
                {isRTL ? "أي طالب يمكنه التسجيل مجاناً للوصول إلى كتب المنهج السوداني المعتمدة، وحل الواجبات، ومتابعة الدروس. للاشتراك مع معلم خاص والدروس المباشرة، يرسل طلب اشتراك من داخل البوابة." : "Any student can register free for Sudanese curriculum books, assignments, and lessons. To join a private teacher for live classes, send a subscription request from within the portal."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => setStudentLoginOpen(true)} className="h-11 px-6 rounded-xl bg-white text-emerald-700 font-black text-sm hover:bg-white/90 inline-flex items-center gap-2 shadow-lg">
                  <LogIn size={16} /> {isRTL ? "دخول بوابة الطالب" : "Student Login"}
                </button>
                <Link to="/student-register" className="h-11 px-6 rounded-xl bg-white/20 border border-white/30 text-white font-black text-sm hover:bg-white/30 inline-flex items-center gap-2">
                  <UserPlus size={16} /> {isRTL ? "تسجيل طالب جديد (مجاني)" : "Register Student (Free)"}
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("مرحباً، أريد تسجيل طالب في منصة EduTrack. كيف أبدأ؟")}`} target="_blank" rel="noopener noreferrer" className="h-11 px-6 rounded-xl bg-white/20 border border-white/30 text-white font-black text-sm hover:bg-white/30 inline-flex items-center gap-2">
                  <MessageCircle size={16} /> {isRTL ? "استفسار عبر الواتساب" : "WhatsApp"}
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur rounded-[24px] p-2 border border-white/20">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: BookOpen, label: isRTL ? "كتب المنهج" : "Curriculum Books" },
                    { icon: ClipboardCheck, label: isRTL ? "واجبات وامتحانات" : "Assignments & Exams" },
                    { icon: Star, label: isRTL ? "شهادات معتمدة" : "Certified Certificates" },
                    { icon: Users, label: isRTL ? "تواصل مع معلمين" : "Connect Teachers" },
                    { icon: Award, label: isRTL ? "متابعة تقديرات" : "Track Grades" },
                    { icon: ShieldCheck, label: isRTL ? "آمن ومحمي" : "Secure & Safe" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2">
                        <item.icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-white/90">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Free registration badge */}
              <div className="mt-4 bg-white/20 backdrop-blur rounded-xl p-4 text-center border border-white/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gift size={18} className="text-white" />
                  <span className="text-sm font-black text-white">{isRTL ? "التسجيل مجاني بالكامل" : "Registration is 100% Free"}</span>
                </div>
                <p className="text-xs text-white/70">{isRTL ? "وصول فوري لكتب المنهج السوداني المعتمدة وحلول الواجبات" : "Instant access to Sudanese curriculum books and homework solutions"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* WhatsApp CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-10">
        <div className="bg-stone-900 rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div>
            <h3 className="font-black text-lg">{isRTL ? "تواصل سريع عبر واتساب" : "Quick WhatsApp Contact"}</h3>
            <p className="text-white/70 text-sm mt-1">{isRTL ? "رد فوري من فريق EduTrack على الرقم الموحد" : "Instant reply from EduTrack team"}</p>
          </div>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="h-11 px-6 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 inline-flex items-center gap-2 shadow-lg shrink-0">
            <MessageCircle size={16} />{isRTL ? "فتح واتساب" : "Open WhatsApp"} — {WHATSAPP_NUMBER}
          </a>
        </div>
      </section>

      {/* Footer — احترافي */}
      <footer className="bg-stone-900 text-stone-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-9 w-9 rounded-xl bg-white text-stone-900 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <span className="font-black text-white">EduTrack</span>
              </div>
              <p className="text-sm leading-relaxed text-stone-400">
                {isRTL ? "منصة سودانية ذكية لإدارة المدارس — نتائج، رسوم، حضور، ومتابعة شاملة بواجهة عربية وطباعة وزارية." : "Smart Sudanese school management — results, fees, attendance and full follow-up with Arabic UI and ministry-grade print."}
              </p>
            </div>
            <div>
              <h4 className="font-black text-white text-sm mb-3">{isRTL ? "روابط سريعة" : "Quick Links"}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white text-stone-400">{isRTL ? "مميزات المنصة" : "Features"}</a></li>
                <li><a href="#plans" className="hover:text-white text-stone-400">{isRTL ? "الباقات والأسعار" : "Pricing"}</a></li>
                <li><Link to="/register" className="hover:text-white text-stone-400">{isRTL ? "طلب اشتراك مدرسة" : "Register School"}</Link></li>
                <li><a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="hover:text-white text-stone-400">{isRTL ? "تواصل مباشر واتساب" : "WhatsApp"}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white text-sm mb-3">{isRTL ? "تواصل معنا" : "Contact Us"}</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5">
                  <Phone size={14} className="text-emerald-400 shrink-0" />
                  <a href={`tel:+${WHATSAPP_NUMBER}`} className="hover:text-white text-stone-300 font-bold" dir="ltr">+{WHATSAPP_NUMBER}</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <MessageCircle size={14} className="text-emerald-400 shrink-0" />
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="hover:text-white text-stone-300">WhatsApp Business</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-emerald-400 shrink-0">@</span>
                  <a href="mailto:etrack249@gmail.com" className="hover:text-white text-stone-300">etrack249@gmail.com</a>
                </li>
                <li className="text-stone-500 text-xs mt-1">{isRTL ? "الخرطوم، السودان — دعم فني" : "Khartoum, Sudan — Local support"}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white text-sm mb-3">{isRTL ? "تابعنا" : "Follow Us"}</h4>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com/share/1ErDcNrRYU/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white text-white/80 hover:text-stone-900 flex items-center justify-center transition-colors">
                  <span className="font-black text-sm">f</span>
                </a>
                <a href="https://www.tiktok.com/@edutrack66?_r=1&_t=ZS-99AToO3Z4r9" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white text-white/80 hover:text-stone-900 flex items-center justify-center transition-colors">
                  <span className="font-black text-xs">♪</span>
                </a>
                <a href="https://www.youtube.com/@EduTrack-o9e" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white text-white/80 hover:text-stone-900 flex items-center justify-center transition-colors">
                  <span className="font-black text-[10px]">▶</span>
                </a>
                <a href="mailto:etrack249@gmail.com" aria-label="Email" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white text-white/80 hover:text-stone-900 flex items-center justify-center transition-colors">
                  <span className="font-black text-xs">@</span>
                </a>
              </div>
              <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                {isRTL ? "تابع آخر التحديثات والعروض على صفحاتنا الرسمية." : "Follow our official pages for updates and offers."}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <div className="font-bold">© {new Date().getFullYear()} EduTrack — {isRTL ? "جميع الحقوق محفوظة" : "All rights reserved"}</div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{isRTL ? "آمن ومشفّر" : "Secure & Encrypted"}</span>
              <span className="hidden sm:inline">•</span>
              <span>V 2.0.4 — EduTrack Advanced Engine</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-4 left-4 z-50 h-12 w-12 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center hover:bg-emerald-600">
        <MessageCircle size={20} />
      </a>

      {/* Teacher Login Modal */}
      <Dialog open={teacherLoginOpen} onOpenChange={setTeacherLoginOpen}>
        <DialogContent className="max-w-sm rounded-[24px] p-0 overflow-hidden" dir="rtl">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-lg font-black">دخول بوابة المعلم</h3>
            <p className="text-white/80 text-xs mt-1">سجّل دخولك لإدارة طلابك وواجباتهم</p>
          </div>
          <form onSubmit={handleTeacherLogin} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><UserCheck size={12} /> اسم المستخدم</label>
              <div className="relative">
                <Input
                  value={teacherLoginForm.username}
                  onChange={e => setTeacherLoginForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="أدخل اسم المستخدم"
                  className="h-11 rounded-xl pr-10"
                  dir="ltr"
                />
                <UserCheck size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><KeyRound size={12} /> كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showTeacherPass ? "text" : "password"}
                  value={teacherLoginForm.password}
                  onChange={e => setTeacherLoginForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="أدخل كلمة المرور"
                  className="h-11 rounded-xl pr-10 pl-10"
                  dir="ltr"
                />
                <KeyRound size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <button type="button" onClick={() => setShowTeacherPass(!showTeacherPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showTeacherPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={teacherLoginLoading} className="w-full h-11 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {teacherLoginLoading ? "جاري الدخول..." : <><LogIn size={16} /> تسجيل الدخول</>}
            </button>
            <div className="text-center text-xs text-stone-500">
              ليس لديك حساب؟{" "}
              <Link to="/teacher-register" onClick={() => setTeacherLoginOpen(false)} className="text-indigo-600 font-bold hover:underline">سجّل الآن</Link>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Student Login Modal */}
      <Dialog open={studentLoginOpen} onOpenChange={setStudentLoginOpen}>
        <DialogContent className="max-w-sm rounded-[24px] p-0 overflow-hidden" dir="rtl">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-lg font-black">دخول بوابة الطالب</h3>
            <p className="text-white/80 text-xs mt-1">سجّل دخولك لعرض واجباتك ودرجاتك</p>
          </div>
          <form onSubmit={handleStudentLogin} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><UserCheck size={12} /> البريد الإلكتروني أو اسم المستخدم</label>
              <div className="relative">
                <Input
                  type="text"
                  value={studentLoginForm.email}
                  onChange={e => setStudentLoginForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="student@email.com أو اسم المستخدم"
                  className="h-11 rounded-xl pr-10"
                  dir="ltr"
                />
                <UserCheck size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 flex items-center gap-1"><KeyRound size={12} /> كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showStudentPass ? "text" : "password"}
                  value={studentLoginForm.password}
                  onChange={e => setStudentLoginForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="أدخل كلمة المرور"
                  className="h-11 rounded-xl pr-10 pl-10"
                  dir="ltr"
                />
                <KeyRound size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <button type="button" onClick={() => setShowStudentPass(!showStudentPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showStudentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={studentLoginLoading} className="w-full h-11 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {studentLoginLoading ? "جاري الدخول..." : <><LogIn size={16} /> تسجيل الدخول</>}
            </button>
            <div className="text-center text-xs text-stone-500">
              ليس لديك حساب؟{" "}
              <Link to="/student-register" onClick={() => setStudentLoginOpen(false)} className="text-emerald-600 font-bold hover:underline">سجّل الآن مجاناً</Link>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
