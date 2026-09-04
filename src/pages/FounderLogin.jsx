import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const FounderLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/founder-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "بيانات الدخول غير صحيحة");
      localStorage.setItem("founder_token", data.token);
      localStorage.setItem("founder_auth", "true");
      localStorage.setItem("founder_email", (data.user && data.user.email) || email.trim());
      localStorage.setItem("founder_login_time", Date.now().toString());
      localStorage.removeItem("founder_custom_password");
      toast.success("تم تسجيل الدخول بنجاح");
      window.location.href = "/founder-dashboard";
    } catch (err) {
      toast.error(err.message || "بيانات الدخول غير صحيحة");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="relative rounded-3xl p-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
                <GraduationCap className="text-white" size={26} />
              </div>
              <h1 className="text-2xl font-extrabold text-white">EduTrack</h1>
            </div>
            <p className="text-center text-slate-400 text-sm mb-8 flex items-center justify-center gap-2">
              <ShieldCheck size={15} className="text-blue-400" />
              لوحة تحكم المالك
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ادخل بريد المالك"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 text-white placeholder-slate-500 pr-11 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ادخل كلمة المرور"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 text-white placeholder-slate-500 pr-11 pl-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold py-3 text-sm shadow-lg shadow-blue-900/40 disabled:opacity-60"
              >
                {loading ? "جاري التحقق..." : "دخول"}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
              <p className="text-slate-500 text-xs">EduTrack Founder Control Panel v1.0</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FounderLogin;
