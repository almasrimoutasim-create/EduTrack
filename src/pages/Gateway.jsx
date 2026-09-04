import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, Building2, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Gateway() {
  const { schoolSlug: routeSlug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  // Check URL query param fallback (?school=...)
  const querySlug = new URLSearchParams(window.location.search).get("school");
  const schoolSlug = (routeSlug || querySlug || "").trim();

  const [schoolData, setSchoolData] = useState(null);
  const [loadingSchool, setLoadingSchool] = useState(Boolean(schoolSlug));
  const [schoolError, setSchoolError] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Member lock (Option A: shared school credential for teachers/students/staff)
  const [memberUser, setMemberUser] = useState("");
  const [memberPass, setMemberPass] = useState("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState("");

  const handleMemberLogin = async (e) => {
    e.preventDefault();
    setMemberError("");
    if (!schoolData?.id) {
      setMemberError(isRTL ? "تعذر تحديد المدرسة. أعد تحميل الصفحة." : "Could not identify the school. Reload the page.");
      return;
    }
    setMemberSubmitting(true);
    try {
      const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/neon-db/auth/gateway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: memberUser.trim(), password: memberPass, schoolId: schoolData.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || (isRTL ? "بيانات الدخول غير صحيحة" : "Invalid credentials"));
      }
      localStorage.setItem("portal_gateway_passed", "true");
      if (schoolSlug) localStorage.setItem("portal_school_slug", schoolSlug);
      navigate("/login");
    } catch (err) {
      setMemberError(err.message || (isRTL ? "فشل الدخول. تحقق من البيانات." : "Login failed."));
    } finally {
      setMemberSubmitting(false);
    }
  };

  const [searchSlugInput, setSearchSlugInput] = useState("");

  const FALLBACK_BG = "https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop";

  // Fetch school details by slug
  useEffect(() => {
    if (!schoolSlug) {
      setSchoolData(null);
      setLoadingSchool(false);
      return;
    }

    let isMounted = true;
    setLoadingSchool(true);
    setSchoolError(null);

    const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
    const url = `${apiBase}/neon-db/public-school/${encodeURIComponent(schoolSlug)}`;

    fetch(url)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || (isRTL ? "المدرسة غير مسجلة أو الرابط غير صالح" : "School not found"));
        }
        return data;
      })
      .then((data) => {
        if (isMounted) {
          if (data.school) {
            setSchoolData(data.school);
          } else {
            throw new Error(isRTL ? "تعذر العثور على بيانات المدرسة" : "School data not found");
          }
          setLoadingSchool(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSchoolError(err.message || (isRTL ? "تعذر جلب بيانات المدرسة" : "Failed to load school"));
          setLoadingSchool(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [schoolSlug, isRTL]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setSubmitting(true);

    try {
      const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
      const loginUrl = `${apiBase}/neon-db/auth/school-gateway`;

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: schoolSlug,
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || (isRTL ? "بيانات الدخول غير صحيحة" : "Invalid login credentials"));
      }

      // Store Auth Session for School Admin
      const loggedUser = data.user || { role: "admin" };
      localStorage.setItem("portal_role", "admin");
      localStorage.setItem("portal_user", JSON.stringify(loggedUser));
      localStorage.setItem("portal_user_id", loggedUser.id);
      localStorage.setItem("portal_user_name", loggedUser.full_name || schoolData?.name || "مدير المدرسة");
      localStorage.setItem("portal_is_auth", "true");
      localStorage.setItem("portal_gateway_passed", "true");
      localStorage.setItem("portal_school_slug", schoolSlug);
      if (data.school?.id) {
        localStorage.setItem("portal_school_id", data.school.id);
      }
      if (data.token) {
        localStorage.setItem("portal_jwt_token", data.token);
      }

      // Redirect to Admin Dashboard
      window.location.href = "/admin-dashboard";
    } catch (err) {
      setLoginError(err.message || (isRTL ? "فشل تسجيل الدخول. تحقق من اسم المستخدم وكلمة المرور." : "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchSlugInput.trim()) return;
    const clean = searchSlugInput.trim().toLowerCase().replace(/\s+/g, "-");
    navigate(`/gateway/${clean}`);
  };

  const backgroundUrl = schoolData?.background_image || FALLBACK_BG;
  const schoolName = isRTL
    ? (schoolData?.name_ar || schoolData?.name || "بوابة إدارة المدرسة")
    : (schoolData?.name_en || schoolData?.name || "School Management Gateway");

  // State 1: No School Slug Provided (/gateway directly)
  if (!schoolSlug) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-900" dir={isRTL ? "rtl" : "ltr"}>
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-25 filter blur-sm scale-105"
          style={{ backgroundImage: `url('${FALLBACK_BG}')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/80" />

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg relative z-10"
        >
          <Card className="rounded-[32px] bg-white/95 backdrop-blur-2xl border border-white/20 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Building2 size={32} className="text-emerald-400" />
            </div>

            <h1 className="text-2xl font-black text-stone-900 mb-2">
              {isRTL ? "بوابة دخول المدارس المخصصة" : "Dedicated School Gateway"}
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
              {isRTL
                ? "لكل مدرسة مسجلة في منصة EduTrack رابط دخول خاص بها (مثل: /gateway/school-name). يمكنك إدخال رمز أو اسم مدرستك للانتقال مباشرة لبوابتها:"
                : "Each school registered on EduTrack has its unique gateway link (e.g. /gateway/school-name). Enter your school code or slug below:"}
            </p>

            <form onSubmit={handleSearchSubmit} className="space-y-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchSlugInput}
                  onChange={(e) => setSearchSlugInput(e.target.value)}
                  placeholder={isRTL ? "أدخل معرّف أو اسم المدرسة (مثال: al-noor)" : "Enter school code (e.g. al-noor)"}
                  className="w-full h-13 rounded-2xl border-2 border-stone-200 bg-stone-50 px-4 text-sm font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white text-center transition-all"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Search size={16} />
                <span>{isRTL ? "الانتقال إلى بوابة المدرسة" : "Go to School Gateway"}</span>
              </button>
            </form>

            <div className="pt-5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} />
                {isRTL ? "طلب اشتراك لمدرسة جديدة" : "Register New School"}
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto flex-1 h-11 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 inline-flex items-center justify-center gap-1.5"
              >
                {isRTL ? "العودة للرئيسية" : "Back to Home"}
                {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // State 2: Loading School Info
  if (loadingSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold tracking-wide">
            {isRTL ? "جاري تهيئة بوابة المدرسة..." : "Loading school gateway..."}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{schoolSlug}</p>
        </div>
      </div>
    );
  }

  // State 3: School Not Found / Error
  if (schoolError || !schoolData) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="rounded-[32px] bg-white p-8 text-center shadow-2xl border border-stone-200">
            <div className="h-16 w-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertCircle size={32} />
            </div>

            <h2 className="text-xl font-black text-stone-900 mb-2">
              {isRTL ? "المدرسة غير موجودة أو الرابط غير صالح" : "School Gateway Not Found"}
            </h2>
            <p className="text-xs text-stone-500 mb-2 font-mono bg-stone-100 py-1.5 px-3 rounded-lg inline-block" dir="ltr">
              /gateway/{schoolSlug}
            </p>
            <p className="text-stone-600 text-xs leading-relaxed mb-6">
              {isRTL
                ? "لم نتمكن من العثور على مدرسة مسجلة بهذا الرابط. يرجى مراجعة الرابط الذي وصلكم من إدارة منصة EduTrack أو التواصل مع الدعم الفني."
                : "We could not find an active school with this gateway link. Please check the URL or contact EduTrack support."}
            </p>

            <div className="space-y-2">
              <Link
                to="/register"
                className="w-full h-12 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-black inline-flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles size={14} className="text-amber-400" />
                {isRTL ? "طلب تسجيل مدرسة جديدة" : "Register a School"}
              </Link>
              <Link
                to="/"
                className="w-full h-11 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 inline-flex items-center justify-center gap-1.5"
              >
                {isRTL ? "العودة للصفحة الرئيسية" : "Back to Home"}
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // State 4: School Gateway Login Form
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background with blur and custom overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
          filter: "blur(8px) brightness(0.45)",
          transform: "scale(1.1)",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-sm relative z-10"
      >
        <Card className="rounded-3xl bg-white/95 backdrop-blur-xl border-0 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header & School Branding */}
          <div className="px-8 pt-8 pb-5 text-center flex flex-col items-center">
            {schoolData.logo_url ? (
              <img
                src={schoolData.logo_url}
                alt={schoolName}
                className="h-16 w-auto mb-3 object-contain drop-shadow-md max-h-16 rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-white flex items-center justify-center mb-3 shadow-lg">
                <Building2 size={26} className="text-emerald-400" />
              </div>
            )}

            <h1 className="text-xl font-extrabold text-stone-900 mb-1 leading-tight tracking-tight">
              {schoolName}
            </h1>
            <p className="text-stone-400 text-[11px] font-medium">
              {isRTL ? "لوحة الإدارة والتحكم" : "Management Portal"}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 pt-2">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <AnimatePresence mode="wait">
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 mb-1">
                      <AlertCircle className="shrink-0 mt-0.5" size={15} />
                      <p className="text-[12px] font-bold leading-relaxed">{loginError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 px-1">
                  {isRTL ? "اسم المستخدم" : "Username"}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRTL ? "اسم المستخدم" : "Username"}
                  className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 text-[13px] font-semibold text-stone-900 px-3.5 placeholder-stone-400 focus:outline-none focus:border-stone-800 focus:bg-white transition-all text-start"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 px-1">
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 text-[13px] font-semibold text-stone-900 px-3.5 placeholder-stone-400 focus:outline-none focus:border-stone-800 focus:bg-white transition-all text-start"
                    style={{ paddingInlineEnd: "2.8rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 flex items-center justify-center text-stone-400 hover:text-stone-700 w-10 cursor-pointer transition-colors ${
                      isRTL ? "left-1" : "right-1"
                    }`}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 mt-1 rounded-xl bg-stone-900 text-white font-extrabold text-[13px] tracking-wide hover:bg-black hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-stone-900/25"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isRTL ? "جاري التحقق..." : "Verifying..."}</span>
                  </>
                ) : (
                  <span>{isRTL ? "دخول" : "Login"}</span>
                )}
              </button>

              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span className="font-mono">{schoolData.slug || schoolSlug}</span>
                <Link to="/" className="text-stone-500 hover:text-stone-800 font-bold transition-colors">
                  {isRTL ? "EduTrack" : "EduTrack"}
                </Link>
              </div>
            </form>
          </div>
        </Card>

        {/* Member lock card (Option A: shared school credential → RoleLogin) */}
        <Card className="mt-4 rounded-3xl bg-white/95 backdrop-blur-xl border-0 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="px-8 py-6">
            <div className="text-center mb-4">
              <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <Lock size={20} />
              </div>
              <h2 className="text-base font-extrabold text-stone-900">
                {isRTL ? "دخول أعضاء المدرسة" : "School Members Entry"}
              </h2>
              <p className="text-stone-400 text-[11px] font-medium mt-1">
                {isRTL ? "للمعلمين والطلاب والموظفين — أدخل بيانات المدرسة المشتركة للانتقال لاختيار البوابة" : "For teachers, students and staff — enter the shared school credential to reach the portals"}
              </p>
            </div>
            <form onSubmit={handleMemberLogin} className="space-y-3">
              {memberError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
                  <AlertCircle className="shrink-0 mt-0.5" size={15} />
                  <p className="text-[12px] font-bold leading-relaxed">{memberError}</p>
                </div>
              )}
              <input
                type="text"
                required
                value={memberUser}
                onChange={(e) => setMemberUser(e.target.value)}
                placeholder={isRTL ? "اسم مستخدم المدرسة" : "School username"}
                className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 text-[13px] font-semibold text-stone-900 px-3.5 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-start"
              />
              <input
                type="password"
                required
                value={memberPass}
                onChange={(e) => setMemberPass(e.target.value)}
                placeholder={isRTL ? "كلمة مرور المدرسة" : "School password"}
                className="w-full h-11 rounded-xl border border-stone-200 bg-stone-50/80 text-[13px] font-semibold text-stone-900 px-3.5 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-start"
              />
              <button
                type="submit"
                disabled={memberSubmitting}
                className="w-full h-11 rounded-xl bg-emerald-600 text-white font-extrabold text-[13px] tracking-wide hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-70 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
              >
                {memberSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isRTL ? "جاري التحقق..." : "Verifying..."}</span>
                  </>
                ) : (
                  <span>{isRTL ? "دخول الأعضاء" : "Members Entry"}</span>
                )}
              </button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}