import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  User, 
  GraduationCap, 
  Users, 
  Bus, 
  ShieldCheck, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  LifeBuoy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white/50 backdrop-blur-md text-stone-800 hover:bg-stone-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export default function RoleLogin() {
  const { login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isRTL = language === "ar";

  // Popup state
  const [selectedRole, setSelectedRole] = useState(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const roles = [
    { id: "admin", icon: Settings, label: { ar: "مدير النظام", en: "System Admin" }, color: "bg-stone-900 text-white", desc: { ar: "لوحة التحكم الرئيسية والإعدادات العامة.", en: "Main dashboard and system settings." }, path: "/admin-dashboard" },
    { id: "teacher", icon: GraduationCap, label: { ar: "بوابة المعلم", en: "Teacher Portal" }, color: "bg-indigo-600 text-white", desc: { ar: "إدارة الفصول والحضور والدرجات.", en: "Manage classes, attendance, and grades." }, path: "/teacher-portal" },
    { id: "student", icon: User, label: { ar: "بوابة الطالب", en: "Student Portal" }, color: "bg-teal-600 text-white", desc: { ar: "الجدول الدراسي والنتائج والأنشطة.", en: "Schedule, results, and activities." }, path: "/student-portal" },
    { id: "parent", icon: Users, label: { ar: "بوابة ولي الأمر", en: "Parent Portal" }, color: "bg-rose-600 text-white", desc: { ar: "متابعة تقدم أبنائك الأكاديمي.", en: "Track your children's academic progress." }, path: "/parent-portal" },
    { id: "staff", icon: ShieldCheck, label: { ar: "بوابة الموظف", en: "Staff Portal" }, color: "bg-blue-600 text-white", desc: { ar: "الأنظمة المساندة والأقسام الإدارية.", en: "Support systems and departments." }, path: "/staff-portal" },
    { id: "support", icon: LifeBuoy, label: { ar: "الدعم الفني", en: "Technical Support" }, color: "bg-rose-500 text-white", desc: { ar: "حل المشكلات الفنية وتذاكر الدعم.", en: "Resolve technical issues and support tickets." }, path: "/staff-portal" }
  ];

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const openLoginPopup = (role) => {
    setSelectedRole(role);
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setErrorMsg("");
  };

  const closeLoginPopup = () => {
    setSelectedRole(null);
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setErrorMsg("");
    setLoading(false);
  };

  const getPlaceholder = (roleId) => {
    if (roleId === "student") return isRTL ? "أدخل البريد الإلكتروني أو الرقم الأكاديمي" : "Enter Student ID or Email";
    if (roleId === "teacher") return isRTL ? "أدخل البريد الإلكتروني أو الرقم الوظيفي" : "Enter Teacher ID or Email";
    if (roleId === "parent") return isRTL ? "أدخل البريد الإلكتروني المسجل لولي الأمر" : "Enter Parent Email";
    if (roleId === "bus") return isRTL ? "أدخل البريد الإلكتروني لمشرف الحافلة" : "Enter Supervisor Email";
    if (roleId === "admin") return isRTL ? "أدخل بريد المدير الإلكتروني" : "Enter Admin Email";
    return isRTL ? "أدخل البريد الإلكتروني أو الرقم الوظيفي" : "Enter Email or Employee ID";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      let resolvedRole = selectedRole.id;
      // Admin uses the admin role directly
      if (resolvedRole === "admin") {
        resolvedRole = "admin";
      } else if (resolvedRole === "support") {
        resolvedRole = "staff";
      }

      await login(resolvedRole, identifier.trim(), password);
      // On success, AuthContext sets isAuthenticated and RoleGate will let through
    } catch (err) {
      console.error("Login failed:", err);
      let message = err.message;
      if (err.message.includes("Failed to fetch")) {
        message = isRTL ? "عذراً، تعذر الاتصال بالخادم. يرجى التحقق من الشبكة." : "Connection failed. Please check your network.";
      } else if (err.message.toLowerCase().includes("invalid password") || err.message.toLowerCase().includes("credentials")) {
        message = isRTL ? "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى." : "Incorrect password. Please try again.";
      } else if (err.message.toLowerCase().includes("not found")) {
        message = isRTL ? "الحساب غير مسجل في النظام أو غير نشط حالياً." : "Account not registered or inactive.";
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 end-4 z-50">
        <button 
          onClick={toggleLanguage}
          className={`${btnOutline} h-10 px-4 font-bold text-[10px] gap-1.5 shadow-sm`}
        >
          {language === "ar" ? "English" : "العربية"}
          <Sparkles size={14} className="text-primary" />
        </button>
      </div>

      <div className="max-w-6xl w-full relative z-10 mx-auto px-4">
        {/* Header - Always LTR for proper centering */}
        <header className="text-center mb-8 space-y-2 flex flex-col items-center justify-center w-full" dir="ltr">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center h-14 w-14 rounded-xl bg-stone-900 text-white shadow-2xl mb-4"
          >
            <Lock size={28} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight"
          >
            Edu<span className="text-primary">Track</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-stone-400 text-sm font-medium max-w-lg"
          >
            {isRTL ? "نظام إدارة التعليم الذكي. اختر بوابتك للمتابعة." : "Smart Education Management System. Choose your portal to continue."}
          </motion.p>
        </header>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {roles.map((role) => (
            <motion.div
              key={role.id}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              whileHover={{ y: -5 }}
              onClick={() => {
                openLoginPopup(role);
              }}
              className="group cursor-pointer"
            >
              <Card className="p-6 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[24px] bg-white relative overflow-hidden h-full flex flex-col items-center text-center">
                <div className={`h-16 w-16 rounded-[20px] ${role.color} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <role.icon size={32} />
                </div>
                
                <h3 className="text-lg font-serif font-black text-stone-900 mb-1.5 group-hover:text-primary transition-colors">
                  {isRTL ? role.label.ar : role.label.en}
                </h3>
                <p className="text-stone-400 text-xs font-medium mb-4">
                  {isRTL ? role.desc.ar : role.desc.en}
                </p>
                
                <div className="mt-auto">
                  <div className={`h-8 w-8 rounded-full border-2 border-stone-50 flex items-center justify-center text-stone-200 group-hover:border-primary group-hover:text-primary transition-all duration-500`}>
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Hover Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <role.icon size={60} />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <footer className="mt-12 text-center">
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            {isRTL ? "مدعوم من" : "Powered by"} 
            <span className="text-stone-900 font-black">EduTrack Advanced Engine</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            V 2.0.4
          </p>
        </footer>
      </div>

      {/* ============================================ */}
      {/*   LOGIN POPUP MODAL (OVERLAY)                */}
      {/* ============================================ */}
      <AnimatePresence>
        {selectedRole && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={closeLoginPopup}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              onClick={(e) => { if (e.target === e.currentTarget) closeLoginPopup(); }}
            >
              <div 
                className="w-full max-w-md rounded-[28px] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] border border-stone-100 overflow-hidden relative" 
                dir={isRTL ? "rtl" : "ltr"}
              >
                {/* Modal Header */}
                <div className="relative p-6 pb-4">
                  {/* Close Button */}
                  <button
                    onClick={closeLoginPopup}
                    className="absolute top-4 end-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all cursor-pointer z-10"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-[16px] ${selectedRole.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <selectedRole.icon size={28} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-stone-900 font-sans leading-tight">
                        {isRTL ? selectedRole.label.ar : selectedRole.label.en}
                      </h2>
                      <p className="text-stone-400 text-xs font-medium mt-0.5">
                        {isRTL ? "أدخل بيانات الاعتماد الآمنة للدخول" : "Enter your secure credentials to sign in"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-stone-100 mx-6" />

                {/* Login Form */}
                <form onSubmit={handleLogin} className="p-6 space-y-5">
                  
                  {/* Error Alert */}
                  <AnimatePresence mode="wait">
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600"
                      >
                        <AlertCircle className="shrink-0 mt-0.5" size={15} />
                        <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Identifier Field */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {isRTL ? "البريد الإلكتروني / المعرف" : "Email / Identifier"}
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={getPlaceholder(selectedRole.id)}
                      className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-sans text-start"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {isRTL ? "كلمة المرور" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-sans text-start"
                        style={{ 
                          paddingInlineEnd: '3rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 flex items-center justify-center text-stone-400 hover:text-stone-600 w-10 h-10 my-auto cursor-pointer ${
                          isRTL ? "left-1" : "right-1"
                        }`}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-primary text-white font-black text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>{isRTL ? "جاري التحقق..." : "Verifying..."}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>{isRTL ? "تسجيل دخول آمن" : "Secure Sign In"}</span>
                      </>
                    )}
                  </button>

                  {(selectedRole.id === "staff" || selectedRole.id === "support") && (
                    <button
                      type="button"
                      onClick={() => {
                        const guestUser = selectedRole.id === "support" 
                          ? { id: "support-guest", full_name: isRTL ? "مهندس الدعم الفني" : "Technical Support", email: "support@edutrack.com", role: "support" }
                          : { id: "staff-guest", full_name: isRTL ? "موظف زائر" : "Staff Guest", email: "guest@edutrack.com", role: "staff" };
                        
                        localStorage.setItem("portal_role", guestUser.role);
                        localStorage.setItem("portal_user", JSON.stringify(guestUser));
                        localStorage.setItem("portal_user_id", guestUser.id);
                        localStorage.setItem("portal_user_name", guestUser.full_name);
                        localStorage.setItem("portal_is_auth", "true");
                        window.location.href = "/staff-portal";
                      }}
                      className="w-full h-12 rounded-xl border-2 border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{isRTL ? "دخول سريع (زائر)" : "Quick Login (Guest)"}</span>
                    </button>
                  )}

                  {/* Security Badge */}
                  <div className="text-center pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 flex items-center justify-center gap-1.5">
                      <Lock size={9} />
                      {isRTL ? "اتصال مشفر وآمن" : "Encrypted & Secure Connection"}
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
