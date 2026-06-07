import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Lock,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  Calendar,
  Phone,
  UserCheck,
  DoorOpen,
  Wifi
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white/50 backdrop-blur-md text-stone-800 hover:bg-stone-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffPortal() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  
  const currentRole = localStorage.getItem("portal_role") || "staff";
  const currentUserStr = localStorage.getItem("portal_user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  // Dialog & Login state for specific departments
  const [selectedDept, setSelectedDept] = useState(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Security View state (Mock Visitor log data)
  const [visitorName, setVisitorName] = useState("");
  const [visitorReason, setVisitorReason] = useState("");
  const [visitors, setVisitors] = useState([
    { id: 1, name: isRTL ? "أحمد المحمود" : "Ahmad Al-Mahmoud", reason: isRTL ? "مقابلة الإدارة" : "Admin Meeting", time: "09:30 AM", status: "Checked In" },
    { id: 2, name: isRTL ? "سارة الضاهر" : "Sara Al-Daher", reason: isRTL ? "استلام شهادة" : "Certificate Pickup", time: "10:15 AM", status: "Checked In" },
  ]);

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
      color: "bg-stone-850 text-white",
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
  ];

  const handlePortalClick = (path, id) => {
    // If the user is logged in as a general staff (guest)
    // and they click a specific department, we prompt them to log in for that department.
    if (currentRole === "staff") {
      setSelectedDept(subPortals.find(p => p.id === id));
      setIdentifier("");
      setPassword("");
      setShowPassword(false);
      setErrorMsg("");
    } else {
      // If they are already logged in specifically
      if (id === "security") {
        // Just let them view the custom security screen in this component
        localStorage.setItem("portal_role", "security");
        window.location.reload();
      } else {
        localStorage.setItem("portal_role", id);
        window.location.href = path;
      }
    }
  };

  const handleDeptLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // @ts-ignore
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const loginUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/login` : '/neon-db/auth/login';
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'staff', identifier: identifier.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "بيانات الدخول غير صحيحة");
      }

      // Check if the staff member role matches the clicked department
      const userRole = data.user.role ? data.user.role.toLowerCase() : "";
      data.user.role = userRole;
      
      // Map roles to make sure they align
      const targetDeptId = selectedDept.id; // e.g. registrar, bus_supervisor, store_keeper, security, hr, accountant
      
      const isMatch = 
        (targetDeptId === "registrar" && userRole === "registrar") ||
        (targetDeptId === "hr" && userRole === "hr") ||
        (targetDeptId === "accountant" && userRole === "accountant") ||
        (targetDeptId === "store_keeper" && (userRole === "store" || userRole === "store_keeper")) ||
        (targetDeptId === "bus_supervisor" && (userRole === "bus" || userRole === "bus_supervisor")) ||
        (targetDeptId === "security" && userRole === "security");

      if (!isMatch) {
        throw new Error(isRTL ? "عذراً، هذا الحساب غير مصرح له بالدخول لهذا القسم الإداري" : "This account is not authorized for this department");
      }

      // Login success
      toast.success(isRTL ? `مرحباً بك في قسم ${selectedDept.label.ar}` : `Welcome to ${selectedDept.label.en}`);
      
      localStorage.setItem("portal_role", userRole);
      localStorage.setItem("portal_user", JSON.stringify(data.user));
      localStorage.setItem("portal_user_id", data.user.id);
      localStorage.setItem("portal_user_name", data.user.full_name);
      localStorage.setItem("portal_is_auth", "true");

      setSelectedDept(null);
      
      if (targetDeptId === "security") {
        window.location.reload();
      } else {
        window.location.href = selectedDept.path;
      }
    } catch (err) {
      setErrorMsg(err.message || (isRTL ? "خطأ في تسجيل الدخول" : "Login error"));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    localStorage.removeItem("portal_is_auth");
    window.location.href = "/";
  };

  const handleLogoutDept = () => {
    // Log out of specific department and return to guest staff role
    localStorage.setItem("portal_role", "staff");
    localStorage.setItem("portal_user", JSON.stringify({
      id: "staff-guest",
      full_name: "موظف زائر",
      email: "guest@edutrack.com",
      role: "staff"
    }));
    localStorage.setItem("portal_user_id", "staff-guest");
    localStorage.setItem("portal_user_name", "موظف زائر");
    window.location.href = "/staff-portal";
  };

  const handleAddVisitor = (e) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    const newVisitor = {
      id: Date.now(),
      name: visitorName,
      reason: visitorReason || (isRTL ? "زيارة عامة" : "General Visit"),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Checked In"
    };

    setVisitors([newVisitor, ...visitors]);
    setVisitorName("");
    setVisitorReason("");
    toast.success(isRTL ? "تم تسجيل دخول الزائر" : "Visitor checked in successfully");
  };

  const handleCheckOutVisitor = (id) => {
    setVisitors(visitors.map(v => v.id === id ? { ...v, status: "Checked Out" } : v));
    toast.success(isRTL ? "تم تسجيل خروج الزائر" : "Visitor checked out successfully");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // RENDER SECURITY PORTAL IN-PAGE
  if (currentRole === "security") {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col p-4 md:p-8" dir={isRTL ? "rtl" : "ltr"}>
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
            <button 
              onClick={handleLogoutDept}
              className={`${btnOutline} border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 h-10 px-4 rounded-xl text-xs`}
            >
              <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
              {isRTL ? "بوابة الموظفين" : "Staff Portal"}
            </button>
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
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${visitor.status === 'Checked In' ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-700 text-stone-400'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{visitor.name}</h4>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{visitor.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="text-xs font-bold text-stone-300 num-en">{visitor.time}</p>
                        <span className={`text-[9px] font-black uppercase ${visitor.status === 'Checked In' ? 'text-emerald-500' : 'text-stone-400'}`}>
                          {visitor.status === 'Checked In' ? (isRTL ? "موجود بالحرم" : "On Campus") : (isRTL ? "غادر" : "Departed")}
                        </span>
                      </div>

                      {visitor.status === "Checked In" && (
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
      </div>
    );
  }

  // GENERAL STAFF PORTAL VIEW (WITH FREE ACCESS AS GENERAL STAFF GUEST)
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
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
                <p className="text-stone-400 text-xs font-medium mb-4">
                  {isRTL ? "تسجيل الدخول للقسم" : "Access department dashboard"}
                </p>
                
                <div className="mt-auto">
                  <div className={`h-8 w-8 rounded-full border-2 border-stone-50 flex items-center justify-center text-stone-200 group-hover:border-primary group-hover:text-primary transition-all duration-500`}>
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Hover Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <portal.icon size={60} />
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

      {/* DEPARTMENT LOGIN DIALOG */}
      <AnimatePresence>
        {selectedDept && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedDept(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            >
              <div 
                className="w-full max-w-md rounded-[28px] bg-white shadow-2xl border border-stone-100 overflow-hidden relative pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 pb-4 relative">
                  <button
                    onClick={() => setSelectedDept(null)}
                    className="absolute top-4 end-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-[16px] ${selectedDept.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <selectedDept.icon size={28} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-stone-900 font-serif leading-tight">
                        {isRTL ? `تسجيل دخول | قسم ${selectedDept.label.ar}` : `Login | ${selectedDept.label.en}`}
                      </h2>
                      <p className="text-stone-400 text-xs font-semibold mt-0.5">
                        {isRTL ? "أدخل المعرف الوظيفي أو البريد مع كلمة المرور للتحقق" : "Enter employee ID/Email and password to verify"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-stone-100 mx-6" />

                {/* Form */}
                <form onSubmit={handleDeptLogin} className="p-6 space-y-5">
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

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {isRTL ? "البريد الإلكتروني / الرقم الوظيفي" : "Email / Employee ID"}
                    </label>
                    <Input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={isRTL ? "أدخل البريد الإلكتروني أو الرقم الوظيفي للموظف" : "Enter employee email or ID"}
                      className="h-12 rounded-xl border-stone-200 bg-stone-50 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {isRTL ? "كلمة المرور" : "Password"}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 rounded-xl border-stone-200 bg-stone-50 font-semibold pr-12 pl-4"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-primary text-white font-serif font-black text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>{isRTL ? "جاري التحقق من الموظف..." : "Verifying..."}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>{isRTL ? "تأكيد والذهاب للقسم" : "Verify & Access Department"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
