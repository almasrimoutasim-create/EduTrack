import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Gateway() {
  const { gatewayLogin, appPublicSettings } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const settings = appPublicSettings?.public_settings || {};

  const schoolName = isRTL
    ? (settings.school_name_ar || 'مدارس إديوتراك النموذجية الخاصة')
    : (settings.school_name_en || 'EduTrack Model School');

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = import.meta.env.VITE_BACKEND_URL || '';
    return `${apiBase.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const logoUrl = getFullImageUrl(settings.school_logo);
  const backgroundUrl = getFullImageUrl(settings.school_background_image) || "https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop";

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await gatewayLogin(username.trim(), password);
      // بعد نجاح تسجيل الدخول، ننتقل إلى صفحة الروست legate
      window.location.href = "/rolegate";
    } catch (err) {
      setErrorMsg(err.message || (isRTL ? "فشل تسجيل الدخول. تأكد من البيانات." : "Login failed. Check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
          filter: "blur(8px) brightness(0.6)",
          transform: "scale(1.05)"
        }}
      />

      <div className="absolute inset-0 z-0 bg-black/30 mix-blend-multiply" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="rounded-[32px] bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">

          <div className="p-8 text-center flex flex-col items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName}
                className="h-20 w-auto mb-4 object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center mb-4 shadow-xl">
                <Lock size={32} />
              </div>
            )}

            <h1 className="text-2xl font-black font-serif text-stone-900 mb-2">
              {schoolName}
            </h1>
            <p className="text-stone-500 text-sm font-medium">
              {isRTL ? "بوابة الدخول الرئيسية للمنصة" : "Main Platform Access Gateway"}
            </p>
          </div>

          <div className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">

              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 mb-2">
                      <AlertCircle className="shrink-0 mt-0.5" size={16} />
                      <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                  {isRTL ? "اسم المستخدم" : "Username"}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRTL ? "أدخل اسم المستخدم" : "Enter username"}
                  className="w-full h-14 rounded-2xl border-2 border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-900 px-5 placeholder-stone-300 focus:outline-none focus:border-stone-900 focus:bg-white transition-all text-start"
                />
              </div>

              <div className="space-y-1.5">
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
                    className="w-full h-14 rounded-2xl border-2 border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-900 px-5 placeholder-stone-300 focus:outline-none focus:border-stone-900 focus:bg-white transition-all text-start"
                    style={{ paddingInlineEnd: '3.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 flex items-center justify-center text-stone-400 hover:text-stone-700 w-12 h-12 my-auto cursor-pointer transition-colors ${isRTL ? "left-1" : "right-1"
                      }`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-4 rounded-2xl bg-stone-900 text-white font-black text-sm tracking-wide hover:bg-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isRTL ? "جاري التحقق..." : "Verifying..."}</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>{isRTL ? "دخول آمن" : "Secure Access"}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-sm" style={{ transform: "translateX(-6%)" }}>
                <span className="text-stone-400 text-xs">{isRTL ? "ليس لديك حساب؟" : "Don't have an account?"}</span>
                <a href="/register" className="font-bold text-stone-900 hover:text-black underline underline-offset-4">
                  {isRTL ? "سجل الآن" : "Register now"}
                </a>
              </div>

            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}