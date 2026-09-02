import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function StudentLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await login("student", identifier.trim(), password);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/student-panel");
    } catch (err) {
      console.error("Login failed:", err);
      let message = err.message;
      if (err.message.includes("Failed to fetch")) {
        message = "عذراً، تعذر الاتصال بالخادم. يرجى التحقق من الشبكة.";
      } else if (
        err.message.toLowerCase().includes("invalid password") ||
        err.message.toLowerCase().includes("credentials")
      ) {
        message = "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.";
      } else if (err.message.toLowerCase().includes("not found")) {
        message = "الحساب غير مسجل في النظام أو غير نشط حالياً.";
      }
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 mx-auto">
        {/* Header */}
        <header className="text-center mb-8 space-y-3 flex flex-col items-center justify-center w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl mb-2"
          >
            <GraduationCap size={32} />
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
            className="text-stone-500 text-sm font-bold"
          >
            بوابة الطالب
          </motion.p>
        </header>

        {/* Login Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[28px] shadow-xl border border-stone-100 overflow-hidden"
        >
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {/* Error Alert */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={15} />
                <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
              </motion.div>
            )}

            {/* Identifier Field */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                البريد الإلكتروني / الرقم الأكاديمي
              </label>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="أدخل البريد الإلكتروني أو الرقم الأكاديمي"
                className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-sans text-start"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-sans text-start"
                  style={{ paddingInlineEnd: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-1 flex items-center justify-center text-stone-400 hover:text-stone-600 w-10 h-10 my-auto cursor-pointer"
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
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </button>

            {/* Security Badge */}
            <div className="text-center pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 flex items-center justify-center gap-1.5">
                <Lock size={9} />
                اتصال مشفر وآمن
              </p>
            </div>
          </form>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center space-y-3"
        >
          <Link
            to="/student-register"
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors block"
          >
            ليس لديك حساب؟ سجل الآن
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
          >
            العودة للرئيسية
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Version */}
        <div className="mt-8 text-center">
          <p className="text-stone-300 text-[10px] font-bold uppercase tracking-widest">
            EduTrack v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
