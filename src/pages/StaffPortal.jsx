import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Users, 
  FileText, 
  CreditCard, 
  ShoppingCart, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft,
  Shield,
  Bus,
  Bell,
  UserCheck,
  DoorOpen,
  Wifi,
  HeartHandshake,
  Megaphone,
  Clock,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { goToSchoolPortals } from "@/lib/portalNavigation";
import SupportWidget from "@/components/shared/SupportWidget";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white/50 backdrop-blur-md text-stone-800 hover:bg-stone-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

// Map department IDs to the role values the server returns
const DEPT_ROLE_MAP = {
  registrar: ["registrar"],
  bus_supervisor: ["bus_supervisor", "bus"],
  store_keeper: ["store_keeper", "store"],
  security: ["security"],
  hr: ["hr"],
  accountant: ["accountant"],
  counselor: ["counselor", "counseling"],
};

export default function StaffPortal() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { user } = useAuth();
  
  const currentRole = localStorage.getItem("portal_role") || user?.role || "staff";
  const currentUserStr = localStorage.getItem("portal_user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  // ─── Login Modal State ───
  const [loginPortal, setLoginPortal] = useState(null);     // The portal object being logged into
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Security View state (Mock Visitor log data)
  const [visitorName, setVisitorName] = useState("");
  const [visitorReason, setVisitorReason] = useState("");
  const queryClient = useQueryClient();
  const { data: visitors = [] } = useQuery({
    queryKey: ["visitors-today"],
    queryFn: () => entities.Visitor.list("-created_at", 50),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30
  });

  // Official announcements targeted at staff
  const { data: officialAnnouncements = [] } = useQuery({
    queryKey: ["official-announcements-staff"],
    // @ts-ignore
    queryFn: () => entities.OfficialAnnouncement.list("-created_at"),
    staleTime: 1000 * 60 * 2
  });

  const staffAnnouncements = React.useMemo(() => {
    return officialAnnouncements.filter(a => {
      if (a.target_audience !== "staff" && a.target_audience !== "all") return false;
      if (a.target_audience === "all") return true;
      const dept = a.target_department;
      if (!dept || dept === "all_staff") return true;
      return dept === currentRole;
    });
  }, [officialAnnouncements, currentRole]);

  const getDeptLabel = (deptId) => {
    const map = {
      all_staff: isRTL ? "كل الأقسام" : "All departments",
      registrar: isRTL ? "المسجل" : "Registrar",
      bus_supervisor: isRTL ? "مشرف حافلة" : "Bus Supervisor",
      store_keeper: isRTL ? "أمين مستودع" : "Store Keeper",
      security: isRTL ? "حارس أمن" : "Security Guard",
      hr: isRTL ? "الموارد البشرية" : "Human Resources",
      accountant: isRTL ? "المحاسب" : "Accountant",
      counselor: isRTL ? "المرشد الطلابي" : "Student Counselor",
    };
    return map[deptId] || deptId;
  };

  const subPortals = [
    { 
      id: "registrar", 
      icon: FileText, 
      label: { ar: "المسجل", en: "Registrar" }, 
      color: "bg-orange-500 text-white",
      path: "/student-directory"
    },
    { 
      id: "bus_supervisor", 
      icon: Bus, 
      label: { ar: "مشرف حافلة", en: "Bus Supervisor" }, 
      color: "bg-amber-500 text-stone-900",
      path: "/bus-supervisor"
    },
    { 
      id: "store_keeper", 
      icon: ShoppingCart, 
      label: { ar: "أمين مستودع", en: "Store Keeper" }, 
      color: "bg-blue-600 text-white",
      path: "/store"
    },
    { 
      id: "security", 
      icon: Shield, 
      label: { ar: "حارس أمن", en: "Security Guard" }, 
      color: "bg-stone-800 text-white",
      path: "#security"
    },
    { 
      id: "hr", 
      icon: Users, 
      label: { ar: "الموارد البشرية", en: "Human Resources" }, 
      color: "bg-purple-600 text-white",
      path: "/staff-control"
    },
    { 
      id: "accountant", 
      icon: CreditCard, 
      label: { ar: "المحاسب", en: "Accountant" }, 
      color: "bg-rose-600 text-white",
      path: "/finance"
    },
    {
      id: "counselor",
      icon: HeartHandshake,
      label: { ar: "المرشد الطلابي", en: "Student Counselor" },
      color: "bg-emerald-600 text-white",
      path: "/counseling"
    }
  ];

  // ─── Secure Login Flow ───
  const openLoginModal = (portal) => {
    setLoginPortal(portal);
    setLoginIdentifier("");
    setLoginPassword("");
    setLoginShowPassword(false);
    setLoginError("");
    setLoginLoading(false);
  };

  const closeLoginModal = () => {
    setLoginPortal(null);
    setLoginIdentifier("");
    setLoginPassword("");
    setLoginShowPassword(false);
    setLoginError("");
    setLoginLoading(false);
  };

  const handleDeptLogin = async (e) => {
    e.preventDefault();
    if (!loginPortal) return;
    setLoginError("");
    setLoginLoading(true);

    try {
      const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
      const schoolId = localStorage.getItem("portal_school_id") || user?.school_id || null;

      const response = await fetch(`${apiBase}/neon-db/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "staff",
          identifier: loginIdentifier.trim(),
          password: loginPassword,
          schoolId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          const mins = Math.max(1, Math.ceil((data.retry_after || 0) / 60));
          throw new Error(
            isRTL
              ? `محاولات فاشلة كثيرة. يرجى المحاولة بعد ${mins} دقيقة.`
              : `Too many failed attempts. Try again in ${mins} minute(s).`
          );
        }
        throw new Error(
          data.error_ar || data.error ||
          (isRTL ? "بيانات الدخول غير صحيحة" : "Invalid credentials")
        );
      }

      // ─── Verify the returned role matches the selected department ───
      const returnedRole = (data.user?.role || "").toLowerCase();
      const allowedRoles = DEPT_ROLE_MAP[loginPortal.id] || [loginPortal.id];

      // Admin override: admins may access any department
      if (returnedRole !== "admin" && !allowedRoles.includes(returnedRole)) {
        const deptName = isRTL ? loginPortal.label.ar : loginPortal.label.en;
        throw new Error(
          isRTL
            ? `هذا الحساب غير مخصص لقسم «${deptName}». دورك الحالي: ${getDeptLabel(returnedRole)}`
            : `This account is not assigned to "${deptName}". Your role: ${getDeptLabel(returnedRole)}`
        );
      }

      // ─── Success: store session and navigate ───
      const loggedUser = data.user;
      const effectiveRole = returnedRole === "admin" ? loginPortal.id : returnedRole;

      localStorage.setItem("portal_role", effectiveRole);
      localStorage.setItem("portal_user", JSON.stringify(loggedUser));
      localStorage.setItem("portal_user_id", loggedUser.id);
      localStorage.setItem("portal_user_name", loggedUser.full_name || "");
      localStorage.setItem("portal_is_auth", "true");
      localStorage.setItem("portal_gateway_passed", "true");
      if (loggedUser.school_id) {
        localStorage.setItem("portal_school_id", loggedUser.school_id);
      }
      if (data.token) {
        localStorage.setItem("portal_jwt_token", data.token);
      }

      closeLoginModal();

      if (loginPortal.id === "security") {
        window.location.reload();
      } else {
        window.location.href = loginPortal.path;
      }
    } catch (err) {
      setLoginError(
        err.message ||
        (isRTL ? "فشل تسجيل الدخول. تحقق من البيانات." : "Login failed.")
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePortalClick = (_path, _id) => {
    // Always open the credentials login modal for the clicked department
    const portal = subPortals.find(p => p.id === _id);
    if (portal) {
      openLoginModal(portal);
    }
  };

  const handleBack = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    localStorage.removeItem("portal_is_auth");
    localStorage.removeItem("portal_jwt_token");
    // portal_school_slug is intentionally left intact so the branded
    // portals page can still resolve the school.
    goToSchoolPortals();
  };

  const handleLogoutDept = () => {
    // Leave the department and go back to the grid. This demotes `portal_role`
    // and nothing else — leaving a department is not an authorisation event.
    //
    // It used to authorise: it fabricated a `staff-guest` user object and wrote
    // `portal_is_auth` / `portal_gateway_passed` from the browser, so reaching
    // this button minted an authenticated session with no credential check and
    // no server call. Whatever session exists now is the one a real login set;
    // picking another department still asks for that department's credential.
    localStorage.setItem("portal_role", "staff");
    window.location.href = "/staff-portal";
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    try {
      await entities.Visitor.create({
        visitor_name: visitorName,
        reason: visitorReason || (isRTL ? "زيارة عامة" : "General Visit"),
        status: "checked_in",
        recorded_by: currentUser?.full_name || currentUser?.id || "security"
      });

      setVisitorName("");
      setVisitorReason("");
      queryClient.invalidateQueries({ queryKey: ["visitors-today"] });
      toast.success(isRTL ? "تم تسجيل دخول الزائر" : "Visitor checked in successfully");
    } catch (err) {
      toast.error(isRTL ? "فشل تسجيل الزائر" : "Failed to check in visitor");
    }
  };

  const handleCheckOutVisitor = async (id) => {
    try {
      await entities.Visitor.update(id, {
        status: "checked_out",
        check_out_time: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ["visitors-today"] });
      toast.success(isRTL ? "تم تسجيل خروج الزائر" : "Visitor checked out successfully");
    } catch (err) {
      toast.error(isRTL ? "فشل تسجيل الخروج" : "Failed to check out visitor");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // RENDER SECURITY PORTAL IN-PAGE
  if (currentRole === "security") {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col p-4 md:p-8" dir={isRTL ? "rtl" : "ltr"}>
        <SupportWidget />
        {/* Header */}
        <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between border-b border-stone-800 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center shadow-lg">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-white">
                {isRTL ? "لوحة التحكم الأمنية | حارس الأمن" : "Security Dashboard | Guard Station"}
              </h1>
              <p className="text-stone-400 text-xs mt-0.5">
                {isRTL ? "إدارة بوابات الحرم المدرسي وسجل الزوار النشط" : "Manage campus gates and active visitors log"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-800 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-bold border border-emerald-500/20">
              <Wifi size={14} className="animate-pulse" />
              {isRTL ? "متصل بالنظام" : "System Connected"}
            </div>
            {user?.role === "admin" ? (
              <button 
                onClick={handleLogoutDept}
                className={`${btnOutline} border-stone-750 bg-stone-800 text-stone-200 hover:bg-stone-700 h-10 px-4 rounded-xl text-xs`}
              >
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "العودة للبوابات" : "Back to Portals"}
              </button>
            ) : (
              <button 
                onClick={handleLogoutDept}
                className={`${btnOutline} border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 h-10 px-4 rounded-xl text-xs`}
              >
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "بوابة الموظفين" : "Staff Portal"}
              </button>
            )}
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visitor Registration Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl">
              <h3 className="text-lg font-serif font-black text-white mb-4 flex items-center gap-2">
                <DoorOpen className="text-amber-500" size={18} />
                {isRTL ? "تسجيل زائر جديد" : "New Visitor Registration"}
              </h3>
              <form onSubmit={handleAddVisitor} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1.5">{isRTL ? "اسم الزائر" : "Visitor Name"}</label>
                  <Input 
                    placeholder={isRTL ? "مثال: رائد محمد" : "e.g. Raed Mohammad"} 
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    className="bg-stone-800 border-stone-750 text-white focus-visible:ring-amber-500 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1.5">{isRTL ? "سبب الزيارة" : "Reason for Visit"}</label>
                  <Input 
                    placeholder={isRTL ? "مثال: موعد مع المدير" : "e.g. Meeting with Principal"} 
                    value={visitorReason}
                    onChange={e => setVisitorReason(e.target.value)}
                    className="bg-stone-800 border-stone-750 text-white focus-visible:ring-amber-500 h-11 rounded-xl"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <UserCheck size={16} />
                  {isRTL ? "تسجيل دخول وتصريح" : "Issue Pass & Check In"}
                </button>
              </form>
            </Card>

            {/* Electronic Gate Control */}
            <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl space-y-4">
              <h3 className="text-lg font-serif font-black text-white flex items-center gap-2">
                <Shield className="text-emerald-500" size={18} />
                {isRTL ? "البوابات الإلكترونية" : "Electronic Gates"}
              </h3>
              <div className="space-y-3">
                {[
                  { name: isRTL ? "بوابة السيارات الرئيسية" : "Main Gate Auto", status: "Closed", color: "text-rose-500" },
                  { name: isRTL ? "مدخل المشاة الشرقي" : "East Pedestrian", status: "Open", color: "text-emerald-500" },
                  { name: isRTL ? "بوابة الحافلات الخلفية" : "Rear Bus Gate", status: "Closed", color: "text-rose-500" }
                ].map((gate, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-stone-800/60 border border-stone-750 rounded-2xl">
                    <span className="text-xs font-bold text-stone-200">{gate.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase ${gate.color}`}>{gate.status}</span>
                      <button 
                        onClick={() => toast.success(isRTL ? "تم إرسال إشارة التحكم" : "Control signal sent")}
                        className="h-8 px-3 rounded-lg bg-stone-700 hover:bg-stone-600 text-[10px] font-bold text-stone-100 transition-colors"
                      >
                        {isRTL ? "تبديل" : "Toggle"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Visitor Log List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl min-h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-serif font-black text-white flex items-center gap-2">
                    <Bell className="text-amber-500 animate-bounce" size={18} />
                    {isRTL ? "سجل الزوار اليوم النشط" : "Active Daily Visitor Log"}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-semibold">{isRTL ? "تتبع فوري لحالات الدخول والخروج" : "Real-time track of entry and exit"}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                {visitors.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-4 bg-stone-800/40 border border-stone-750 rounded-2xl hover:bg-stone-800/80 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${visitor.status === 'checked_in' ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-700 text-stone-400'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{visitor.visitor_name}</h4>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{visitor.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="text-xs font-bold text-stone-300 num-en">
                          {visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </p>
                        <span className={`text-[9px] font-black uppercase ${visitor.status === 'checked_in' ? 'text-emerald-500' : 'text-stone-400'}`}>
                          {visitor.status === 'checked_in' ? (isRTL ? "موجود بالحرم" : "On Campus") : (isRTL ? "غادر" : "Departed")}
                        </span>
                      </div>

                      {visitor.status === "checked_in" && (
                        <button 
                          onClick={() => handleCheckOutVisitor(visitor.id)}
                          className="h-8 px-4 rounded-xl bg-stone-700 hover:bg-stone-600 text-[10px] font-bold text-white transition-colors"
                        >
                          {isRTL ? "تسجيل خروج" : "Check Out"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {visitors.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-stone-600">
                    <Users size={40} className="mb-2 opacity-10" />
                    <p className="text-xs font-bold">{isRTL ? "لا يوجد زوار مسجلين اليوم" : "No visitors logged today"}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>

        {/* Official announcements for security staff */}
        <section className="max-w-6xl w-full mx-auto mt-8">
          <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={18} className="text-amber-500" />
              <h3 className="text-lg font-serif font-black text-white">
                {isRTL ? "التعاميم والقرارات الرسمية" : "Official Announcements"}
              </h3>
            </div>
            {staffAnnouncements.length === 0 ? (
              <p className="text-xs font-bold text-stone-500 text-center py-6">
                {isRTL ? "لا توجد تعاميم موجهة لقسمك حالياً" : "No announcements for your department right now"}
              </p>
            ) : (
              <div className="space-y-3">
                {staffAnnouncements.map(ann => (
                  <div key={ann.id} className="p-4 bg-stone-800/60 border border-stone-750 rounded-2xl relative overflow-hidden">
                    {ann.priority === "high" && <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h4 className="text-sm font-black text-white">{ann.title}</h4>
                      {ann.priority === "high" && (
                        <span className="bg-rose-500/15 text-rose-400 rounded-lg text-[9px] font-black px-2 py-0.5">
                          {isRTL ? "عاجل" : "Urgent"}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-300 text-xs whitespace-pre-line leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-stone-500 font-bold mt-2 num-en flex items-center gap-1">
                      <Clock size={11} />
                      {ann.created_at ? new Date(ann.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    );
  }

  // GENERAL STAFF PORTAL VIEW (every department below requires its own credential)
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <SupportWidget />
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 start-4 z-50">
        <button 
          onClick={handleBack}
          className={`${btnOutline} h-10 px-4 font-bold text-[10px] gap-1.5 shadow-sm`}
        >
          <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
          {isRTL ? "الرئيسية" : "Main Menu"}
        </button>
      </div>

      <div className="max-w-6xl w-full relative z-10 mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-8 space-y-2 flex flex-col items-center justify-center w-full" dir="ltr">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-600 text-white shadow-2xl mb-4"
          >
            <Users size={28} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight"
          >
            {isRTL ? "بوابة الأقسام الإدارية والمساندة" : "Staff & Support Systems Portal"}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-stone-400 text-sm font-medium max-w-lg"
          >
            {isRTL ? "حدد القسم المطلوب لتسجيل الدخول للوحة التحكم الخاصة به" : "Select a department to access its administrative dashboard"}
          </motion.p>
        </header>

        {/* Sub-Portals Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {subPortals.map((portal) => (
            <motion.div
              key={portal.id}
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              whileHover={{ y: -5 }}
              onClick={() => handlePortalClick(portal.path, portal.id)}
              className="group cursor-pointer"
            >
              <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[24px] bg-white relative overflow-hidden h-full flex flex-col items-center text-center">
                <div className={`h-16 w-16 rounded-[20px] ${portal.color} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <portal.icon size={32} />
                </div>
                
                <h3 className="text-lg font-serif font-black text-stone-900 mb-1.5 group-hover:text-primary transition-colors">
                  {isRTL ? portal.label.ar : portal.label.en}
                </h3>
                <p className="text-stone-400 text-xs font-medium mb-3">
                  {isRTL ? "يتطلب إدخال بيانات الاعتماد" : "Requires credentials"}
                </p>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePortalClick(portal.path, portal.id);
                  }}
                  className="w-full mt-auto h-11 rounded-xl bg-stone-900 hover:bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group-hover:bg-primary"
                >
                  <Lock size={14} />
                  <span>{isRTL ? "تسجيل الدخول للقسم" : "Access Department"}</span>
                  {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Hover Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <portal.icon size={60} />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Official announcements for staff */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-[16px] bg-purple-600 text-white flex items-center justify-center shadow-xl">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black text-stone-900">
                    {isRTL ? "التعاميم والقرارات الرسمية" : "Official Announcements"}
                  </h3>
                  <p className="text-stone-400 text-xs font-medium">
                    {isRTL ? "القرارات الموجهة للموظفين والأقسام" : "Decisions addressed to staff and departments"}
                  </p>
                </div>
              </div>
              {staffAnnouncements.filter(a => a.priority === "high").length > 0 && (
                <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black px-3 py-1.5">
                  <ShieldAlert size={13} />
                  {isRTL ? "يوجد تعميم عاجل" : "Urgent circular"}
                </span>
              )}
            </div>

            {staffAnnouncements.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs font-bold bg-stone-50/60 rounded-2xl">
                {isRTL ? "لا توجد تعاميم موجهة للموظفين حالياً" : "No staff announcements right now"}
              </div>
            ) : (
              <div className="space-y-3">
                {staffAnnouncements.map(ann => (
                  <div key={ann.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 relative overflow-hidden">
                    {ann.priority === "high" && <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h4 className="text-sm font-black text-stone-900">{ann.title}</h4>
                      {ann.priority === "high" && (
                        <span className="bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black px-2 py-0.5">
                          {isRTL ? "عاجل" : "Urgent"}
                        </span>
                      )}
                      {ann.target_audience === "staff" && ann.target_department && ann.target_department !== "all_staff" && (
                        <span className="bg-purple-50 text-purple-700 rounded-lg text-[9px] font-black px-2 py-0.5">
                          {getDeptLabel(ann.target_department)}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 text-xs whitespace-pre-line leading-relaxed">{ann.content}</p>
                    <p className="text-[10px] text-stone-400 font-bold mt-2 num-en flex items-center gap-1">
                      <Clock size={11} />
                      {ann.created_at ? new Date(ann.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.section>

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
      {/*   DEPARTMENT LOGIN POPUP MODAL (Radix Dialog) */}
      {/* ============================================ */}
      <Dialog open={!!loginPortal} onOpenChange={(open) => { if (!open) closeLoginModal(); }}>
        <DialogContent 
          className="max-w-md w-[92vw] sm:w-full rounded-[28px] bg-white shadow-2xl border border-stone-100 p-0 overflow-hidden"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {loginPortal && (
            <div>
              {/* Modal Header */}
              <div className="relative p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-[16px] ${loginPortal.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <loginPortal.icon size={28} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-stone-900 font-sans leading-tight">
                      {isRTL ? loginPortal.label.ar : loginPortal.label.en}
                    </h2>
                    <p className="text-stone-400 text-xs font-medium mt-0.5">
                      {isRTL ? "أدخل بيانات الاعتماد الآمنة للدخول لهذا القسم" : "Enter your secure credentials to access this department"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-stone-100 mx-6" />

              {/* Login Form */}
              <form onSubmit={handleDeptLogin} className="p-6 space-y-4">
                {/* Error Alert */}
                {loginError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
                    <AlertCircle className="shrink-0 mt-0.5" size={15} />
                    <p className="text-xs font-bold leading-relaxed">{loginError}</p>
                  </div>
                )}

                {/* Identifier Field */}
                <div className="space-y-1.5">
                  <label htmlFor="field-staff-dept-identifier" className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                    {isRTL ? "البريد الإلكتروني / الرقم الوظيفي" : "Email / Employee ID"}
                  </label>
                  <input id="field-staff-dept-identifier"
                    type="text"
                    required
                    autoFocus
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={isRTL ? "أدخل البريد الإلكتروني أو الرقم الوظيفي" : "Enter email or employee ID"}
                    className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-sans text-start"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="field-staff-dept-password" className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                    {isRTL ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <input id="field-staff-dept-password"
                      type={loginShowPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-900 px-4 placeholder-stone-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-sans text-start"
                      style={{ paddingInlineEnd: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPassword(!loginShowPassword)}
                      className={`absolute inset-y-0 flex items-center justify-center text-stone-400 hover:text-stone-600 w-10 h-10 my-auto cursor-pointer ${isRTL ? "left-1" : "right-1"}`}
                    >
                      {loginShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 rounded-xl bg-primary text-white font-black text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loginLoading ? (
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

                {/* Security Badge */}
                <div className="text-center pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 flex items-center justify-center gap-1.5">
                    <Lock size={9} />
                    {isRTL ? "اتصال مشفر وآمن" : "Encrypted & Secure Connection"}
                  </p>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
