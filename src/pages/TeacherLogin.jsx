import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { GraduationCap, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function TeacherLogin() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login("teacher", identifier.trim(), password);
      toast.success("تم تسجيل الدخول بنجاح");
      window.location.href = "/teacher-panel";
    } catch (err) {
      let message = err.message;
      if (err.message.includes("Failed to fetch")) {
        message = "عذراً، تعذر الاتصال بالخادم. يرجى التحقق من الشبكة.";
      } else if (err.message.toLowerCase().includes("invalid password") || err.message.toLowerCase().includes("credentials")) {
        message = "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.";
      } else if (err.message.toLowerCase().includes("not found")) {
        message = "الحساب غير مسجل في النظام أو غير نشط حالياً.";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[28px] shadow-xl border border-stone-100 overflow-hidden">
          <div className="p-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-16 w-16 rounded-[20px] bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-600/20"
            >
              <GraduationCap size={32} />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-serif font-black text-stone-900 tracking-tight"
            >
              Edu<span className="text-emerald-600">Track</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-stone-500 text-sm font-bold mt-1"
            >
              بوابة المعلم
            </motion.p>
          </div>

          <div className="h-px bg-stone-100 mx-6" />

          <form onSubmit={handleLogin} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                البريد الإلكتروني / الرقم الوظيفي
              </label>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="أدخل البريد الإلكتروني أو الرقم الوظيفي"
                className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-start"
              />
            </div>

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
                  className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-start"
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

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full h-12 rounded-xl bg-emerald-600 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          <div className="px-6 pb-6 space-y-3">
            <div className="text-center">
              <Link
                to="/teacher-register"
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                ليس لديك حساب؟ سجل الآن
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ArrowRight size={12} />
                العودة للرئيسية
              </Link>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 flex items-center justify-center gap-1.5">
                <Lock size={9} />
                اتصال مشفر وآمن
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
